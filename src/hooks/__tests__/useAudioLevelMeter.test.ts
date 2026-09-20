import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAudioLevel,
  observeAudioLevel,
  rmsToAudioLevel,
  smoothAudioLevel,
} from '../useAudioLevelMeter';

test('dBFS-derived mapping separates silence, quiet, ordinary and loud amplitudes', () => {
  assert.equal(rmsToAudioLevel(0), 0);
  assert.equal(rmsToAudioLevel(0.001), 0);
  assert.equal(rmsToAudioLevel(0.005), 10);
  assert.equal(rmsToAudioLevel(0.05), 60);
  assert.equal(rmsToAudioLevel(0.25), 95);
  assert.equal(rmsToAudioLevel(0.5), 100);
});

test('level mapping clamps invalid/extreme amplitudes and is monotonic', () => {
  assert.equal(rmsToAudioLevel(-1), 0);
  assert.equal(rmsToAudioLevel(Number.NaN), 0);
  assert.equal(rmsToAudioLevel(Number.POSITIVE_INFINITY), 100);
  let previous = 0;
  for (let step = 0; step <= 1_000; step++) {
    const level = rmsToAudioLevel(step / 1_000);
    assert.ok(Number.isInteger(level) && level >= previous && level <= 100);
    previous = level;
  }
});

test('byte-sample RMS handles silence, symmetry and display clamping', () => {
  assert.equal(calculateAudioLevel(new Uint8Array()), 0);
  assert.equal(calculateAudioLevel(new Uint8Array([128, 128])), 0);
  assert.equal(calculateAudioLevel(new Uint8Array([129, 127])), 20);
  assert.equal(calculateAudioLevel(new Uint8Array([134, 122])), 59);
  assert.equal(calculateAudioLevel(new Uint8Array([160, 96])), 95);
  assert.equal(calculateAudioLevel(new Uint8Array([255, 0])), 100);
  for (let sample = 0; sample <= 255; sample++) {
    const level = calculateAudioLevel(new Uint8Array([sample]));
    assert.ok(Number.isInteger(level) && level >= 0 && level <= 100);
  }
});

test('smoothing attacks faster than it releases', () => {
  const attacked = smoothAudioLevel(0, 80);
  const released = smoothAudioLevel(80, 0);
  assert.equal(attacked, 52);
  assert.equal(released, 70.4);
  assert.ok(attacked > 80 - released);
  assert.ok(smoothAudioLevel(attacked, 80) > attacked);
  assert.ok(smoothAudioLevel(released, 0) < released);
});

let frames: Map<number, FrameRequestCallback>;
let context: Context;
let track: EventTarget & { readyState: string; stop: () => void };
let stream: MediaStream;
let levels: number[];
const originals = new Map<string, PropertyDescriptor | undefined>();
function global(name: string, value: unknown) {
  originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}
class Context {
  static suspended = false;
  static fail = false;
  static sample = 160;
  state = Context.suspended ? 'suspended' : 'running';
  closes = 0;
  resumes = 0;
  source = { connect() {}, disconnect: mock.fn() };
  analyser = { fftSize: 0, disconnect: mock.fn(), getByteTimeDomainData: (data: Uint8Array) => data.fill(Context.sample) };
  constructor() { context = this; }
  createMediaStreamSource() { return this.source; }
  createAnalyser() { if (Context.fail) throw new Error('unavailable'); return this.analyser; }
  resume() { this.resumes++; return Promise.reject(new Error('needs gesture')); }
  close() { this.closes++; this.state = 'closed'; return Promise.resolve(); }
}
beforeEach(() => {
  frames = new Map(); levels = [];
  Context.suspended = false; Context.fail = false; Context.sample = 160;
  track = Object.assign(new EventTarget(), { readyState: 'live', stop: mock.fn() });
  stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
  global('window', { AudioContext: Context });
  let id = 0;
  global('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  global('cancelAnimationFrame', (id: number) => frames.delete(id));
});
afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as any)[name];
  }
  originals.clear();
});
test('observer disconnects nodes, cancels RAF, closes once and never stops owned-by-caller tracks', () => {
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  assert.equal(levels[0], 62);
  assert.equal(frames.size, 1);
  cleanup(); cleanup();
  assert.equal(frames.size, 0);
  assert.equal(context.closes, 1);
  assert.equal(context.source.disconnect.mock.callCount(), 1);
  assert.equal(context.analyser.disconnect.mock.callCount(), 1);
  assert.equal((track.stop as any).mock.callCount(), 0);
  assert.equal(levels.at(-1), 0);
});
test('observer applies responsive attack and gradual release between frames', () => {
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  const loudFrame = [...frames.values()][0]; frames.clear(); loudFrame(0);
  Context.sample = 128;
  const silentFrame = [...frames.values()][0]; frames.clear(); silentFrame(16);
  assert.deepEqual(levels, [62, 83, 73]);
  cleanup();
});
test('suspended context resumes only once, rejected resume is safe and reports zero', async () => {
  Context.suspended = true;
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  const callback = [...frames.values()][0]; frames.clear(); callback(0);
  await Promise.resolve();
  assert.equal(context.resumes, 1);
  assert.deepEqual(levels, [0, 0]);
  cleanup();
});
test('missing AudioContext yields zero and harmless cleanup', () => {
  (window as any).AudioContext = undefined;
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  cleanup(); cleanup();
  assert.ok(levels.every((level) => level === 0));
  assert.equal(frames.size, 0);
});
test('partial initialization failure closes context and disconnects source', () => {
  Context.fail = true;
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  cleanup();
  assert.equal(context.closes, 1);
  assert.equal(context.source.disconnect.mock.callCount(), 1);
  assert.equal(frames.size, 0);
});
test('ended track event immediately releases analyser resources', () => {
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  track.readyState = 'ended'; track.dispatchEvent(new Event('ended'));
  assert.equal(context.closes, 1);
  assert.equal(frames.size, 0);
  cleanup();
});
test('track.stop without ended event is detected by next animation frame', () => {
  const cleanup = observeAudioLevel(stream, (level) => levels.push(level));
  track.readyState = 'ended';
  const callback = [...frames.values()][0]; frames.clear(); callback(0);
  assert.equal(context.closes, 1);
  assert.equal(frames.size, 0);
  cleanup();
});
