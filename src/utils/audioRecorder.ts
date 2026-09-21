// Audio Recording and Speech-to-Text Utility for Raíz
// Supports MediaRecorder, Web Speech API (webkitSpeechRecognition) and Gemini backend transcription

/**
 * Voice notes are capped at 90 seconds to keep payloads small enough for
 * 2G/EDGE sync in rural municipalities.
 */
export const MAX_RECORDING_SECONDS = 90;

/** Seconds remaining when the recorder emits its final time warning cue. */
export const AUTO_STOP_WARNING_SECONDS = 10;

/** Target bitrate for speech: 24 kbps Opus keeps 30 s well under 150 KB. */
export const TARGET_AUDIO_BITRATE = 24000;

export interface AudioRecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  base64Audio: string;
  transcript: string;
  durationSeconds: number;
}

export interface AudioLevelReading {
  /** Perceptually scaled microphone level from 0 to 100. */
  volume: number;
  /** Approximate dBFS of the input signal, from -60 to 0. */
  decibels: number;
}

export interface StartRecordingOptions {
  onVolumeChange?: (volume: number) => void;
  onInterimTranscript?: (text: string) => void;
  /** Fired once when the recorder approaches the auto-stop limit. */
  onTimeWarning?: (secondsRemaining: number) => void;
  /** Fired when the recorder stopped itself after reaching the limit. */
  onAutoStop?: (result: AudioRecordingResult) => void;
  /** Hard cap for a single recording. Defaults to MAX_RECORDING_SECONDS. */
  maxDurationSeconds?: number;
  lang?: string;
}

export interface LiveRecorderSession {
  /** Underlying microphone stream, exposed for consumers of useAudioLevelMeter. */
  stream: MediaStream;
  stop: () => Promise<AudioRecordingResult>;
  cancel: () => void;
}

export interface AudioLevelMonitor {
  stop: () => void;
}

/**
 * Convert an average frequency-bin magnitude into a 0-100 perceptual level.
 */
export function computeVolumeLevel(frequencyData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    sum += frequencyData[i];
  }
  const average = frequencyData.length ? sum / frequencyData.length : 0;
  return Math.min(100, Math.round((average / 60) * 100));
}

/**
 * Approximate dBFS from a time-domain waveform (128 = silence).
 */
