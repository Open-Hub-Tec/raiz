import { afterEach, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { CueContext } from './recordingCueFixture';
import { AUDIO_BITS_PER_SECOND, AUDIO_MIME_TYPES, MAX_RECORDING_SECONDS, createAudioRecorder, selectAudioMimeType, startAudioRecording } from '../audioRecorder';

class Track extends EventTarget {
  readyState = 'live';
  stops = 0;
  stop() { this.readyState = 'ended'; this.stops++; }
  getSettings() { return { channelCount: 2, sampleRate: 48_000 }; }
}
class Recorder {
  static supported = [...AUDIO_MIME_TYPES] as string[];
  static options: (MediaRecorderOptions | undefined)[] = [];
  static reject: (options?: MediaRecorderOptions) => boolean = () => false;
  static instance: Recorder;
  static startError = false;
  static stopError = false;
  static startArgs: number[] = [];
  static isTypeSupported(type: string) { return this.supported.includes(type); }
  mimeType = 'audio/webm;codecs=opus';
  audioBitsPerSecond: number;
  state = 'inactive';
  stops = 0;
  ondataavailable: any;
  onstop: any;
  onerror: any;
  constructor(_stream: any, options?: MediaRecorderOptions) {
    Recorder.options.push(options);
    if (Recorder.reject(options)) throw new Error('unsupported option');
    this.mimeType = options?.mimeType || 'audio/mp4';
    this.audioBitsPerSecond = options?.audioBitsPerSecond ?? options?.bitsPerSecond ?? 192_000;
    Recorder.instance = this;
  }
  start(...args: number[]) {
    Recorder.startArgs = args;
    if (Recorder.startError) throw new Error('start failed');
    this.state = 'recording';
  }
  stop() {
    this.stops++;
    if (Recorder.stopError) throw new Error('stop failed');
    assert.notEqual(this.state, 'inactive', 'must not stop twice');
    this.state = 'inactive';
    // Native stop delivers final data asynchronously, after stop() returns.
    queueMicrotask(() => this.flush());
  }
  flush() {
    this.ondataavailable?.({ data: new Blob(['encoded fixture'], { type: this.mimeType }) });
    this.onstop?.();
  }
}
let track: Track;
let stream: MediaStream;
let documentMock: EventTarget & { hidden: boolean };
let fetchCalls: any[];
let createdUrls: Blob[];
const originals = new Map<string, PropertyDescriptor | undefined>();
function global(name: string, value: unknown) {
  originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, value, writable: true });
}
beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout'] });
  track = new Track();
  stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
  documentMock = Object.assign(new EventTarget(), { hidden: false });
  Recorder.supported = [...AUDIO_MIME_TYPES]; Recorder.options = [];
  Recorder.reject = () => false; Recorder.startError = false; Recorder.stopError = false;
  global('navigator', { mediaDevices: { getUserMedia: async () => stream } });
  global('MediaRecorder', Recorder);
  global('document', documentMock);
  global('window', {});
  global('FileReader', class {
    result = 'data:audio/example;base64,' + 'A'.repeat(120);
    onloadend: any;
    readAsDataURL() { queueMicrotask(() => this.onloadend()); }
  });
  fetchCalls = []; createdUrls = [];
  global('fetch', async (...args: any[]) => {
    fetchCalls.push(args);
    return { ok: true, json: async () => ({ transcript: 'Texto del servidor' }) };
  });
  mock.method(URL, 'createObjectURL', (blob: Blob) => {
    createdUrls.push(blob); return 'blob:test';
  });
});
afterEach(() => {
  mock.timers.reset(); mock.restoreAll();
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as any)[name];
  }
  originals.clear();
});

