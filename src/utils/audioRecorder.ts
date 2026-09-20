// Audio Recording and Speech-to-Text Utility for Raíz
// Supports MediaRecorder, Web Speech API (webkitSpeechRecognition) and Gemini backend transcription

export interface AudioRecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  base64Audio: string;
  transcript: string;
  durationSeconds: number;
  diagnostics: AudioRecordingDiagnostics;
}

export interface AudioRecordingDiagnostics {
  constructorOptions: MediaRecorderOptions;
  constructorAttempts: number;
  reportedAudioBitsPerSecond: number | null;
  channelCount: number | null;
  sampleRate: number | null;
  elapsedSeconds: number;
  effectiveBitsPerSecond: number;
  chunkCount: number;
}

export interface StartRecordingOptions {
  onStopped?: (reason: RecordingStopReason) => void;
  signal?: AbortSignal;
  onInterimTranscript?: (text: string) => void;
  lang?: string;
}

export type RecordingStopReason = 'manual' | 'limit' | 'hidden' | 'ended' | 'cancel' | 'error';

export interface LiveRecorderSession {
  stream: MediaStream;
  result: Promise<AudioRecordingResult>;
  stop: () => Promise<AudioRecordingResult>;
  cancel: () => void;
}

/**
 * Check browser support for audio capture and speech recognition
 */
export async function getMicrophoneCapabilities() {
  const hasGetUserMedia = Boolean(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const hasSpeechRecognition = Boolean(SpeechRecognitionClass);

  let permissionState: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';

  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as any });
      permissionState = status.state as any;
    } catch {
      permissionState = 'unknown';
    }
  }

  return {
    hasGetUserMedia,
    hasSpeechRecognition,
    permissionState,
  };
}

