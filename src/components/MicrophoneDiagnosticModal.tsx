import React, { useState, useEffect, useRef } from 'react';
import { useAudioRecordingSession } from '../hooks/useAudioRecordingSession';
import {
  LiveRecorderSession,
  getMicrophoneCapabilities,
  AudioRecordingResult
} from '../utils/audioRecorder';

interface MicrophoneDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MicrophoneDiagnosticModal: React.FC<MicrophoneDiagnosticModalProps> = ({
  isOpen,
  onClose
}) => {
  const [capabilities, setCapabilities] = useState<{
    hasGetUserMedia: boolean;
    hasSpeechRecognition: boolean;
    permissionState: string;
  }>({
    hasGetUserMedia: false,
    hasSpeechRecognition: false,
    permissionState: 'unknown'
  });

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testSeconds, setTestSeconds] = useState<number>(0);
  const { startRecording, audioLevel: liveVolume } = useAudioRecordingSession(isOpen);
  const [liveSpokenText, setLiveSpokenText] = useState<string>('');
  const [testResult, setTestResult] = useState<AudioRecordingResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAiTranscribing, setIsAiTranscribing] = useState<boolean>(false);
  const [aiTranscript, setAiTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<LiveRecorderSession | null>(null);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handleStopTest = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTesting(false);

    if (sessionRef.current) {
      try {
        const session = sessionRef.current;
        sessionRef.current = null;
        const res = await session.stop();
        setTestResult(res);
        if (res.transcript) {
          setAiTranscript(res.transcript);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error al detener sesión:', err);
        setErrorMessage('Hubo un problema al procesar el audio grabado.');
      }
    }
  };

  const handleStartTest = async () => {
    setErrorMessage(null);
    setTestResult(null);
    setAiTranscript(null);
    setLiveSpokenText('');
    setTestSeconds(0);

    try {
      const session = await startRecording({
        onStopped: (reason) => {
          if (reason === 'limit' || reason === 'hidden' || reason === 'ended' || reason === 'error') void handleStopTest();
        },
        onInterimTranscript: (text) => setLiveSpokenText(text),
        lang: 'es-MX'
      });
      sessionRef.current = session;
      timerRef.current = setInterval(() => {
        setTestSeconds((s) => s + 1);
      }, 1000);
      setIsTesting(true);
      // Re-check permissions
      getMicrophoneCapabilities().then(setCapabilities);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Error al iniciar prueba de micro:', err);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsTesting(false);
      setErrorMessage(
        err?.message ||
          'El navegador bloqueó el acceso al micrófono. Haz clic en el ícono del candado (🔒) de tu navegador para permitir el micrófono.'
      );
    }
  };

  const handlePlayAudio = () => {
    if (!testResult?.audioUrl) return;

    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(testResult.audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    } else {
      audioElementRef.current.src = testResult.audioUrl;
    }

    audioElementRef.current
      .play()
      .then(() => setIsPlayingAudio(true))
      .catch((e) => console.warn('Error reproduciendo audio:', e));
  };

  const handleTestAiTranscription = async () => {
    if (!testResult?.base64Audio) return;
    setIsAiTranscribing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: testResult.base64Audio,
          mimeType: testResult.audioBlob.type
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiTranscript(
          data.transcript || 'Audio procesado, pero no se detectaron palabras audibles.'
        );
      } else {
        setErrorMessage('El servidor no pudo procesar la transcripción del audio.');
      }
    } catch (err: any) {
      setErrorMessage('Error de conexión con el servicio de transcripción.');
    } finally {
      setIsAiTranscribing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getMicrophoneCapabilities().then(setCapabilities);
    } else {
      sessionRef.current?.cancel();
      sessionRef.current = null;
      setTestResult(null);
      setAiTranscript(null);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTesting(false);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) sessionRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-[#c1c8c2]/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#c1c8c2]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#1b3b2b] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">mic</span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#032517] leading-tight">
                Diagnóstico del Micrófono
              </h3>
              <p className="text-[12px] text-[#424843]">
                Prueba física de audio, volumen y transcripción
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0eee8] hover:bg-[#e0ded8] text-[#032517] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar diagnóstico"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* System Capabilities Checklist */}
        <div className="bg-[#fcf9f3] p-3 rounded-2xl border border-[#c1c8c2]/30 flex flex-col gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#032517]">
            1. Estado de Compatibilidad
          </span>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-[#c1c8c2]/20">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                {capabilities.hasGetUserMedia ? 'check_circle' : 'cancel'}
              </span>
              <span className="text-[#032517] font-medium">Captura de Audio</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-[#c1c8c2]/20">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                {capabilities.hasSpeechRecognition ? 'check_circle' : 'radio_button_checked'}
              </span>
              <span className="text-[#032517] font-medium">
                {capabilities.hasSpeechRecognition ? 'Web Speech API' : 'IA Multimodal'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-[#c1c8c2]/20 col-span-2">
              <span className="material-symbols-outlined text-[18px] text-[#1b3b2b]">
                verified_user
              </span>
              <span className="text-[#424843]">
                Permiso Navegador:{' '}
                <strong className="text-[#032517] font-bold">
                  {capabilities.permissionState === 'granted'
                    ? '🟢 Permitido'
                    : capabilities.permissionState === 'denied'
                    ? '🔴 Bloqueado'
                    : '🟡 Por solicitar al iniciar'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Test Section */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#1b3b2b]/30 shadow-xs flex flex-col gap-3 items-center text-center">
          <span className="text-[13px] font-bold text-[#032517]">
            2. Prueba de Captura en Vivo
          </span>

          {/* Big Record / Stop Button */}
          <button
            type="button"
            onClick={isTesting ? handleStopTest : handleStartTest}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
              isTesting
                ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-100'
                : 'bg-[#1b3b2b] text-white hover:bg-[#032517] ring-8 ring-emerald-50'
            }`}
          >
            <span className="material-symbols-outlined text-[36px]">
              {isTesting ? 'stop' : 'mic'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider mt-1">
              {isTesting ? 'Detener' : 'Probar'}
            </span>
          </button>

          <p className="text-[12px] text-[#424843]">
            {isTesting
              ? '🎤 Habla ahora: di "Opción 4", "Café de Especialidad" o "Hola Raíz"'
              : 'Presiona el botón verde para hablar y medir la sensibilidad del micrófono.'}
          </p>

          {/* Active Recording State */}
          {isTesting && (
            <div className="w-full bg-[#1b3b2b] text-white p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-mono font-bold text-red-300">
                    0:{testSeconds < 10 ? '0' : ''}
                    {testSeconds}
                  </span>
                  <span className="text-emerald-200">Grabando señal de audio...</span>
                </div>
                <span className="font-mono text-emerald-300 font-bold">{liveVolume}% dB</span>
              </div>

              {/* Dynamic VU meter bar */}
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-yellow-400 to-red-400 transition-all duration-75"
                  style={{ width: `${Math.max(6, liveVolume)}%` }}
                />
              </div>

              {/* Live waveform indicator */}
              <div className="flex items-center justify-center gap-1 py-1">
                {[12, 28, 18, 40, 24, 36, 16, 30, 20].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-300 rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(6, Math.min(32, (h * (liveVolume + 15)) / 45))}px`
                    }}
                  />
                ))}
              </div>

              {/* Live speech preview */}
              <div className="bg-black/30 p-2 rounded-xl text-[12px] italic text-emerald-100 min-h-[32px] flex items-center justify-center border border-white/10">
                {liveSpokenText ? `"${liveSpokenText}"` : 'Esperando palabras habladas...'}
              </div>
            </div>
          )}

          {/* Test Results & Audio Playback */}
          {testResult && !isTesting && (
            <div className="w-full bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex flex-col gap-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                    check_circle
                  </span>
                  <span className="text-[13px] font-bold text-emerald-900">
                    ¡Audio capturado con éxito! ({testResult.durationSeconds}s)
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-200 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded-full">
                  OK
                </span>
              </div>

              <p className="text-xs text-emerald-900 break-all">
                {testResult.audioBlob.size} bytes · {testResult.audioBlob.type || 'Formato nativo'}
              </p>
              <div className="text-xs text-emerald-900 break-all space-y-1">
                <p>Perfil: voz mono solicitada, sin bloques periódicos</p>
                <p>Opciones aceptadas: {JSON.stringify(testResult.diagnostics.constructorOptions)}</p>
                <p>Intentos del constructor: {testResult.diagnostics.constructorAttempts}</p>
                <p>MediaRecorder.audioBitsPerSecond: {testResult.diagnostics.reportedAudioBitsPerSecond ?? 'No disponible'}</p>
                <p>Captura: {testResult.diagnostics.channelCount ?? '?'} canal(es), {testResult.diagnostics.sampleRate ?? '?'} Hz</p>
                <p>Tiempo: {testResult.diagnostics.elapsedSeconds.toFixed(3)} s · Archivo: {Math.round(testResult.diagnostics.effectiveBitsPerSecond)} bits/s · {testResult.diagnostics.chunkCount} bloques</p>
                <p>La tasa reportada por el navegador no garantiza el tamaño del archivo.</p>
                <a className="underline" href={testResult.audioUrl}
                  download={`raiz-audio.${testResult.audioBlob.type.includes('webm') ? 'webm' : testResult.audioBlob.type.includes('ogg') ? 'ogg' : testResult.audioBlob.type.includes('mp4') ? 'm4a' : 'bin'}`}>
                  Descargar grabación
                </a>
              </div>

              {/* Play recorded voice */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="px-3 py-1.5 rounded-full bg-emerald-800 text-white text-[12px] font-bold flex items-center gap-1.5 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPlayingAudio ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isPlayingAudio ? 'Pausar mi voz' : '▶️ Escuchar mi voz grabada'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestAiTranscription}
                  disabled={isAiTranscribing}
                  className="px-3 py-1.5 rounded-full bg-white border border-emerald-700 text-emerald-900 text-[12px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>{isAiTranscribing ? 'Analizando...' : 'Transcribir con IA'}</span>
                </button>
              </div>

              {/* Transcription Display */}
              {aiTranscript && (
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-[12px] text-[#032517]">
                  <span className="font-bold block text-emerald-800 text-[11px] uppercase tracking-wide">
                    Texto Reconocido:
                  </span>
                  <p className="mt-0.5 font-medium italic">"{aiTranscript}"</p>
                </div>
              )}
            </div>
          )}

          {/* Error / Permission Blocked Message */}
          {errorMessage && (
            <div className="w-full bg-amber-50 border border-amber-300 rounded-2xl p-3 text-left flex flex-col gap-1.5 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-[13px]">
                <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                <span>Atención con los permisos del micrófono</span>
              </div>
              <p className="text-[12px]">{errorMessage}</p>
              <div className="mt-1 bg-white/70 p-2 rounded-xl text-[11px] text-[#424843] border border-amber-200">
                💡 <strong>Cómo habilitarlo:</strong>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  <li>En Chrome/Edge: Toca el ícono de 🔒 o ajuste al lado de la URL y activa "Micrófono".</li>
                  <li>En iPhone/Safari: Ve a Ajustes &gt; Safari &gt; Micrófono &gt; Permitir.</li>
                  <li>Si estás en una ventana previa incrustada, también puedes abrir la app en una nueva pestaña.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Verification of the 2 Microphone Capabilities: Instrucciones y Análisis (Sin opción de hablar) */}
        <div className="bg-[#f0eee8] p-3.5 rounded-2xl border border-[#c1c8c2]/50 flex flex-col gap-2.5 text-left text-[12px]">
          <span className="font-bold text-[#032517] text-[13px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-800 text-[18px]">verified</span>
            <span>2 Funciones del Micrófono: Instrucciones y Análisis con IA</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Dar Instrucciones */}
            <div className="bg-white p-3 rounded-xl border border-[#c1c8c2]/30 flex flex-col justify-between gap-1.5">
              <div>
                <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wide">
                  1. Dar Instrucciones a la Plataforma
                </span>
                <p className="text-[11px] text-[#424843] mt-0.5 leading-snug">
                  Di por micrófono órdenes directas: <em>"abrir saldo"</em>, <em>"ver dictamen"</em>, <em>"mis lotes"</em>, <em>"ver mapa"</em> o <em>"registrar cosecha"</em> y la plataforma ejecutará la acción de inmediato en pantalla.
                </p>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md self-start">
                ✓ Comandos de Voz Activos
              </span>
            </div>

            {/* 2. Analiza con IA */}
            <div className="bg-white p-3 rounded-xl border border-[#c1c8c2]/30 flex flex-col justify-between gap-1.5">
              <div>
                <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wide">
                  2. Analiza con IA (Gemini)
                </span>
                <p className="text-[11px] text-[#424843] mt-0.5 leading-snug">
                  Si planteas preguntas sobre humedad de café, secado solar, plagas o contratos en Stellar, Gemini analiza el audio y despliega la respuesta y tarjeta técnica en pantalla (sin voz de salida).
                </p>
              </div>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md self-start">
                ✓ Análisis Multimodal en Pantalla
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#c1c8c2]/20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#032517] text-white font-bold text-[13px] hover:bg-[#1b3b2b] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Listo, entendido
          </button>
        </div>
      </div>
    </div>
  );
};
