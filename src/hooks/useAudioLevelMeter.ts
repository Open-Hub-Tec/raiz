import { useEffect, useState } from 'react';
import { createAudioLevelMonitor } from '../utils/audioRecorder';

export interface AudioLevelMeterState {
  /** Perceptually scaled microphone level from 0 to 100. */
  volume: number;
  /** Approximate dBFS of the input signal, from -60 to 0. */
  decibels: number;
}

const SILENT_STATE: AudioLevelMeterState = { volume: 0, decibels: -60 };

/**
 * Reusable real-time voice level meter for a live MediaStream.
 *
 * Returns the current volume (0-100) and approximate decibels (dBFS) and
 * tears down the AudioContext automatically when the stream changes or the
 * component unmounts. Safe to call with a null/undefined stream.
 */
export function useAudioLevelMeter(
  stream: MediaStream | null | undefined
): AudioLevelMeterState {
  const [meter, setMeter] = useState<AudioLevelMeterState>(SILENT_STATE);

  useEffect(() => {
    if (!stream) {
      setMeter(SILENT_STATE);
      return;
    }

    const monitor = createAudioLevelMonitor(stream, (reading) => {
      setMeter({ volume: reading.volume, decibels: reading.decibels });
    });

    return () => monitor.stop();
  }, [stream]);

  return meter;
}