test('deterministic MIME priority puts both Opus containers before native fallbacks', () => {
  assert.deepEqual(AUDIO_MIME_TYPES.slice(0, 3), ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']);
  assert.equal(selectAudioMimeType(() => true), AUDIO_MIME_TYPES[0]);
  assert.equal(selectAudioMimeType((type) => type !== AUDIO_MIME_TYPES[0]), AUDIO_MIME_TYPES[1]);
  assert.equal(selectAudioMimeType(() => false), '');
});
test('Safari capability fallback selects MP4 and requests 24 kbps', () => {
  Recorder.supported = ['audio/mp4'];
  assert.equal(createAudioRecorder(stream).mimeType, 'audio/mp4');
  assert.deepEqual(Recorder.options, [{ mimeType: 'audio/mp4', audioBitsPerSecond: 24_000 }]);
});
test('Opus construction requests 24,000 bps; 30-second policy budgets 90,000 payload bytes', () => {
  createAudioRecorder(stream);
  assert.equal(Recorder.options[0]?.mimeType, AUDIO_MIME_TYPES[0]);
  assert.equal(Recorder.options[0]?.audioBitsPerSecond, 24_000);
  assert.equal(AUDIO_BITS_PER_SECOND * 30 / 8, 90_000);
  assert.ok(AUDIO_BITS_PER_SECOND * 30 / 8 < 150_000);
});
test('retries rejected audio bitrate with the standard total bitrate before dropping the target', () => {
  Recorder.reject = (options) => options?.audioBitsPerSecond !== undefined;
  createAudioRecorder(stream);
  assert.deepEqual(Recorder.options[1], { mimeType: AUDIO_MIME_TYPES[0], bitsPerSecond: 24_000 });
  assert.equal(Recorder.instance.audioBitsPerSecond, 24_000);
});
test('retries native encoder if construction rejects all MIME options', () => {
  Recorder.reject = (options) => !!options?.mimeType;
  assert.equal(createAudioRecorder(stream).mimeType, 'audio/mp4');
  assert.equal(Recorder.options.length, AUDIO_MIME_TYPES.length * 2 + 1);
  assert.deepEqual(Recorder.options.at(-1), { audioBitsPerSecond: 24_000 });
});
test('tries the next supported Opus MIME with bitrate before dropping the first MIME bitrate', () => {
  Recorder.supported = [AUDIO_MIME_TYPES[0], AUDIO_MIME_TYPES[1]];
  Recorder.reject = (options) => options?.mimeType === AUDIO_MIME_TYPES[0];
  assert.equal(createAudioRecorder(stream).mimeType, AUDIO_MIME_TYPES[1]);
  assert.deepEqual(Recorder.options, [
    { mimeType: AUDIO_MIME_TYPES[0], audioBitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[0], bitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[1], audioBitsPerSecond: 24_000 },
  ]);
});
test('exhausts all supported and native bitrate attempts before MIME-only fallback', () => {
  Recorder.supported = [AUDIO_MIME_TYPES[0], AUDIO_MIME_TYPES[1]];
  Recorder.reject = (options) => options?.audioBitsPerSecond !== undefined || options?.bitsPerSecond !== undefined;
  createAudioRecorder(stream);
  assert.deepEqual(Recorder.options, [
    { mimeType: AUDIO_MIME_TYPES[0], audioBitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[0], bitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[1], audioBitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[1], bitsPerSecond: 24_000 },
    { audioBitsPerSecond: 24_000 },
    { bitsPerSecond: 24_000 },
    { mimeType: AUDIO_MIME_TYPES[0] },
  ]);
});
test('missing capability probe uses native encoder without inventing a type', () => {
  const probe = Recorder.isTypeSupported;
  (Recorder as any).isTypeSupported = undefined;
  try { createAudioRecorder(stream); } finally { Recorder.isTypeSupported = probe; }
  assert.deepEqual(Recorder.options[0], { audioBitsPerSecond: 24_000 });
});
test('90-second timer stops encoder/tracks once and resolves shared result', async () => {
  const reasons: string[] = [];
  const session = await startAudioRecording({ onStopped: (reason) => reasons.push(reason) });
  mock.timers.tick(89_999);
  assert.equal(Recorder.instance.stops, 0);
  mock.timers.tick(1);
  assert.equal(Recorder.instance.stops, 1);
  assert.equal(track.stops, 1);
  assert.equal(session.stop(), session.result);
  const result = await session.result;
  assert.equal(result.audioBlob.type, Recorder.instance.mimeType);
  assert.equal(result.transcript, 'Texto del servidor');
  assert.deepEqual(reasons, ['limit']);
  assert.equal(createdUrls.length, 1);
  assert.equal(MAX_RECORDING_SECONDS, 90);
});
for (const at of [0, 89_999, 90_000, 90_001]) {
  test(`manual stop at ${at}ms races safely with deadline`, async () => {
    let notifications = 0;
    const session = await startAudioRecording({ onStopped: () => notifications++ });
    mock.timers.tick(at);
    const first = session.stop();
    assert.equal(session.stop(), first);
    mock.timers.tick(90_000);
    await first;
    assert.equal(Recorder.instance.stops, 1);
    assert.equal(track.stops, 1);
    assert.equal(notifications, 1);
    assert.equal(fetchCalls.length, 1);
  });
}
for (const at of [0, 89_999, 90_000]) {
  test(`cancel at ${at}ms clears timer and safely rejects pending stops`, async () => {
    const session = await startAudioRecording();
    mock.timers.tick(at);
    session.cancel(); session.cancel();
    await assert.rejects(session.stop(), { name: 'AbortError' });
    mock.timers.tick(180_000);
    assert.equal(Recorder.instance.stops, 1);
    assert.equal(track.stops, 1);
    assert.equal(fetchCalls.length, 0);
    assert.equal(createdUrls.length, 0);
  });
}
test('stop then cancel before final encoder event discards audio', async () => {
  const session = await startAudioRecording();
  const pending = session.stop(); session.cancel();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(Recorder.instance.stops, 1);
  assert.equal(createdUrls.length, 0);
});
test('cancel after successful completion leaves caller-owned URL valid', async () => {
  const session = await startAudioRecording();
  const result = await session.stop();
  session.cancel();
  assert.equal(await session.stop(), result);
  assert.equal(track.stops, 1);
});
test('actual runtime MIME is used for Blob and transcription, even if different from request', async () => {
  const session = await startAudioRecording();
  Recorder.instance.mimeType = 'audio/mp4;codecs=mp4a.40.2';
  const result = await session.stop();
  assert.equal(result.audioBlob.type, Recorder.instance.mimeType);
  assert.equal(JSON.parse(fetchCalls[0][1].body).mimeType, Recorder.instance.mimeType);
});
test('empty runtime MIME uses actual chunk MIME instead of claiming WebM', async () => {
  const session = await startAudioRecording();
  Recorder.instance.mimeType = '';
  Recorder.instance.ondataavailable({ data: new Blob(['fixture'], { type: 'audio/mp4' }) });
  assert.equal((await session.stop()).audioBlob.type, 'audio/mp4');
});
test('speech recognition preserves language, interim feedback and final transcript without server upload', async () => {
  let recognition: any;
  (window as any).SpeechRecognition = class {
    stops = 0;
    constructor() { recognition = this; }
    start() {}
    stop() { this.stops++; }
  };
  let interim = '';
  const session = await startAudioRecording({ lang: 'es-MX', onInterimTranscript: (text) => interim = text });
  recognition.onresult({ results: [Object.assign([{ transcript: 'Tu’un Savi' }], { isFinal: true })] });
  assert.equal(interim, 'Tu’un Savi');
  assert.equal(recognition.lang, 'es-MX');
  assert.equal((await session.stop()).transcript, 'Tu’un Savi');
  assert.equal(recognition.stops, 1);
  assert.equal(fetchCalls.length, 0);
});
test('server failure still returns playable audio', async () => {
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const session = await startAudioRecording();
  assert.equal((await session.stop()).audioUrl, 'blob:test');
});
test('cancel during transcription aborts request and creates no URL', async () => {
  let requestSignal: AbortSignal;
  (globalThis as any).fetch = async (_url: string, options: any) => {
    requestSignal = options.signal;
    return new Promise((_resolve, reject) => requestSignal.addEventListener('abort', () => reject(new Error('aborted'))));
  };
  const session = await startAudioRecording();
  const pending = session.stop();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  session.cancel();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(requestSignal.aborted, true);
  assert.equal(createdUrls.length, 0);
});
test('late permission after unmount/abort stops acquired tracks', async () => {
  let grant: (stream: MediaStream) => void;
  navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => grant = resolve);
  const controller = new AbortController();
  const pending = startAudioRecording({ signal: controller.signal });
  controller.abort(); grant(stream);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(track.stops, 1);
  assert.equal(Recorder.options.length, 0);
});
for (const failure of ['constructor', 'start', 'stop', 'error', 'read']) {
  test(`${failure} failure releases microphone and rejects cleanly`, async () => {
    if (failure === 'constructor') Recorder.reject = () => true;
    if (failure === 'start') Recorder.startError = true;
    if (failure === 'stop') Recorder.stopError = true;
    if (failure === 'read') (globalThis as any).FileReader = class { readAsDataURL() { throw new Error('read failed'); } };
    if (failure === 'constructor' || failure === 'start') await assert.rejects(startAudioRecording());
    else {
      const session = await startAudioRecording();
      if (failure === 'error') Recorder.instance.onerror();
      await assert.rejects(session.stop());
    }
    mock.timers.tick(180_000);
    assert.equal(track.stops, 1);
    assert.equal(createdUrls.length, 0);
  });
}
test('hidden page automatically completes capture before background suspension', async () => {
  const reasons: string[] = [];
  const session = await startAudioRecording({ onStopped: (reason) => reasons.push(reason) });
  documentMock.hidden = true; documentMock.dispatchEvent(new Event('visibilitychange'));
  await session.result;
  assert.deepEqual(reasons, ['hidden']);
  assert.equal(track.stops, 1);
});
test('externally ended track completes once', async () => {
  const session = await startAudioRecording();
  track.readyState = 'ended'; track.dispatchEvent(new Event('ended'));
  await session.result;
  assert.equal(Recorder.instance.stops, 1);
});
test('native unsolicited stop preserves final data and clears deadline', async () => {
  const session = await startAudioRecording();
  Recorder.instance.state = 'inactive'; Recorder.instance.flush();
  const result = await session.result;
  mock.timers.tick(90_000);
  assert.ok(result.audioBlob.size > 0);
  assert.equal(Recorder.instance.stops, 0);
  assert.equal(track.stops, 1);
});
test('transcription deadline returns audio when server stalls', async () => {
  (globalThis as any).fetch = async (_url: string, options: any) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('timeout')));
  });
  const session = await startAudioRecording();
  const pending = session.stop();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  mock.timers.tick(30_000);
  assert.equal((await pending).audioUrl, 'blob:test');
  assert.equal(track.stops, 1);
});