export function computeDecibels(timeDomainData: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    const normalized = (timeDomainData[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / timeDomainData.length);
  if (rms <= 0) return -60;
  return Math.max(-60, Math.min(0, Math.round(20 * Math.log10(rms))));
}

/**
 * Framework-agnostic microphone level meter. Creates an AudioContext analyser
 * bound to the given stream and reports volume + dBFS on every animation frame.
 */
export function createAudioLevelMonitor(
  stream: MediaStream,
  onLevel: (reading: AudioLevelReading) => void
): AudioLevelMonitor {
  let audioContext: AudioContext | null = null;
  let animFrameId: number | null = null;

  const stop = () => {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
  };

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return { stop };

    audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    sourceNode.connect(analyser);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);

    const checkVolume = () => {
      if (!audioContext) return;
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
      onLevel({
        volume: computeVolumeLevel(frequencyData),
        decibels: computeDecibels(timeDomainData),
      });
      animFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  } catch (err) {
    console.warn('AudioContext no disponible para medidor de volumen:', err);
  }

  return { stop };
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

/**
 * Start live recording with audio stream, volume meter and optional speech recognition
 */
export async function startAudioRecording(
  options: StartRecordingOptions = {}
): Promise<LiveRecorderSession> {
  const {
    onVolumeChange,
    onInterimTranscript,
    onTimeWarning,
    onAutoStop,
    maxDurationSeconds = MAX_RECORDING_SECONDS,
    lang = 'es-MX',
  } = options;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Tu navegador no permite acceso al micrófono o la conexión no es segura (HTTPS).');
  }

  // 1. Request microphone access with enhancement flags
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const startTime = Date.now();
  const audioChunks: Blob[] = [];

  // Determine supported mime type across Chrome, Firefox, Safari iOS.
  // Opus containers are prioritized for the 24 kbps voice target.
  let selectedMimeType = '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];

  if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
    for (const cand of candidates) {
      if (MediaRecorder.isTypeSupported(cand)) {
        selectedMimeType = cand;
        break;
      }
    }
  }

  const recorderOptions: MediaRecorderOptions = {
    ...(selectedMimeType ? { mimeType: selectedMimeType } : {}),
    audioBitsPerSecond: TARGET_AUDIO_BITRATE,
  };
  const mediaRecorder = new MediaRecorder(stream, recorderOptions);
  const actualMimeType = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  let finalized = false;
  let autoStopped = false;
  let resolveFinal: ((result: AudioRecordingResult) => void) | null = null;
  const finalResult = new Promise<AudioRecordingResult>((resolve) => {
    resolveFinal = resolve;
  });

  let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  let warningTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
  };

  // 2. Real-time microphone meter. The shared monitor is also exposed through
  // the useAudioLevelMeter(stream) hook for components that own the stream.
  const levelMonitor = onVolumeChange
    ? createAudioLevelMonitor(stream, (reading) => onVolumeChange(reading.volume))
    : null;

  // 3. Web Speech Recognition (client-side real-time transcription)
  let speechTranscript = '';
  let recognitionInstance: any = null;

  try {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      recognitionInstance = new SpeechRecognitionClass();
      recognitionInstance.lang = lang;
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final + ' ' + interim).trim();
        speechTranscript = (final || interim).trim();

        if (onInterimTranscript && currentText) {
          onInterimTranscript(currentText);
        }
      };

      recognitionInstance.onerror = (e: any) => {
        console.warn('SpeechRecognition warning:', e?.error);
      };

      try {
        recognitionInstance.start();
      } catch (startErr) {
        console.warn('No se pudo iniciar SpeechRecognition:', startErr);
      }
    }
  } catch (e) {
    console.warn('SpeechRecognition no disponible:', e);
  }

  const cleanup = (abortRecognition = false) => {
    clearTimers();
    if (levelMonitor) levelMonitor.stop();
    if (recognitionInstance) {
      try {
        if (abortRecognition) recognitionInstance.abort();
        else recognitionInstance.stop();
      } catch {}
    }
    stream.getTracks().forEach((track) => track.stop());
  };

  const finalize = async (): Promise<AudioRecordingResult> => {
    if (finalized) return finalResult;
    finalized = true;
    cleanup();

    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const audioBlob = new Blob(audioChunks, { type: actualMimeType });
    const audioUrl = URL.createObjectURL(audioBlob);
    const base64Audio = await blobToBase64(audioBlob);

    let finalTranscript = speechTranscript;

    // If client-side SpeechRecognition didn't capture text, transcribe via Gemini server endpoint
    if (!finalTranscript.trim() && base64Audio && base64Audio.length > 100) {
      try {
        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: actualMimeType,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.transcript) {
            finalTranscript = data.transcript;
          }
        }
      } catch (err) {
        console.warn('Fallo transcripción server:', err);
      }
    }

    const result: AudioRecordingResult = {
      audioBlob,
      audioUrl,
      base64Audio,
      transcript: finalTranscript,
      durationSeconds,
    };

    resolveFinal?.(result);
    return result;
  };

  // 4. Hardware auto-stop: never record more than maxDurationSeconds, and warn
  // shortly before the limit so the UI can play an auditory/visual cue.
  mediaRecorder.onstop = () => {
    void finalize().then((result) => {
      if (autoStopped) {
        onAutoStop?.(result);
      }
    });
  };

  if (maxDurationSeconds > 0) {
    if (maxDurationSeconds > AUTO_STOP_WARNING_SECONDS) {
      warningTimer = setTimeout(() => {
        onTimeWarning?.(AUTO_STOP_WARNING_SECONDS);
      }, (maxDurationSeconds - AUTO_STOP_WARNING_SECONDS) * 1000);
    }
    autoStopTimer = setTimeout(() => {
      autoStopped = true;
      onTimeWarning?.(0);
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      } else {
        void finalize();
      }
    }, maxDurationSeconds * 1000);
  }

  // Start recording with 250ms timeslices for stream stability
  mediaRecorder.start(250);

  // Controller
  return {
    stream,
    stop: (): Promise<AudioRecordingResult> => {
      if (!finalized) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        } else {
          void finalize();
        }
      }
      return finalResult;
    },
    cancel: () => {
      if (finalized) return;
      finalized = true;
      cleanup(true);
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      resolveFinal?.({
        audioBlob: new Blob(),
        audioUrl: '',
        base64Audio: '',
        transcript: speechTranscript,
        durationSeconds: 0,
      });
    },
  };
}
