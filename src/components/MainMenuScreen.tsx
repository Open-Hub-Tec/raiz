import React, { useState, useRef, useEffect } from 'react';
import { useAudioRecordingSession } from '../hooks/useAudioRecordingSession';
import { AppLanguage, ScreenView } from '../types';
import { LiveRecorderSession } from '../utils/audioRecorder';

interface MainMenuScreenProps {
  onNavigateScreen: (screen: ScreenView) => void;
  onOpenLots: () => void;
  onOpenPayments: () => void;
  onOpenTechHelp: () => void;
  onOpenMap?: () => void;
  onOpenMicDiagnostic?: () => void;
  appLanguage?: AppLanguage;
  elderMode?: boolean;
  isOnline?: boolean;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onNavigateScreen,
  onOpenLots,
  onOpenPayments,
  onOpenTechHelp,
  onOpenMap,
  onOpenMicDiagnostic,
  appLanguage = 'es',
  elderMode = false,
  isOnline = true
}) => {
  const [numericInput, setNumericInput] = useState('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const { startRecording, audioLevel: audioVolume, releaseAudioUrl } = useAudioRecordingSession();
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);
  const [recognizedOptionToast, setRecognizedOptionToast] = useState<string | null>(null);

  const recorderSessionRef = useRef<LiveRecorderSession | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recorderSessionRef.current) {
        recorderSessionRef.current.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const matchMainMenuOption = (text: string): 1 | 2 | 3 | 4 | null => {
    const clean = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!clean) return null;

    // Check Option 4 FIRST (Ayuda técnica / chat / soporte / Mixteco)
    if (
      /\b(4|cuatro|cuarta)\b/i.test(clean) ||
      /(opcion|numero|num|no\.?)\s*(4|cuatro)/i.test(clean) ||
      clean.includes('kumi') || // Mixteco for four
      clean.includes('ayuda') ||
      clean.includes('tecnica') ||
      clean.includes('soporte') ||
      clean.includes('asesoria') ||
      clean.includes('chat') ||
      clean.includes('pregunta') ||
      clean.includes('duda')
    ) {
      return 4;
    }

    // Check Option 3 (Ver mis pagos / saldo / billetera / Mixteco)
    if (
      /\b(3|tres|tercera)\b/i.test(clean) ||
      /(opcion|numero|num|no\.?)\s*(3|tres)/i.test(clean) ||
      clean.includes('uni') || // Mixteco for three
      clean.includes('pago') ||
      clean.includes('pagos') ||
      clean.includes('saldo') ||
      clean.includes('dinero') ||
      clean.includes('billetera') ||
      clean.includes('cobro') ||
      clean.includes('recibo')
    ) {
      return 3;
    }

    // Check Option 2 (Ver mis lotes / inventario / Mixteco)
    if (
      /\b(2|dos|segunda)\b/i.test(clean) ||
      /(opcion|numero|num|no\.?)\s*(2|dos)/i.test(clean) ||
      clean.includes('uu') || // Mixteco for two
      clean.includes('uvi') ||
      clean.includes('lote') ||
      clean.includes('lotes') ||
      clean.includes('cosechas') ||
      clean.includes('inventario') ||
      clean.includes('acopio') ||
      clean.includes('entrega')
    ) {
      return 2;
    }

    // Check Option 1 (Registrar cosecha o artesanía / Mixteco)
    if (
      /\b(1|uno|una|primero|primera)\b/i.test(clean) ||
      /(opcion|numero|num|no\.?)\s*(1|uno|una)/i.test(clean) ||
      clean.includes('iin') || // Mixteco for one
      clean.includes('registrar') ||
      clean.includes('registro') ||
      clean.includes('nueva cosecha') ||
      clean.includes('nuevo lote') ||
      clean.includes('artesania') ||
      clean.includes('cafe') ||
      clean.includes('miel')
    ) {
      return 1;
    }

    return null;
  };

  const executeMenuOption = (option: 1 | 2 | 3 | 4) => {
    if (option === 1) {
      setRecognizedOptionToast('🎯 Opción 1: Registrar cosecha o artesanía');
      setTimeout(() => onNavigateScreen('catalogo_producto'), 500);
    } else if (option === 2) {
      setRecognizedOptionToast('🎯 Opción 2: Ver mis lotes');
      setTimeout(() => onOpenLots(), 500);
    } else if (option === 3) {
      setRecognizedOptionToast('🎯 Opción 3: Ver mis pagos');
      setTimeout(() => onOpenPayments(), 500);
    } else if (option === 4) {
      setRecognizedOptionToast('🎯 Opción 4: Ayuda técnica (Abriendo chat directo...)');
      setTimeout(() => onOpenTechHelp(), 500);
    }
  };

  const handleNumericSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const matched = matchMainMenuOption(numericInput);
    if (matched) {
      executeMenuOption(matched);
      setMicStatusMessage(null);
    } else if (numericInput.trim()) {
      setMicStatusMessage(`No se reconoció "${numericInput}". Por favor elija 1, 2, 3 o 4.`);
      setTimeout(() => setMicStatusMessage(null), 4000);
    }
    setNumericInput('');
  };

  const toggleVoiceMenuRecording = async (automatic = false) => {
    if (isRecording || automatic) {
      // STOP recording
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      if (recorderSessionRef.current) {
        try {
          const session = recorderSessionRef.current;
          recorderSessionRef.current = null;
          const result = await session.stop();
          const transcriptToEvaluate = (result.transcript || liveTranscript || '').trim();
          releaseAudioUrl(result.audioUrl);
          const matched = matchMainMenuOption(transcriptToEvaluate);

          if (matched) {
            executeMenuOption(matched);
          } else if (transcriptToEvaluate) {
            setMicStatusMessage(`Escuchado: "${transcriptToEvaluate}". Di claramente: "1", "2", "3" o "4".`);
            setTimeout(() => setMicStatusMessage(null), 5000);
          } else {
            setMicStatusMessage('Audio grabado. Di en voz alta el número de opción: 1, 2, 3 o 4.');
            setTimeout(() => setMicStatusMessage(null), 4000);
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          console.error(err);
          setMicStatusMessage('Error al procesar el audio del micrófono.');
        }
      }
    } else {
      // START recording
      try {
        const session = await startRecording({
          onStopped: (reason) => {
            if (reason === 'limit' || reason === 'hidden' || reason === 'ended' || reason === 'error') void toggleVoiceMenuRecording(true);
          },
          onInterimTranscript: (text) => {
            setLiveTranscript(text);
            const matched = matchMainMenuOption(text);
            if (matched) {
              // Early trigger if high confidence
              if (recorderSessionRef.current) {
                recorderSessionRef.current.cancel();
                recorderSessionRef.current = null;
              }
              setIsRecording(false);
              if (timerRef.current) clearInterval(timerRef.current);
              executeMenuOption(matched);
            }
          },
          lang: 'es-MX',
        });
        setMicStatusMessage(null);
        setRecognizedOptionToast(null);
        setLiveTranscript('');
        setRecordingSeconds(0);
        recorderSessionRef.current = session;
        timerRef.current = setInterval(() => {
          setRecordingSeconds((sec) => sec + 1);
        }, 1000);
        setIsRecording(true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Error accediendo al micrófono:', err);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setMicStatusMessage(
          'Permiso de micrófono no otorgado. Por favor permite el acceso o toca directamente el botón 1, 2, 3 o 4.'
        );
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (recorderSessionRef.current) {
      recorderSessionRef.current.cancel();
      recorderSessionRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setLiveTranscript('');
    setMicStatusMessage(null);
  };

  return (
    <main className="w-full max-w-md mx-auto px-4 py-4 flex-1 flex flex-col justify-start gap-4 pb-28">
      {/* TARJETA RURAL DE LOCALIZACIÓN / COMUNIDAD Y MAPA */}
      <div className="flex items-center justify-between bg-[#f6f3ed] p-3 rounded-2xl border border-[#c1c8c2]/30 shadow-xs">
        <button
          type="button"
          onClick={onOpenMap}
          title="Ver mapa de acopio y clima"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
        >
          <span className="material-symbols-outlined text-[#a73918] text-[20px]">pin_drop</span>
          <div>
            <span className="text-[14px] font-bold text-[#1c1c18] block">Magdalena Peñasco, Oax.</span>
            <span className="text-[11px] text-[#a73918] font-bold flex items-center gap-0.5">
              <span>🗺️ Ver Mapa &amp; Clima de Acopio</span>
            </span>
          </div>
        </button>
        <span className="text-[14px] font-extrabold text-[#a73918]">Raíz</span>
      </div>

      {/* BANNER TRANQUILIZADOR: MODO PARCELA OFFLINE (SOLO cuando NO hay internet) */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 bg-emerald-950 text-emerald-100 text-[11.5px] px-3.5 py-2 rounded-2xl border border-emerald-800 shadow-xs animate-pulse">
          <span className="material-symbols-outlined text-[18px] text-emerald-300 shrink-0">
            cell_tower
          </span>
          <span className="leading-tight">
            <strong className="text-white font-bold">Modo Parcela Activo:</strong> Puedes registrar tus fotos y audios sin señal celular; se guardan en tu teléfono y se sincronizan al llegar al pueblo.
          </span>
        </div>
      )}

      {/* BURBUJA DE CHAT ASISTENTE (Tipo conversación rural) */}
      <div className="flex items-start gap-3">
        <div className={`rounded-full bg-[#1b3b2b] text-white flex items-center justify-center shrink-0 shadow-sm mt-1 ${elderMode ? 'w-12 h-12' : 'w-10 h-10'}`}>
          <span className={`material-symbols-outlined ${elderMode ? 'text-[26px]' : 'text-[20px]'}`}>eco</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[88%]">
          <div className={`bg-white p-4 rounded-2xl rounded-tl-xs border border-[#c1c8c2]/30 shadow-sm ${elderMode ? 'p-5' : 'p-4'}`}>
            <p className={`text-[#032517] font-extrabold mb-1 tracking-tight ${elderMode ? 'text-[26px]' : 'text-[22px]'}`}>
              {appLanguage === 'mix' ? "¡Ta'vi, Don Efraín! (¡Hola!)" : "¡Hola, Don Efraín!"}
            </p>
            <p className={`text-[#1c1c18] leading-relaxed ${elderMode ? 'text-[19px] font-medium' : 'text-[16px]'}`}>
              {appLanguage === 'mix'
                ? "¿Ndá chuun kuu kuñu'un yo vixin? Toca número u hablo por voz:"
                : "¿Qué tarea realizaremos hoy en sus parcelas o taller? Presione o diga un número:"}
            </p>
          </div>
          <span className={`text-[#424843] ml-2 font-bold ${elderMode ? 'text-[14px]' : 'text-[13px]'}`}>
            10:42 a.m. • {elderMode ? 'Modo Mayor (Letra Grande)' : 'Modo Campesino'}
          </span>
        </div>
      </div>

      {/* MENÚ NUMERADO DE 4 ACCIONES DE ALTO IMPACTO TÁCTIL (Mínimo 58px-72px por target) */}
      <div className={`flex flex-col ${elderMode ? 'gap-4 mt-2' : 'gap-3 mt-1'}`}>
        {/* OPCIÓN 1: Registrar cosecha o artesanía */}
        <button
          type="button"
          onClick={() => onNavigateScreen('catalogo_producto')}
          className={`touch-ripple w-full bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border-2 border-[#a73918]/30 hover:border-[#a73918] rounded-2xl flex items-center justify-between text-left shadow-xs cursor-pointer group ${
            elderMode ? 'min-h-[74px] p-4.5 border-3' : 'min-h-[58px] p-3.5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`rounded-full bg-[#a73918] text-white flex items-center justify-center font-black shrink-0 shadow-xs group-hover:scale-105 transition-transform ${
              elderMode ? 'w-14 h-14 text-[24px]' : 'w-12 h-12 text-[20px]'
            }`}>
              1
            </div>
            <div className="flex flex-col">
              <span className={`text-[#032517] font-bold ${elderMode ? 'text-[20px] font-extrabold' : 'text-[17px]'}`}>
                {appLanguage === 'mix' ? "1. Tu'un Chichi (Registrar Cosecha)" : "1. Registrar cosecha o artesanía"}
              </span>
              <span className={`text-[#424843] ${elderMode ? 'text-[15px] font-semibold' : 'text-[13px] font-medium'}`}>
                Café, miel, maíz, telar de cintura o palma
              </span>
            </div>
          </div>
          <div className={`rounded-full bg-[#f6f3ed] flex items-center justify-center text-[#032517] shrink-0 group-hover:bg-[#ffdbd1] transition-colors ${
            elderMode ? 'w-12 h-12' : 'w-10 h-10'
          }`}>
            <span className={`material-symbols-outlined ${elderMode ? 'text-[28px]' : 'text-[24px]'}`}>add_a_photo</span>
          </div>
        </button>

        {/* OPCIÓN 2: Ver mis lotes */}
        <button
          type="button"
          onClick={onOpenLots}
          className={`touch-ripple w-full bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border border-[#c1c8c2]/60 rounded-2xl flex items-center justify-between text-left shadow-xs cursor-pointer group ${
            elderMode ? 'min-h-[74px] p-4.5 border-2 border-[#032517]/30' : 'min-h-[58px] p-3.5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`rounded-full bg-[#a73918] text-white flex items-center justify-center font-black shrink-0 shadow-xs group-hover:scale-105 transition-transform ${
              elderMode ? 'w-14 h-14 text-[24px]' : 'w-12 h-12 text-[20px]'
            }`}>
              2
            </div>
            <div className="flex flex-col">
              <span className={`text-[#032517] font-bold ${elderMode ? 'text-[20px] font-extrabold' : 'text-[16px]'}`}>
                {appLanguage === 'mix' ? "2. Koto Lotes (Ver Mis Lotes)" : "2. Ver mis lotes"}
              </span>
              <span className={`text-[#424843] ${elderMode ? 'text-[15px] font-semibold' : 'text-[13px]'}`}>
                4 lotes activos en acopio
              </span>
            </div>
          </div>
          <div className={`rounded-full bg-[#f6f3ed] flex items-center justify-center text-[#032517] shrink-0 group-hover:bg-[#ffdbd1] transition-colors ${
            elderMode ? 'w-12 h-12' : 'w-10 h-10'
          }`}>
            <span className={`material-symbols-outlined ${elderMode ? 'text-[28px]' : 'text-[24px]'}`}>inventory_2</span>
          </div>
        </button>

        {/* OPCIÓN 3: Ver mis pagos */}
        <button
          type="button"
          onClick={onOpenPayments}
          className={`touch-ripple w-full bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border border-[#c1c8c2]/60 rounded-2xl flex items-center justify-between text-left shadow-xs cursor-pointer group ${
            elderMode ? 'min-h-[74px] p-4.5 border-2 border-[#032517]/30' : 'min-h-[58px] p-3.5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`rounded-full bg-[#a73918] text-white flex items-center justify-center font-black shrink-0 shadow-xs group-hover:scale-105 transition-transform ${
              elderMode ? 'w-14 h-14 text-[24px]' : 'w-12 h-12 text-[20px]'
            }`}>
              3
            </div>
            <div className="flex flex-col">
              <span className={`text-[#032517] font-bold ${elderMode ? 'text-[20px] font-extrabold' : 'text-[16px]'}`}>
                {appLanguage === 'mix' ? "3. Koto Xu'un (Ver Mis Pagos)" : "3. Ver mis pagos"}
              </span>
              <span className={`text-[#424843] ${elderMode ? 'text-[15px] font-semibold' : 'text-[13px]'}`}>
                Recibos y saldo disponible
              </span>
            </div>
          </div>
          <div className={`rounded-full bg-[#f6f3ed] flex items-center justify-center text-[#032517] shrink-0 group-hover:bg-[#ffdbd1] transition-colors ${
            elderMode ? 'w-12 h-12' : 'w-10 h-10'
          }`}>
            <span className={`material-symbols-outlined ${elderMode ? 'text-[28px]' : 'text-[24px]'}`}>account_balance_wallet</span>
          </div>
        </button>

        {/* OPCIÓN 4: Ayuda técnica */}
        <button
          type="button"
          onClick={onOpenTechHelp}
          className={`touch-ripple w-full bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border border-[#c1c8c2]/60 rounded-2xl flex items-center justify-between text-left shadow-xs cursor-pointer group ${
            elderMode ? 'min-h-[74px] p-4.5 border-2 border-[#032517]/30' : 'min-h-[58px] p-3.5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`rounded-full bg-[#a73918] text-white flex items-center justify-center font-black shrink-0 shadow-xs group-hover:scale-105 transition-transform ${
              elderMode ? 'w-14 h-14 text-[24px]' : 'w-12 h-12 text-[20px]'
            }`}>
              4
            </div>
            <div className="flex flex-col">
              <span className={`text-[#032517] font-bold ${elderMode ? 'text-[20px] font-extrabold' : 'text-[16px]'}`}>
                {appLanguage === 'mix' ? "4. Tu'un Tachi (Ayuda Comunitaria)" : "4. Ayuda técnica"}
              </span>
              <span className={`text-[#424843] ${elderMode ? 'text-[15px] font-semibold' : 'text-[13px]'}`}>
                Chat directo con el equipo TecNM
              </span>
            </div>
          </div>
          {/* WhatsApp / Chat Icon Badge */}
          <div className={`rounded-full bg-[#c7ebd4] text-[#032517] flex items-center justify-center shrink-0 group-hover:bg-[#abcfb8] transition-colors ${
            elderMode ? 'w-12 h-12' : 'w-10 h-10'
          }`}>
            <span className={`material-symbols-outlined ${elderMode ? 'text-[26px]' : 'text-[22px]'}`}>chat</span>
          </div>
        </button>
      </div>

      {/* TARJETA DE NAVEGACIÓN POR VOZ (Reconocimiento en vivo para campo) */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-[#1b3b2b]/20 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1b3b2b] text-[22px]">mic</span>
            <div>
              <span className="text-[14px] font-bold text-[#032517] block">Navegación por Voz</span>
              <span className="text-[12px] text-[#424843]">Diga "1", "2", "3", "4" o el nombre de la opción</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleVoiceMenuRecording()}
            aria-label={isRecording ? 'Detener escucha de voz' : 'Hablar opción del menú'}
            className={`px-3 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#1b3b2b] text-white hover:bg-[#032517]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRecording ? 'stop' : 'mic'}
            </span>
            <span>{isRecording ? 'Detener' : 'Hablar opción'}</span>
          </button>
        </div>

        {/* Panel en vivo mientras graba */}
        {isRecording && (
          <div className="bg-[#1b3b2b] text-white p-3 rounded-xl border border-[#c7ebd4]/20 flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[12px] font-mono font-bold text-red-300">
                  0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                </span>
                <span className="text-[11px] text-[#c7ebd4] font-semibold">
                  Escuchando en vivo...
                </span>
              </div>
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="text-[11px] px-2 py-0.5 bg-white/15 hover:bg-white/25 rounded-full text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Nivel de volumen */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-emerald-300 font-bold">Voz:</span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-yellow-400 to-red-400 transition-all duration-75"
                  style={{ width: `${audioVolume}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-200">{audioVolume}%</span>
            </div>

            {/* Texto en vivo */}
            <div className="text-[12px] text-white/90 italic bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/10 truncate">
              {liveTranscript ? `"${liveTranscript}"` : 'Habla ahora: di "Opción 4", "Ayuda técnica", "Mis pagos"...'}
            </div>
          </div>
        )}

        {/* Toast de opción reconocida */}
        {recognizedOptionToast && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 animate-fadeIn shadow-2xs">
            <span className="material-symbols-outlined text-[18px] text-emerald-700">check_circle</span>
            <span>{recognizedOptionToast}</span>
          </div>
        )}

        {/* Mensaje de estado de micrófono / error */}
        {micStatusMessage && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[12px] px-3 py-1.5 rounded-xl flex items-center justify-between">
            <span>{micStatusMessage}</span>
            <button
              type="button"
              onClick={() => setMicStatusMessage(null)}
              className="text-amber-900 font-bold ml-2 text-[14px] cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Botón de Comprobación y Diagnóstico de Micrófono */}
        {onOpenMicDiagnostic && (
          <div className="pt-1 border-t border-[#c1c8c2]/20 flex items-center justify-between">
            <span className="text-[11px] text-[#727973]">¿Dudas si tu micro capta audio?</span>
            <button
              type="button"
              onClick={onOpenMicDiagnostic}
              className="text-[12px] font-bold text-[#1b3b2b] hover:text-[#032517] underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-[#f0eee8] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">build</span>
              <span>Probar y medir micrófono</span>
            </button>
          </div>
        )}
      </div>

      {/* TARJETA RÁPIDA DE ENTRADA POR TECLADO NUMÉRICO (Optimizado para teléfonos sencillos) */}
      <form
        onSubmit={handleNumericSubmit}
        className="mt-1 bg-[#f0eee8] p-3.5 rounded-2xl flex items-center justify-between gap-2 border border-[#c1c8c2]/30 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#727973] text-[22px]">dialpad</span>
          <span className="text-[14px] text-[#424843] font-medium">O escriba 1, 2, 3 o 4</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-16 h-10 text-center text-[18px] font-bold bg-white border border-[#727973] rounded-lg text-[#032517] focus:ring-2 focus:ring-[#a73918] focus:outline-none"
            placeholder="1-4"
            type="text"
            value={numericInput}
            onChange={(e) => setNumericInput(e.target.value)}
          />
          <button
            aria-label="Enviar número u opción"
            className="h-10 px-3 rounded-lg bg-[#032517] text-white flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-[#1b3b2b] text-[13px] font-bold cursor-pointer"
            type="submit"
          >
            <span>Ir</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </main>
  );
};
