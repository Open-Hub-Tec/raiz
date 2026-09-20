import { useEffect, useState } from 'react';

/** Relative speech level, not calibrated sound-pressure decibels. */
export function calculateAudioLevel(samples: Uint8Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
  return Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 200));
}

/** Observe a stream without taking ownership of its microphone tracks. */
export function observeAudioLevel(stream: MediaStream, onLevel: (level: number) => void): () => void {
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let analyser: AnalyserNode | undefined;
  let frame: number | undefined;
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    stream.getTracks().forEach((track) => track.removeEventListener('ended', onEnded));
    source?.disconnect();
    analyser?.disconnect();
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    onLevel(0);
  };
  function onEnded() {
    if (stream.getAudioTracks().every((track) => track.readyState === 'ended')) cleanup();
  }
  try {
    const AudioCtx = typeof window !== 'undefined' &&
      (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx || !stream.getAudioTracks().some((track) => track.readyState === 'live')) {
      onLevel(0);
      return cleanup;
    }
    context = new AudioCtx();
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    if (context.state === 'suspended') void context.resume().catch(() => {});
    const update = () => {
      if (disposed) return;
      if (stream.getAudioTracks().every((track) => track.readyState === 'ended')) {
        cleanup();
        return;
      }
      if (context.state === 'running') {
        analyser.getByteTimeDomainData(samples);
        onLevel(calculateAudioLevel(samples));
      } else onLevel(0);
      frame = requestAnimationFrame(update);
    };
    stream.getTracks().forEach((track) => track.addEventListener('ended', onEnded));
    update();
  } catch { cleanup(); }
  return cleanup;
}

export function useAudioLevelMeter(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    setLevel(0);
    if (!stream) return;
    return observeAudioLevel(stream, setLevel);
  }, [stream]);
  return stream ? level : 0;
}