test('browser rejecting every options dictionary can use the no-options constructor', () => {
  Recorder.reject = (options) => options !== undefined;
  assert.equal(createAudioRecorder(stream).mimeType, 'audio/mp4');
  assert.equal(Recorder.options.length, AUDIO_MIME_TYPES.length * 3 + 3);
  assert.equal(Recorder.options.at(-1), undefined);
});

test('diagnostics distinguish accepted bitrate request from browser-reported and measured rates', async () => {
  let now = 0;
  mock.method(performance, 'now', () => now);
  const session = await startAudioRecording();
  // Simulate a browser reporting a different rate; fixture bytes are not codec evidence.
  Recorder.instance.audioBitsPerSecond = 48_000;
  now = 30_250;
  const result = await session.stop();
  assert.equal(result.diagnostics.constructorOptions.audioBitsPerSecond, 24_000);
  assert.equal(result.diagnostics.constructorAttempts, 1);
  assert.equal(result.diagnostics.reportedAudioBitsPerSecond, 48_000);
  assert.equal(result.diagnostics.elapsedSeconds, 30.25);
  assert.equal(result.diagnostics.effectiveBitsPerSecond, result.audioBlob.size * 8 / 30.25);
  assert.equal(result.diagnostics.channelCount, 2);
  assert.equal(result.diagnostics.sampleRate, 48_000);
  assert.equal(result.diagnostics.chunkCount, 1);
});