/**
 * Convert Blob to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 24,000 bits/s × 30 s ÷ 8 = 90,000 encoded bytes before container overhead.
// This is a bitrate request, not a guarantee about a device's encoder output.
export const AUDIO_BITS_PER_SECOND = 24_000;
export const MAX_RECORDING_SECONDS = 90;
export const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
] as const;

export function selectAudioMimeType(isSupported: (type: string) => boolean): string {
  return AUDIO_MIME_TYPES.find(isSupported) || '';
}

export function createAudioRecorder(
  stream: MediaStream,
  onConfigured?: (options: MediaRecorderOptions, attempts: number) => void
): MediaRecorder {
  const supportedMimeTypes = typeof MediaRecorder.isTypeSupported === 'function'
    ? AUDIO_MIME_TYPES.filter((type) => MediaRecorder.isTypeSupported(type))
    : [];
  // Give every advertised format both standard bitrate-preserving attempts before
  // accepting any bitrate-free construction. For this audio-only stream, total
  // bitrate is a reasonable fallback when audioBitsPerSecond is rejected.
  const candidates: (MediaRecorderOptions | undefined)[] = [
    ...supportedMimeTypes.flatMap((mimeType) => [
      { mimeType, audioBitsPerSecond: AUDIO_BITS_PER_SECOND },
      { mimeType, bitsPerSecond: AUDIO_BITS_PER_SECOND },
    ]),
    { audioBitsPerSecond: AUDIO_BITS_PER_SECOND },
    { bitsPerSecond: AUDIO_BITS_PER_SECOND },
    ...supportedMimeTypes.map((mimeType) => ({ mimeType })),
    undefined,
  ];
  let lastError: unknown;
  for (const [index, options] of candidates.entries()) {
    let recorder: MediaRecorder;
    try {
      recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
    } catch (error) {
      lastError = error;
      continue;
    }
    onConfigured?.({ ...options }, index + 1);
    return recorder;
  }
  throw lastError;
}

/** The caller owns the successful result's object URL and must revoke it when done. */
export async function startAudioRecording(
  options: StartRecordingOptions = {}
): Promise<LiveRecorderSession> {
  const { onInterimTranscript, onStopped, signal, lang = 'es-MX' } = options;
  const abortError = () => new DOMException('Grabación cancelada.', 'AbortError');
  if (signal?.aborted) throw abortError();
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Tu navegador no permite acceso al micrófono o la conexión no es segura (HTTPS).');
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Tu navegador no permite grabar audio.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // A voice note does not need stereo. Ideal allows devices to fall back.
      channelCount: { ideal: 1 },
      echoCancellation: true, noiseSuppression: true, autoGainControl: true,
    },
  });
  const stopTracks = () => stream.getTracks().forEach((track) => track.stop());
  let mediaRecorder: MediaRecorder;
  let constructorOptions: MediaRecorderOptions = {};
  let constructorAttempts = 0;
  let trackSettings: MediaTrackSettings | undefined;
  try {
    if (signal?.aborted || (typeof document !== 'undefined' && document.hidden)) throw abortError();
    trackSettings = stream.getAudioTracks()[0]?.getSettings?.();
    mediaRecorder = createAudioRecorder(stream, (options, attempts) => {
      constructorOptions = options;
      constructorAttempts = attempts;
    });
  } catch (error) {
    stopTracks();
    throw error;
  }

  let recognition: any = null;
  let speechTranscript = '';
  let phase: 'recording' | 'stopping' | 'finished' | 'cancelled' = 'recording';
  let timer: ReturnType<typeof setTimeout>;
  let stoppedAt = 0;
  let startTime = 0;
  let cleaned = false;
  let cancelled = false;
  let finalizing = false;
  let stopRequested = false;
  let notified = false;
  const chunks: Blob[] = [];
  const transcriptionController = new AbortController();
  let resolveResult: (result: AudioRecordingResult) => void;
  let rejectResult: (error: unknown) => void;
  const result = new Promise<AudioRecordingResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  // Automatic completion/cancellation may happen before a caller awaits stop().
  void result.catch(() => {});

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(timer);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    stream.getTracks().forEach((track) => track.removeEventListener('ended', onEnded));
    try { recognition?.stop(); } catch {}
    stopTracks();
  };
  const stopEncoder = () => {
    if (stopRequested || mediaRecorder.state === 'inactive') return;
    stopRequested = true;
    mediaRecorder.stop();
  };
  const notify = (reason: RecordingStopReason) => {
    if (notified) return;
    notified = true;
    try { onStopped?.(reason); } catch (error) { console.warn('Recording callback failed:', error); }
  };
  const detach = () => {
    signal?.removeEventListener('abort', cancel);
    mediaRecorder.ondataavailable = null;
    mediaRecorder.onstop = null;
    mediaRecorder.onerror = null;
    if (recognition) recognition.onresult = null;
  };
  const fail = (error: unknown) => {
    if (phase === 'finished' || phase === 'cancelled') return;
    cancelled = true;
    phase = 'cancelled';
    cleanup();
    transcriptionController.abort();
    try { stopEncoder(); } catch {}
    detach();
    chunks.length = 0;
    rejectResult(error);
    notify('error');
  };
  const finish = async () => {
    if (finalizing || phase === 'finished' || phase === 'cancelled') return;
    finalizing = true;
    if (phase === 'recording') {
      phase = 'stopping';
      stoppedAt = performance.now();
      cleanup();
      notify('ended');
    }
    try {
      const actualMimeType = mediaRecorder.mimeType || chunks.find((chunk) => chunk.type)?.type || '';
      const audioBlob = new Blob(chunks, { type: actualMimeType });
      const elapsedSeconds = (stoppedAt - startTime) / 1000;
      const diagnostics: AudioRecordingDiagnostics = {
        constructorOptions,
        constructorAttempts,
        // This browser getter is not a measurement of the encoded file's bitrate.
        reportedAudioBitsPerSecond: Number.isFinite(mediaRecorder.audioBitsPerSecond)
          ? mediaRecorder.audioBitsPerSecond : null,
        channelCount: trackSettings?.channelCount ?? null,
        sampleRate: trackSettings?.sampleRate ?? null,
        elapsedSeconds,
        effectiveBitsPerSecond: elapsedSeconds > 0 ? audioBlob.size * 8 / elapsedSeconds : 0,
        chunkCount: chunks.length,
      };
      chunks.length = 0;
      const base64Audio = await blobToBase64(audioBlob);
      if (transcriptionController.signal.aborted) return;
      let transcript = speechTranscript;
      if (!transcript.trim() && base64Audio.length > 100) {
        // Preserve the existing transcription path, with bounded processing and cancellation.
        const timeout = setTimeout(() => transcriptionController.abort(), 30_000);
        try {
          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Audio, mimeType: actualMimeType }),
            signal: transcriptionController.signal,
          });
          if (response.ok) transcript = (await response.json()).transcript || '';
        } catch { /* Audio remains usable when transcription is unavailable. */ }
        finally { clearTimeout(timeout); }
      }
      if (cancelled) return;
      const audioUrl = URL.createObjectURL(audioBlob);
      phase = 'finished';
      detach();
      resolveResult({ audioBlob, audioUrl, base64Audio, transcript, diagnostics,
        durationSeconds: Math.max(1, Math.round((stoppedAt - startTime) / 1000)) });
    } catch (error) { fail(error); }
  };
  const stop = (reason: RecordingStopReason = 'manual') => {
    if (phase !== 'recording') return result;
    phase = 'stopping';
    stoppedAt = performance.now();
    try {
      // Stop the encoder before ending tracks, retaining its final dataavailable event.
      stopEncoder();
      cleanup();
      notify(reason);
    } catch (error) { fail(error); }
    return result;
  };
  function cancel() {
    if (phase === 'finished' || phase === 'cancelled') return;
    cancelled = true;
    phase = 'cancelled';
    cleanup();
    transcriptionController.abort();
    try { recognition?.abort(); } catch {}
    try { stopEncoder(); } catch {}
    detach();
    chunks.length = 0;
    rejectResult(abortError());
    notify('cancel');
  }
  function onVisibility() {
    if (document.hidden) void stop('hidden');
  }
  function onEnded() { void stop('ended'); }

  mediaRecorder.ondataavailable = (event) => {
    if (phase !== 'cancelled' && event.data.size) chunks.push(event.data);
  };
  mediaRecorder.onstop = () => { void finish(); };
  mediaRecorder.onerror = () => fail(new Error('No se pudo grabar el audio.'));

  try {
    const SpeechRecognitionClass = typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (SpeechRecognitionClass) {
      recognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        speechTranscript = (final || interim).trim();
        if (phase === 'recording') onInterimTranscript?.((final + ' ' + interim).trim());
      };
      recognition.onerror = () => {}; // Server transcription remains the fallback.
      recognition.start();
    }
  } catch { /* Speech recognition is optional. */ }

  try {
    // The bounded note is consumed only after Stop; no streaming consumer needs
    // timeslices. Avoid forcing frequent encoder flushes/container clusters.
    mediaRecorder.start();
    startTime = performance.now();
    timer = setTimeout(() => { void stop('limit'); }, MAX_RECORDING_SECONDS * 1000);
    signal?.addEventListener('abort', cancel, { once: true });
    stream.getTracks().forEach((track) => track.addEventListener('ended', onEnded));
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
      onVisibility();
    }
  } catch (error) {
    fail(error);
    throw error;
  }
  return { stream, result, stop: () => stop(), cancel };
}
