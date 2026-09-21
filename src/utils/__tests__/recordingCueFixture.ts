import { mock } from 'node:test';

export class CueContext {
  static instances: CueContext[] = [];
  state = 'suspended';
  currentTime = 0;
  destination = {};
  oscillators: any[] = [];
  gains: any[] = [];
  constructor() { CueContext.instances.push(this); }
  resume = mock.fn(async () => { this.state = 'running'; });
  close = mock.fn(async () => { this.state = 'closed'; });
  createOscillator() {
    const node = { frequency: { value: 0 }, onended: null as any,
      connect: mock.fn(), disconnect: mock.fn(), start: mock.fn(), stop: mock.fn() };
    this.oscillators.push(node);
    return node;
  }
  createGain() {
    const node = { gain: { setValueAtTime: mock.fn(), linearRampToValueAtTime: mock.fn() },
      connect: mock.fn(), disconnect: mock.fn() };
    this.gains.push(node);
    return node;
  }
}