test('diagnostics disclose constructor fallback that omitted the bitrate', async () => {
  Recorder.reject = (options) => options?.audioBitsPerSecond !== undefined || options?.bitsPerSecond !== undefined;
  const session = await startAudioRecording();
  const { diagnostics } = await session.stop();
  assert.deepEqual(diagnostics.constructorOptions, { mimeType: AUDIO_MIME_TYPES[0] });
  assert.equal(diagnostics.constructorAttempts, AUDIO_MIME_TYPES.length * 2 + 3);
  assert.equal(diagnostics.reportedAudioBitsPerSecond, 192_000);
});

test('voice capture requests optional mono and avoids periodic encoder flushes', async () => {
  let requested: MediaStreamConstraints;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    requested = constraints;
    return stream;
  };
  const session = await startAudioRecording();
  assert.deepEqual((requested.audio as MediaTrackConstraints).channelCount, { ideal: 1 });
  assert.equal((requested.audio as MediaTrackConstraints).sampleRate, undefined);
  assert.deepEqual(Recorder.startArgs, []);
  await session.stop();
});

test('native MIME retry retains total bitrate if audioBitsPerSecond is rejected', () => {
  Recorder.reject = (options) => !!options?.mimeType || options?.audioBitsPerSecond !== undefined;
  createAudioRecorder(stream);
  assert.deepEqual(Recorder.options.at(-1), { bitsPerSecond: 24_000 });
  assert.equal(Recorder.instance.audioBitsPerSecond, 24_000);
});

