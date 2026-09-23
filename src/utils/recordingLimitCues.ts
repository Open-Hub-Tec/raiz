/** Optional speaker tones; call synchronously from the recording button gesture. */
export function createRecordingLimitCues(signal?: AbortSignal) {
  let context: AudioContext | undefined;
  let disposed = false;
  let tailTimer: ReturnType<typeof setTimeout> | undefined;
  const nodes = new Set<() => void>();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(tailTimer);
    signal?.removeEventListener('abort', dispose);
    nodes.forEach((release) => release());
    if (context && context.state !== 'closed') {
      try { void context.close().catch(() => {}); } catch {}
    }
  };
  signal?.addEventListener('abort', dispose, { once: true });
  try {
    const AudioCtx = typeof window !== 'undefined' &&
      (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx || signal?.aborted) dispose();
    else {
      context = new AudioCtx();
      // Do this before microphone permission awaits consume user activation.
      // Never retry resume from a delayed timer or queue a tone until it resolves.
      if (context.state === 'suspended') void context.resume().catch(dispose);
    }
  } catch { dispose(); }

  const play = (final: boolean) => {
    if (disposed) return;
    if (context?.state !== 'running') {
      if (final) dispose();
      return;
    }
    let oscillator: OscillatorNode | undefined;
    let gain: GainNode | undefined;
    const release = () => {
      nodes.delete(release);
      if (oscillator) {
        oscillator.onended = null;
        try { oscillator.stop(); } catch {}
        try { oscillator.disconnect(); } catch {}
      }
      try { gain?.disconnect(); } catch {}
    };
    nodes.add(release);
    try {
      oscillator = context.createOscillator();
      gain = context.createGain();
      const start = context.currentTime;
      const duration = final ? 0.3 : 0.15;
      oscillator.frequency.value = final ? 440 : 880;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { release(); if (final) dispose(); };
      oscillator.start(start);
      oscillator.stop(start + duration);
      // Also bound cleanup if a browser suspends audio before delivering ended.
      if (final) tailTimer = setTimeout(dispose, 400);
    } catch { dispose(); }
  };
  return { warning: () => play(false), limit: () => play(true), dispose };
}
