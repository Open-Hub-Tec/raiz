import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act, StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { CueContext } from '../../utils/__tests__/recordingCueFixture';
import { useAudioRecordingSession } from '../useAudioRecordingSession';
import { RegisterCoffeeLotScreen } from '../../components/RegisterCoffeeLotScreen';
import { MicrophoneDiagnosticModal } from '../../components/MicrophoneDiagnosticModal';

let dom: JSDOM;
let root: Root;
let api: ReturnType<typeof useAudioRecordingSession>;
let track: any;
let stream: MediaStream;
let now: number;
let stopped: number;
let created: number;
let revoked: number;
let gumCalls: number;
const originals = new Map<string, PropertyDescriptor | undefined>();
function global(name: string, value: unknown) {
  originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}
function Harness({ active = true }: { active?: boolean }) {
  api = useAudioRecordingSession(active);
  return React.createElement('span', null, api.audioLevel);
}
beforeEach(() => {
  now = 0; stopped = 0; created = 0; revoked = 0; gumCalls = 0;
  dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test', pretendToBeVisual: true });
  global('window', dom.window);
  global('document', dom.window.document);
  global('IS_REACT_ACT_ENVIRONMENT', true);
  track = Object.assign(new EventTarget(), { readyState: 'live', stop: mock.fn(() => track.readyState = 'ended') });
  stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
  global('navigator', { mediaDevices: { getUserMedia: async () => { gumCalls++; return stream; } } });
  global('MediaRecorder', class {
    static isTypeSupported() { return true; }
    mimeType = 'audio/webm;codecs=opus';
    audioBitsPerSecond = 24_000;
    state = 'inactive';
    ondataavailable: any;
    onstop: any;
    start() { this.state = 'recording'; }
    stop() {
      assert.notEqual(this.state, 'inactive');
      stopped++; this.state = 'inactive';
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(['fixture']) });
        this.onstop?.();
      });
    }
  });
  global('FileReader', class {
    result = 'data:audio/webm;base64,YQ==';
    onloadend: any;
    readAsDataURL() { queueMicrotask(() => this.onloadend()); }
  });
  mock.method(URL, 'createObjectURL', () => { created++; return `blob:test-${created}`; });
  mock.method(URL, 'revokeObjectURL', () => { revoked++; });
  mock.method(performance, 'now', () => now);
  mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  root = createRoot(document.getElementById('root')!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  mock.timers.reset(); mock.restoreAll();
  dom.window.close();
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as any)[name];
  }
  originals.clear();
});
test('StrictMode rerenders do not restart capture; double start is guarded; unmount stops tracks', async () => {
  await act(async () => root.render(React.createElement(StrictMode, null, React.createElement(Harness))));
  let session: any;
  await act(async () => {
    session = await api.startRecording({});
    await assert.rejects(api.startRecording({}), { name: 'AbortError' });
  });
  await act(async () => root.render(React.createElement(StrictMode, null, React.createElement(Harness))));
  assert.equal(gumCalls, 1);
  await act(async () => root.unmount());
  await assert.rejects(session.result, { name: 'AbortError' });
  assert.equal(stopped, 1);
  assert.equal(track.stop.mock.callCount(), 1);
});
test('pending permission grant after unmount is cancelled without a live stream', async () => {
  let grant: (stream: MediaStream) => void;
  navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => grant = resolve);
  await act(async () => root.render(React.createElement(Harness)));
  const pending = api.startRecording({});
  await act(async () => root.unmount());
  grant(stream);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(track.stop.mock.callCount(), 1);
});
test('closing an active modal cancels capture and revokes previous playback URLs', async () => {
  await act(async () => root.render(React.createElement(Harness)));
  await act(async () => {
    const first = await api.startRecording({});
    await first.stop();
  });
  let second: any;
  track.readyState = 'live';
  await act(async () => { second = await api.startRecording({}); });
  await act(async () => root.render(React.createElement(Harness, { active: false })));
  await assert.rejects(second.result, { name: 'AbortError' });
  assert.equal(created, 1);
  assert.equal(revoked, 1);
  assert.equal(stopped, 2);
});
test('a caller can release a successful playback URL before hook teardown', async () => {
  await act(async () => root.render(React.createElement(Harness)));
  let result: any;
  await act(async () => {
    const session = await api.startRecording({});
    result = await session.stop();
  });
  assert.equal(revoked, 0);
  act(() => api.releaseAudioUrl(result.audioUrl));
  assert.equal(revoked, 1);
  act(() => api.releaseAudioUrl(result.audioUrl));
  assert.equal(revoked, 1);
});
test('registration shows limit, warns at 75s and saves auto-stop result once at 90s', async () => {
  CueContext.instances = [];
  (window as any).AudioContext = CueContext;
  await act(async () => root.render(React.createElement(RegisterCoffeeLotScreen, { onNavigateScreen: () => {} })));
  const clickRecord = () => (document.querySelector('button[aria-label="Grabar descripción en tu lengua materna"]') as HTMLButtonElement).click();
  await act(async () => { clickRecord(); clickRecord(); });
  assert.equal(gumCalls, 1);
  assert.match(document.body.textContent!, /0:00 \/ 1:30/);
  await act(async () => { now = 75_000; mock.timers.tick(75_000); });
  assert.match(document.body.textContent!, /Quedan 15 segundos/);
  assert.equal(CueContext.instances[0].oscillators.length, 1);
  await act(async () => { now = 90_000; mock.timers.tick(15_000); });
  assert.match(document.body.textContent!, /Grabación detenida automáticamente: límite de 90 segundos/);
  assert.match(document.body.textContent!, /Nota de voz grabada \(1:30\)/);
  assert.equal(CueContext.instances[0].oscillators.length, 2);
  assert.equal(CueContext.instances[0].close.mock.callCount(), 0);
  assert.equal(document.querySelector('button[aria-label="Detener grabación de voz"]'), null);
  assert.equal(created, 1);
  assert.equal(stopped, 1);
  assert.equal(track.stop.mock.callCount(), 1);
  await act(async () => root.unmount());
  assert.equal(CueContext.instances[0].close.mock.callCount(), 1);
});
test('registration manual double Stop before deadline produces a single saved note', async () => {
  await act(async () => root.render(React.createElement(RegisterCoffeeLotScreen, { onNavigateScreen: () => {} })));
  await act(async () => (document.querySelector('button[aria-label="Grabar descripción en tu lengua materna"]') as HTMLButtonElement).click());
  await act(async () => { now = 89_999; mock.timers.tick(89_999); });
  await act(async () => {
    const button = document.querySelector('button[aria-label="Detener grabación de voz"]') as HTMLButtonElement;
    button.click(); button.click(); now = 90_000; mock.timers.tick(1);
  });
  assert.equal(created, 1);
  assert.equal(stopped, 1);
  assert.doesNotMatch(document.body.textContent!, /Grabación detenida automáticamente/);
});