test('diagnostics handle unavailable browser bitrate and capture settings honestly', async () => {
  track.getSettings = undefined;
  const session = await startAudioRecording();
  Recorder.instance.audioBitsPerSecond = undefined;
  const { diagnostics } = await session.stop();
  assert.equal(diagnostics.reportedAudioBitsPerSecond, null);
  assert.equal(diagnostics.channelCount, null);
  assert.equal(diagnostics.sampleRate, null);
});

// Fake speaker output verifies timing and resource ownership, not device audibility.
function enableCues() {
  CueContext.instances = [];
  (window as any).AudioContext = CueContext;
}

test('cue context resumes before permission; warning once at 75s and distinct final at 90s', async () => {
  enableCues();
  navigator.mediaDevices.getUserMedia = async () => {
    assert.equal(CueContext.instances.length, 1);
    assert.equal(CueContext.instances[0].resume.mock.callCount(), 1);
    return stream;
  };
  const session = await startAudioRecording({ audibleLimitCues: true });
  const context = CueContext.instances[0];
  mock.timers.tick(74_999);
  assert.equal(context.oscillators.length, 0);
  mock.timers.tick(1);
  assert.equal(context.oscillators.length, 1);
  const warning = context.oscillators[0];
  warning.onended();
  assert.equal(warning.disconnect.mock.callCount(), 1);
  mock.timers.tick(14_999);
  assert.equal(context.oscillators.length, 1);
  mock.timers.tick(1);
  await session.result;
  assert.equal(Recorder.instance.stops, 1);
  assert.equal(context.oscillators.length, 2);
  assert.notEqual(context.oscillators[1].frequency.value, warning.frequency.value);
  mock.timers.tick(400);
  assert.equal(context.close.mock.callCount(), 1);
  assert.ok(context.oscillators.every((node) => node.disconnect.mock.callCount() === 1));
  assert.ok(context.gains.every((node) => node.disconnect.mock.callCount() === 1));
  mock.timers.tick(180_000);
  assert.equal(context.oscillators.length, 2);
  assert.equal(CueContext.instances.length, 1);
});

for (const reason of ['manual', 'cancel', 'hidden', 'ended', 'native', 'error']) {
  for (const at of [0, 75_000]) {
    test(`${reason} at ${at}ms prevents subsequent cues and closes audio resources`, async () => {
      enableCues();
      const session = await startAudioRecording({ audibleLimitCues: true });
      const context = CueContext.instances[0];
      mock.timers.tick(at);
      const before = context.oscillators.length;
      if (reason === 'manual') void session.stop();
      if (reason === 'cancel') session.cancel();
      if (reason === 'hidden') {
        documentMock.hidden = true; documentMock.dispatchEvent(new Event('visibilitychange'));
      }
      if (reason === 'ended') { track.readyState = 'ended'; track.dispatchEvent(new Event('ended')); }
      if (reason === 'native') { Recorder.instance.state = 'inactive'; Recorder.instance.flush(); }
      if (reason === 'error') Recorder.instance.onerror();
      if (reason === 'cancel' || reason === 'error') await assert.rejects(session.result);
      else await session.result;
      mock.timers.tick(180_000);
      assert.equal(context.oscillators.length, before);
      assert.equal(context.close.mock.callCount(), 1);
      assert.ok(context.oscillators.every((node) => node.disconnect.mock.callCount() === 1));
    });
  }
}

