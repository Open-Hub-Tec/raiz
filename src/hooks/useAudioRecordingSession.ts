import { useCallback, useEffect, useRef, useState } from 'react';
import { startAudioRecording, StartRecordingOptions, LiveRecorderSession } from '../utils/audioRecorder';
import { useAudioLevelMeter } from './useAudioLevelMeter';

/** Shared UI ownership: pending permission requests, stream, and playback URLs. */
export function useAudioRecordingSession(active = true) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lastSession = useRef<LiveRecorderSession | null>(null);
  const urls = useRef(new Set<string>());
  const mounted = useRef(false);
  const audioLevel = useAudioLevelMeter(stream);

  const releaseAudioUrl = useCallback((url: string) => {
    if (urls.current.delete(url)) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    mounted.current = active;
    if (!active) setStream(null);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      lastSession.current?.cancel();
      lastSession.current = null;
      controller.current = null;
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current.clear();
    };
  }, [active]);

  const startRecording = async (options: StartRecordingOptions): Promise<LiveRecorderSession> => {
    if (!mounted.current || controller.current) throw new DOMException('Grabación ocupada.', 'AbortError');
    // A completed note may still be playing its brief final cue.
    lastSession.current?.cancel();
    lastSession.current = null;
    const owner = new AbortController();
    controller.current = owner;
    try {
      const session = await startAudioRecording({
        ...options,
        signal: owner.signal,
        onStopped: (reason) => {
          if (mounted.current) {
            setStream(null);
            options.onStopped?.(reason);
          }
        },
      });
      if (owner.signal.aborted || !mounted.current) {
        session.cancel();
        throw new DOMException('Grabación cancelada.', 'AbortError');
      }
      lastSession.current = session;
      // Release busy state only after encoding/transcription finishes; allow cancel during it.
      void session.result.then((result) => {
        if (owner.signal.aborted || !mounted.current) URL.revokeObjectURL(result.audioUrl);
        else urls.current.add(result.audioUrl);
      }, () => {}).finally(() => {
        if (controller.current === owner) controller.current = null;
      });
      setStream(session.stream);
      return session;
    } catch (error) {
      if (controller.current === owner) controller.current = null;
      throw error;
    }
  };
  return { startRecording, audioLevel, releaseAudioUrl };
}