test('microphone diagnostic renders the browser bitrate and accepted options with a local download', async () => {
  await act(async () => root.render(React.createElement(MicrophoneDiagnosticModal, { isOpen: true, onClose: () => {} })));
  const button = (label: string) => Array.from(document.querySelectorAll('button'))
    .find((element) => element.textContent?.includes(label)) as HTMLButtonElement;
  await act(async () => button('Probar').click());
  await act(async () => { now = 5_000; button('Detener').click(); });
  assert.match(document.body.textContent!, /MediaRecorder.audioBitsPerSecond: 24000/);
  assert.match(document.body.textContent!, /"audioBitsPerSecond":24000/);
  assert.match(document.body.textContent!, /Intentos del constructor: 1/);
  assert.match(document.body.textContent!, /Tiempo: 5.000 s/);
  assert.match(document.body.textContent!, /no garantiza el tamaño del archivo/);
  assert.equal(document.querySelector('a[download]')?.getAttribute('href'), 'blob:test-1');
  assert.equal(document.querySelector('a[download]')?.getAttribute('download'), 'raiz-audio.webm');
});

test('microphone diagnostic automatically stops once at exactly 30 seconds', async () => {
  await act(async () => root.render(React.createElement(MicrophoneDiagnosticModal, { isOpen: true, onClose: () => {} })));
  const button = (label: string) => Array.from(document.querySelectorAll('button'))
    .find((element) => element.textContent?.includes(label)) as HTMLButtonElement;
  await act(async () => button('Probar').click());
  assert.match(document.body.textContent!, /0:00 \/ 0:30/);
  await act(async () => { now = 29_999; mock.timers.tick(29_999); });
  assert.equal(stopped, 0);
  await act(async () => { now = 30_000; mock.timers.tick(1); });
  assert.match(document.body.textContent!, /Tiempo: 30\.000 s/);
  assert.equal(stopped, 1);
  assert.equal(created, 1);
  assert.equal(track.stop.mock.callCount(), 1);
});

test('microphone diagnostic keeps prior feedback when a restart is still busy', async () => {
  mock.method(console, 'warn', () => {});
  const renderModal = (isOpen: boolean) => React.createElement(MicrophoneDiagnosticModal, {
    isOpen,
    onClose: () => {},
  });
  const button = (label: string) => Array.from(document.querySelectorAll('button'))
    .find((element) => element.textContent?.includes(label)) as HTMLButtonElement;
  navigator.mediaDevices.getUserMedia = async () => { throw new Error('fallo previo'); };
  await act(async () => root.render(renderModal(true)));
  await act(async () => button('Probar').click());
  assert.match(document.body.textContent!, /fallo previo/);

  let grant: (stream: MediaStream) => void;
  navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => grant = resolve);
  await act(async () => button('Probar').click());
  await act(async () => button('Probar').click());
  assert.match(document.body.textContent!, /fallo previo/);

  await act(async () => root.render(renderModal(false)));
  track.readyState = 'live';
  grant(stream);
  await act(async () => {});
});