for (const failure of ['permission', 'constructor', 'start', 'stop']) {
  test(`cue resources are released on ${failure} failure`, async () => {
    enableCues();
    if (failure === 'permission') navigator.mediaDevices.getUserMedia = async () => { throw new Error('denied'); };
    if (failure === 'constructor') Recorder.reject = () => true;
    if (failure === 'start') Recorder.startError = true;
    if (failure === 'stop') {
      Recorder.stopError = true;
      const session = await startAudioRecording({ audibleLimitCues: true });
      mock.timers.tick(90_000);
      await assert.rejects(session.result);
    } else await assert.rejects(startAudioRecording({ audibleLimitCues: true }));
    const context = CueContext.instances[0];
    const before = context.oscillators.length;
    mock.timers.tick(180_000);
    assert.equal(context.oscillators.length, before);
    assert.equal(context.close.mock.callCount(), 1);
  });
}

test('default recorder callers never create a speaker context', async () => {
  enableCues();
  const session = await startAudioRecording();
  mock.timers.tick(90_000);
  await session.result;
  assert.equal(CueContext.instances.length, 0);
});

test('aborting while permission is pending immediately closes the cue context', async () => {
  enableCues();
  let grant: (stream: MediaStream) => void;
  navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => grant = resolve);
  const owner = new AbortController();
  const pending = startAudioRecording({ audibleLimitCues: true, signal: owner.signal });
  owner.abort();
  assert.equal(CueContext.instances[0].close.mock.callCount(), 1);
  grant(stream);
  await assert.rejects(pending, { name: 'AbortError' });
});

for (const unavailable of ['missing', 'constructor', 'suspended', 'rejected', 'playback']) {
  test(`${unavailable} Web Audio does not interfere with recording or auto-stop`, async () => {
    enableCues();
    if (unavailable === 'missing') delete (window as any).AudioContext;
    if (unavailable === 'constructor') (window as any).AudioContext = class { constructor() { throw new Error('unavailable'); } };
    if (unavailable === 'suspended' || unavailable === 'rejected') {
      (window as any).AudioContext = class extends CueContext {
        resume = mock.fn(async () => { if (unavailable === 'rejected') throw new Error('blocked'); });
      };
    }
    const session = await startAudioRecording({ audibleLimitCues: true });
    if (unavailable === 'playback') CueContext.instances[0].createGain = () => { throw new Error('failed'); };
    mock.timers.tick(75_000);
    mock.timers.tick(15_000);
    assert.ok((await session.result).audioBlob.size > 0);
    assert.equal(Recorder.instance.stops, 1);
    mock.timers.tick(400);
    assert.ok(CueContext.instances.every((context) => context.close.mock.callCount() === 1));
  });
}

for (const reason of ['hidden', 'ended', 'native']) {
  test(`deadline does not mislabel queued ${reason} termination as a limit cue`, async () => {
    enableCues();
    const reasons: string[] = [];
    const session = await startAudioRecording({ audibleLimitCues: true, onStopped: (reason) => reasons.push(reason) });
    if (reason === 'hidden') documentMock.hidden = true;
    if (reason === 'ended') track.readyState = 'ended';
    if (reason === 'native') Recorder.instance.state = 'inactive';
    mock.timers.tick(90_000);
    if (reason === 'native') Recorder.instance.flush();
    await session.result;
    assert.deepEqual(reasons, [reason === 'hidden' ? 'hidden' : 'ended']);
    assert.equal(CueContext.instances[0].oscillators.length, 0);
    assert.equal(CueContext.instances[0].close.mock.callCount(), 1);
  });
}

test('late warning timer is skipped when the recording deadline has already elapsed', async () => {
  enableCues();
  let now = 0;
  mock.method(performance, 'now', () => now);
  const session = await startAudioRecording({ audibleLimitCues: true });
  now = 90_100;
  mock.timers.tick(75_000);
  assert.equal(CueContext.instances[0].oscillators.length, 0);
  mock.timers.tick(15_000);
  await session.result;
  assert.equal(CueContext.instances[0].oscillators.length, 1);
  session.cancel();
});

test('pending audio resume cannot play a queued cue after cancellation', async () => {
  enableCues();
  let resume: () => void;
  (window as any).AudioContext = class extends CueContext {
    resume = mock.fn(() => new Promise<void>((resolve) => { resume = resolve; }));
  };
  const session = await startAudioRecording({ audibleLimitCues: true });
  mock.timers.tick(75_000);
  session.cancel();
  resume();
  await assert.rejects(session.result, { name: 'AbortError' });
  mock.timers.tick(90_000);
  assert.equal(CueContext.instances[0].oscillators.length, 0);
  assert.equal(CueContext.instances[0].close.mock.callCount(), 1);
});
