import { useEffect, useState } from 'react';

// Web Audio samples are relative to digital full scale, not calibrated sound
// pressure. -50 dBFS suppresses very low ambient/quantization noise; -10 dBFS
// leaves headroom while allowing strong voice input to fill the display.
export const AUDIO_LEVEL_FLOOR_DBFS = -50;
export const AUDIO_LEVEL_CEILING_DBFS = -10;

/** Convert normalized RMS amplitude to a relative 0–100 voice display level. */
export function rmsToAudioLevel(rms: number): number {
  if (Number.isNaN(rms) || rms <= 0) return 0;
  if (!Number.isFinite(rms)) return 100;
  const dbfs = 20 * Math.log10(rms);
  const normalized = (dbfs - AUDIO_LEVEL_FLOOR_DBFS) /
    (AUDIO_LEVEL_CEILING_DBFS - AUDIO_LEVEL_FLOOR_DBFS);
  return Math.round(Math.min(1, Math.max(0, normalized)) * 100);
}

/** Fast attack and slower release keep speech responsive without frame jitter. */
export function smoothAudioLevel(previous: number, next: number): number {
  const current = Math.min(100, Math.max(0, previous));
  const target = Math.min(100, Math.max(0, next));
  const coefficient = target > current ? 0.65 : 0.12;
  return current + (target - current) * coefficient;
}

/** Relative speech level, not calibrated sound-pressure decibels (SPL). */
export function calculateAudioLevel(samples: Uint8Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
  return rmsToAudioLevel(Math.sqrt(sum / samples.length));
}

/** Observe a stream without taking ownership of its microphone tracks. */
export function observeAudioLevel(stream: MediaStream, onLevel: (level: number) => void): () => void {
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let analyser: AnalyserNode | undefined;
  let frame: number | undefined;
  let disposed = false;
  let smoothedLevel = 0;
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
        smoothedLevel = smoothAudioLevel(smoothedLevel, calculateAudioLevel(samples));
        onLevel(Math.round(smoothedLevel));
      } else {
        smoothedLevel = 0;
        onLevel(0);
      }
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
