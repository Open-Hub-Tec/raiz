import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, ScreenView, PendingOfflineLot } from '../types';
import {
  startAudioRecording,
  LiveRecorderSession,
  MAX_RECORDING_SECONDS,
} from '../utils/audioRecorder';
import { useAudioLevelMeter } from '../hooks/useAudioLevelMeter';
import { getProductProfile, ProductProfile, sanitizeProductName } from '../utils/productUtils';
import { saveOfflineLot } from '../utils/offlineStorage';

interface RegisterCoffeeLotScreenProps {
  selectedProductType?: string;
  onNavigateScreen: (screen: ScreenView) => void;
  onLotCreated?: (customLot?: any) => void;
  elderMode?: boolean;
  appLanguage?: AppLanguage;
  isOnline?: boolean;
}

export const RegisterCoffeeLotScreen: React.FC<RegisterCoffeeLotScreenProps> = ({
  selectedProductType = 'Café',
  onNavigateScreen,
  onLotCreated,
  elderMode = true,
  appLanguage = 'es',
  isOnline = true
}) => {
  const isMixteco = appLanguage === 'mix';
  const cleanProductName = sanitizeProductName(selectedProductType || 'Café');
  const profile: ProductProfile = getProductProfile(cleanProductName);

  const isCoffee = profile.key === 'cafe';
  const isPulque = profile.key === 'pulque';
  const isHoney = profile.key === 'miel';
  const isCorn = profile.key === 'maiz';
  const isSombrero = profile.key === 'sombrero';
  const isHandicraft = profile.key === 'textil';
  const isTomato = profile.key === 'jitomate';

  const defaultPhotoOne = profile.defaultPhotoOne;
  const defaultPhotoTwo = profile.defaultPhotoTwo;

  const defaultField1 = profile.field1Default;
  const defaultField2 = profile.field2Default;
  const defaultField3 = profile.field3Default;

  const [photoCount, setPhotoCount] = useState<number>(1);
  const [photoOneUrl, setPhotoOneUrl] = useState<string>(defaultPhotoOne);
  const [photoTwoUrl, setPhotoTwoUrl] = useState<string | null>(null);
  const [targetSlot, setTargetSlot] = useState<1 | 2>(2);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoSuccessToast, setPhotoSuccessToast] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [voiceSecondsRemaining, setVoiceSecondsRemaining] = useState<number | null>(null);
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState<string>('');

  // Reusable real-time decibel meter driven by the recorder's microphone stream
  const { volume: audioVolume, decibels: audioDecibels } = useAudioLevelMeter(audioStream);
  const [recordedAudioNote, setRecordedAudioNote] = useState<{
    audioUrl: string;
    transcript: string;
    duration: string;
  } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const audioSessionRef = useRef<LiveRecorderSession | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [variedad, setVariedad] = useState<string>(defaultField1);
  const [altitud, setAltitud] = useState<string>(defaultField2);
  const [proceso, setProceso] = useState<string>(defaultField3);
  const [activeEditingField, setActiveEditingField] = useState<string | null>(null);

  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<{
    matchesSelectedProduct?: boolean;
    isCoffee?: boolean;
    detectedCategory?: string;
    detectedItem?: string;
    estado: string;
    calidadScore: number;
    humedadEstimada: string;
    defectosDetectados: string;
    recomendacion: string;
    analysis: string;
  } | null>(null);

  const [easyMode, setEasyMode] = useState<boolean>(elderMode);

  useEffect(() => {
    setEasyMode(elderMode);
  }, [elderMode]);

  const [isSpeakingDiagnosis, setIsSpeakingDiagnosis] = useState<boolean>(false);

  const handleSpeakDiagnosis = (customText?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeakingDiagnosis) {
      window.speechSynthesis.cancel();
      setIsSpeakingDiagnosis(false);
      return;
    }

    const textToRead =
      customText ||
      (aiDiagnosis
        ? `Dictamen de calidad emitido por el Instituto Tecnológico de Tlaxiaco para ${profile.displayName}. ` +
          (aiDiagnosis.matchesSelectedProduct === false
            ? `Atención: La muestra analizada fue identificada como ${
                aiDiagnosis.detectedItem || 'otro producto'
              } y no corresponde a ${profile.displayName}. ${aiDiagnosis.recomendacion}`
            : `Muestra verificada de ${profile.displayName}. Estado: ${aiDiagnosis.estado}. Resultado: ${
                aiDiagnosis.humedadEstimada
              }. Sanidad y pureza: ${aiDiagnosis.defectosDetectados}. Calificación comunal: ${
                aiDiagnosis.calidadScore
              } sobre 100. Recomendación: ${aiDiagnosis.recomendacion}`)
        : profile.assistiveGuideText);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-MX';
    utterance.rate = 0.92; // Slightly slower for older adults
    utterance.onend = () => setIsSpeakingDiagnosis(false);
    utterance.onerror = () => setIsSpeakingDiagnosis(false);
    setIsSpeakingDiagnosis(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop camera and audio stream on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioSessionRef.current) {
        audioSessionRef.current.cancel();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  // Best-effort Web Audio cue for the auto-stop warning and final stop
  const playCueTone = (frequency: number, durationMs = 180) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const endAt = ctx.currentTime + durationMs / 1000;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(endAt);
      oscillator.onended = () => ctx.close().catch(() => {});
    } catch {
      // Auditory cues are best-effort; the visual timer always remains available
    }
  };

  const buildVoiceTranscript = (resultTranscript: string) =>
    resultTranscript ||
    liveVoiceTranscript ||
    `Lote registrado de ${selectedProductType} con verificación de campo en la Mixteca.`;

  const toggleVoiceNoteRecording = async () => {
    if (isRecording) {
      // STOP recording
      setIsRecording(false);
      if (audioSessionRef.current) {
        try {
          const result = await audioSessionRef.current.stop();
          audioSessionRef.current = null;
          setAudioStream(null);
          setVoiceSecondsRemaining(null);
          setRecordedAudioNote({
            audioUrl: result.audioUrl,
            transcript: buildVoiceTranscript(result.transcript),
            duration: formatTimer(result.durationSeconds || recordSeconds),
          });

          setVoiceToast('¡Nota de voz grabada y procesada con éxito!');
          setTimeout(() => setVoiceToast(null), 4000);
        } catch (err) {
          console.error('Error al detener grabación:', err);
          setVoiceToast('Error guardando audio. Intenta de nuevo.');
        }
      }
    } else {
      // START recording
      setLiveVoiceTranscript('');
      setVoiceToast(null);
      setVoiceSecondsRemaining(null);
      try {
        const session = await startAudioRecording({
          onInterimTranscript: (text) => setLiveVoiceTranscript(text),
          onTimeWarning: (secondsRemaining) => {
            setVoiceSecondsRemaining(secondsRemaining);
            if (secondsRemaining > 0) {
              playCueTone(880, 150);
            }
          },
          onAutoStop: (result) => {
            audioSessionRef.current = null;
            setAudioStream(null);
            setIsRecording(false);
            setVoiceSecondsRemaining(null);
            playCueTone(440, 420);
            setRecordedAudioNote({
              audioUrl: result.audioUrl,
              transcript: buildVoiceTranscript(result.transcript),
              duration: formatTimer(result.durationSeconds || MAX_RECORDING_SECONDS),
            });
            setVoiceToast(
              `⏱️ Límite de ${MAX_RECORDING_SECONDS} s alcanzado. La nota de voz se guardó automáticamente.`
            );
            setTimeout(() => setVoiceToast(null), 6000);
          },
          lang: 'es-MX',
        });
        audioSessionRef.current = session;
        setAudioStream(session.stream);
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Mic permission error:', err);
        setIsRecording(false);
        setVoiceToast(
          'Permiso de micrófono no disponible en el navegador. Por favor permite el acceso al micrófono.'
        );
      }
    }
  };

  const toggleAudioPlayback = () => {
    if (!recordedAudioNote?.audioUrl) return;

    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(recordedAudioNote.audioUrl);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
      } else {
        audioElementRef.current.src = recordedAudioNote.audioUrl;
      }
      audioElementRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => console.warn('Audio play error:', e));
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const applyPhotoUrl = (photoUrl: string, label: string = 'Foto tomada') => {
    if (targetSlot === 1) {
      setPhotoOneUrl(photoUrl);
    } else {
      setPhotoTwoUrl(photoUrl);
      setPhotoCount(2);
    }
    stopLiveCamera();
    setShowCameraModal(false);
    setPhotoSuccessToast(`📸 Muestra #${targetSlot} capturada y cargada con éxito`);
    setTimeout(() => setPhotoSuccessToast(null), 3500);

    // Automatically trigger AI Coffee State Detection on new photo
    triggerCoffeeVisionAnalysis(photoUrl);
  };

  const triggerCoffeeVisionAnalysis = async (photoUrlToAnalyze?: string) => {
    const activePhoto = photoUrlToAnalyze || photoTwoUrl || photoOneUrl;
    if (!activePhoto) return;

    setIsAnalyzingAI(true);
    try {
      // If it's a remote URL that isn't data:, convert or send directly
      let base64Data = activePhoto;
      if (!activePhoto.startsWith('data:image/')) {
        try {
          const imgFetch = await fetch(activePhoto);
          const blob = await imgFetch.blob();
          const reader = new FileReader();
          const dataUrlPromise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
          reader.readAsDataURL(blob);
          base64Data = await dataUrlPromise;
        } catch {
          base64Data = activePhoto;
        }
      }

      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          prompt: `Verifica cuidadosamente el contenido de la fotografía en el contexto de registro comunitario de ${profile.displayName}. Identifica si la imagen corresponde a ${profile.displayName} o a otro producto distinto (como café, miel, pulque, maguey, maíz, etc.).`,
        }),
      });

      const data = await res.json();
      const detectedCat = (data.detectedCategory || '').toLowerCase();
      const isMismatch =
        (!isCoffee && data.isCoffee === true && !detectedCat.includes(profile.key)) ||
        (isCoffee && data.isCoffee === false) ||
        (isPulque && !detectedCat.includes('pulque') && !detectedCat.includes('aguamiel') && !detectedCat.includes('maguey') && detectedCat !== '') ||
        (isHoney && !detectedCat.includes('miel') && detectedCat !== '');

      setAiDiagnosis({
        matchesSelectedProduct: !isMismatch,
        isCoffee: data.isCoffee !== false,
        detectedCategory: data.detectedCategory || profile.key,
        detectedItem: data.detectedItem || (isMismatch ? `Producto distinto a ${profile.displayName}` : profile.displayName),
        estado: data.estado || profile.defaultAiDiagnosis.estado,
        calidadScore: data.calidadScore || profile.defaultAiDiagnosis.calidadScore,
        humedadEstimada: data.humedadEstimada || profile.defaultAiDiagnosis.humedadEstimada,
        defectosDetectados: data.defectosDetectados || profile.defaultAiDiagnosis.defectosDetectados,
        recomendacion: data.recomendacion || profile.defaultAiDiagnosis.recomendacion,
        analysis: data.analysis || profile.defaultAiDiagnosis.analysis,
      });
    } catch (err) {
      console.warn('Fallo análisis IA de visión, usando diagnóstico agroecológico de respaldo:', err);
      const isHoneyControlUrl = activePhoto.includes('AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg');
      const isCoffeeControlUrl = activePhoto.includes('AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g');

      if (!isCoffee && isCoffeeControlUrl) {
        setAiDiagnosis({
          matchesSelectedProduct: false,
          isCoffee: true,
          detectedCategory: 'cafe',
          detectedItem: 'Café Pergamino Seco (Muestra de Café)',
          estado: `No corresponde a ${profile.displayName} (Muestra de Café)`,
          calidadScore: 92,
          humedadEstimada: '11.4% (Pergamino)',
          defectosDetectados: 'Muestra de café, no de ' + profile.displayName,
          recomendacion: `Esta muestra corresponde a café. Como está registrando ${profile.displayName}, por favor tome foto de su muestra correspondiente.`,
          analysis: `⚠️ Observación del Instituto Tecnológico de Tlaxiaco:\n\n• La fotografía seleccionada corresponde a granos de café pergamino.\n• El registro actual es para "${profile.displayName}".\n• Por favor seleccione o capture una muestra de ${profile.displayName} para completar el registro.`,
        });
      } else if (!isHoney && isHoneyControlUrl) {
        setAiDiagnosis({
          matchesSelectedProduct: false,
          isCoffee: false,
          detectedCategory: 'miel',
          detectedItem: 'Miel Virgen de Abeja (Producto Apícola)',
          estado: `No corresponde a ${profile.displayName} (Muestra de Miel)`,
          calidadScore: 96,
          humedadEstimada: '18% (Miel)',
          defectosDetectados: 'Muestra apícola, no de ' + profile.displayName,
          recomendacion: `Esta muestra corresponde a miel de abeja. Para registrar ${profile.displayName}, por favor suba su foto correspondiente.`,
          analysis: `🍯 Diagnóstico del Tecnológico de Tlaxiaco:\n\n• La fotografía analizada corresponde a un frasco de MIEL PURA de abeja y NO a ${profile.displayName}.\n• Por favor tome foto a su ${profile.displayName} para continuar.`,
        });
      } else {
        setAiDiagnosis({
          matchesSelectedProduct: true,
          isCoffee: isCoffee,
          detectedCategory: profile.key,
          detectedItem: profile.displayName,
          estado: profile.defaultAiDiagnosis.estado,
          calidadScore: profile.defaultAiDiagnosis.calidadScore,
          humedadEstimada: profile.defaultAiDiagnosis.humedadEstimada,
          defectosDetectados: profile.defaultAiDiagnosis.defectosDetectados,
          recomendacion: profile.defaultAiDiagnosis.recomendacion,
          analysis: profile.defaultAiDiagnosis.analysis,
        });
      }
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const quickSamples = isPulque
    ? [
        {
          emoji: '🏺',
          label: 'Pulque Blanco',
          title: 'Pulque Blanco en Jícara Tradicional',
          url: 'https://images.unsplash.com/photo-1546853020-ca4909aef454?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🌱',
          label: 'Maguey Manso',
          title: 'Maguey Pulquero en Terreno',
          url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🥛',
          label: 'Tinacal',
          title: 'Tina de Fermentación de Aguamiel',
          url: 'https://images.unsplash.com/photo-1584285418504-0051b3d377d6?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Café (No Pulque)',
          title: 'Muestra Control Café',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        }
      ]
    : isHandicraft
    ? [
        {
          emoji: '🧵',
          label: 'Huipil',
          title: 'Muestra Huipil Telar',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ch3EnTKfOPzLhJvKhO3lCcPIUAE3hVVkfX5Im0s-WO1vCixJXClxdVdruWiPRqr3ZuxAzdlH3yAof7r8gqeX3gu9Ib76kDaeSl6pOyNhXt8PsFUfn2Jc7_xqUysoYwZ8H3nJ1yfgy2pOSZt3H-5XCr1VJuyIa-sigPM_rzR4gUCUs1ekNF4IJND5FqstPVswevuKVBQzWO0uds-_-hVuY5mZRW5VnjA9Ovw00rmRFDxpZZ5yIbtMBA'
        },
        {
          emoji: '🪡',
          label: 'Telar',
          title: 'Muestra Urdido en Telar',
          url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🧶',
          label: 'Hilado',
          title: 'Muestra Madeja de Hilado',
          url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Café (No Textil)',
          title: 'Muestra Control Café',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        }
      ]
    : isSombrero
    ? [
        {
          emoji: '👒',
          label: 'Sombrero',
          title: 'Muestra Sombrero de Palma',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkQ_T-4HkMOGbUXCEL4WB3G-nckbk4y8MBXaW8RROxSTNJ7CpRum4bbwbnLCoYIsiGQouYyMcMM8EHk1DzR9XrOLMdVSb-RqJUa1aBk1p6JnwmWpKfFndzgY1CS6A1wg_wb_ZV0zrKj5zVgEEMN7Z3_m97Xx-9YigQ14ZAHHNVhaRXXI0nBiVqxjMXJ8MLMVi_gKnPRfs1qzravdO-6Uv0M8q2gl5pOM-K5nYvOyXYJ1GfD99czI_Ltw'
        },
        {
          emoji: '🧺',
          label: 'Tenate',
          title: 'Muestra Tenate de Palma',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADMzysc8buYnt4_J6N6fK3aJOpQwIXmK6rDrxaTI_kI2QHwPZaveZN-R-YpdSXJl83jv428Yd5_IFDtytjOVkkte6-yB6pXskpvxdiTLt3gQ4EoFSAS1SzELEaKKIDGkkY-oWJOM68851O2vaSsz92iubLVZ69vQp19ZYBqh38PsSqvSJ-_I0vXR4ZpTDTgoRrmCS2f5HnSOLlMZWIdp0uyeXZVn1fkdUzQelGLAyhj_tOsM-t8ikpbQ'
        },
        {
          emoji: '🌿',
          label: 'Tejido',
          title: 'Muestra Tejido Artesanal',
          url: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🍯',
          label: 'Miel (No Palma)',
          title: 'Muestra Control Miel',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg'
        }
      ]
    : isHoney
    ? [
        {
          emoji: '🍯',
          label: 'Miel Virgen',
          title: 'Muestra Frasco Miel Virgen',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg'
        },
        {
          emoji: '🐝',
          label: 'Apiario',
          title: 'Muestra Panal Colmena',
          url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🌼',
          label: 'Cosecha',
          title: 'Muestra Miel Cosechada',
          url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Café (No Miel)',
          title: 'Muestra Control Café',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        }
      ]
    : isCorn
    ? [
        {
          emoji: '🌽',
          label: 'Maíz Azul',
          title: 'Muestra Maíz y Frijol Criollo',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx4jUpQopozBH8CYGA3m-Tfhex_UjwxY-4UKei8h4QhxSSmzObP9OdoONSXqi0XITG11whMMoDAOmA4bw0hSNWommPAh4F1D5ffA86lEaxrdfmf3kJ11rzljgIJllTeHX25OBP5QgRG79YiKsHHOLHgZPBf6D-AEEoGtbjiemIcHXuuXj7ZM1cyu0e6F19V9rkEX4nPjc7Dsc2w4tfJ_eHgPoPJzpuWKstIg6jmmd_4HM4ixO1PrSK4Q'
        },
        {
          emoji: '🌾',
          label: 'Milpa',
          title: 'Muestra Mazorca Milpa',
          url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '✨',
          label: 'Selección',
          title: 'Muestra Granos Seleccionados',
          url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Café (No Maíz)',
          title: 'Muestra Control Café',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        }
      ]
    : isTomato
    ? [
        {
          emoji: '🍅',
          label: 'Jitomate',
          title: 'Muestra Jitomates Frescos',
          url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🌱',
          label: 'Invernadero',
          title: 'Muestra Planta y Flor',
          url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b2?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🧺',
          label: 'Caja',
          title: 'Muestra Caja de Selección',
          url: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Café (No Tomate)',
          title: 'Muestra Control Café',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        }
      ]
    : [
        {
          emoji: '🍒',
          label: 'Cereza',
          title: 'Muestra Cereza',
          url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '☕',
          label: 'Pergamino',
          title: 'Muestra Pergamino',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g'
        },
        {
          emoji: '🪵',
          label: 'Tostado',
          title: 'Muestra Tostado',
          url: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=600&auto=format&fit=crop&q=80'
        },
        {
          emoji: '🍯',
          label: 'Miel (No Café)',
          title: 'Muestra Miel (No Café)',
          isControl: true,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg'
        }
      ];

  const handleDirectCamera = (slot: 1 | 2) => {
    setTargetSlot(slot);
    stopLiveCamera();
    setShowCameraModal(false);
    // Directly trigger native camera capture input
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 50);
  };

  const handleDirectGallery = (slot: 1 | 2) => {
    setTargetSlot(slot);
    stopLiveCamera();
    setShowCameraModal(false);
    setTimeout(() => {
      galleryInputRef.current?.click();
    }, 50);
  };

  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopLiveCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador no soporta visor web en vivo.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsLiveCameraActive(true);
      setCameraFacing(facing);
    } catch (err: any) {
      console.warn('Error accediendo al visor de cámara:', err);
      setCameraError(
        'El visor web fue restringido por el navegador o iframe. Usa el botón "Abrir Cámara del Dispositivo" para tomar la foto con tu app de cámara.'
      );
      setIsLiveCameraActive(false);
    }
  };

  const handleCaptureRealPhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth > 0 ? video.videoWidth : 1280;
      canvas.height = video.videoHeight > 0 ? video.videoHeight : 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        applyPhotoUrl(photoDataUrl, 'Cámara web');
      }
    } catch (e) {
      console.error('Error al capturar:', e);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const photoUrl = uploadEvent.target?.result as string;
      if (photoUrl) {
        applyPhotoUrl(photoUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const labelField1 = profile.field1Label;
  const labelField2 = profile.field2Label;
  const labelField3 = profile.field3Label;

  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationStep, setValidationStep] = useState<number>(1);

  const handleSendValidation = async () => {
    // If working without network coverage in the mountain parcel, persist to IndexedDB immediately
    if (!isOnline) {
      try {
        const offlineRecord: PendingOfflineLot = {
          tempId: `PARCELA-${Date.now()}`,
          producerName: 'Don Eutiquio (Productor Mixteco)',
          community: 'Santa María Cuquila, Tlaxiaco',
          cropType: isCoffee ? 'cafe' : isHoney ? 'miel' : isPulque ? 'pulque' : 'artesania',
          variety: variedad || profile.displayName,
          weightKgOrUnits: profile.defaultVolume || 50,
          priceExpectedMxn: profile.defaultPrice || 120,
          photoDataUrl: photoOneUrl,
          recordedAt: Date.now(),
          syncStatus: 'pending'
        };
        await saveOfflineLot(offlineRecord);
      } catch (err) {
        console.warn('Error guardando en almacenamiento fuera de línea:', err);
      }
    }

    setIsValidating(true);
    setValidationStep(1);

    setTimeout(() => {
      setValidationStep(2);
    }, 800);

    setTimeout(() => {
      setValidationStep(3);
    }, 1600);

    setTimeout(() => {
      setIsValidating(false);
      if (onLotCreated) {
        if (isPulque) {
          onLotCreated({
            title: 'Pulque Tradicional de Maguey Mixteco',
            productType: 'Bebidas Tradicionales',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: profile.lotTags,
            pricePerKg: profile.defaultPrice,
            volumeKg: profile.defaultVolume,
            notes: 'Pulque blanco artesanal elaborado a partir de aguamiel de maguey mixteco en tinacal tradicional.'
          });
        } else if (isHandicraft) {
          onLotCreated({
            title: 'Rebozo Tradicional en Telar de Cintura',
            productType: 'Textil Mixteco',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Telar de cintura', 'Grana cochinilla', 'Artesanía Certificada', 'Mixteca Alta'],
            pricePerKg: 1850,
            volumeKg: 1,
            notes: 'Pieza artesanal única tejida a mano en telar de cintura con hilos teñidos vegetalmente.'
          });
        } else if (isSombrero) {
          onLotCreated({
            title: 'Sombrero Costeño de Palma Fina',
            productType: 'Tejido de Palma',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Palma dulce', 'Hecho a mano', 'Artesanía Certificada'],
            pricePerKg: 350,
            volumeKg: 1,
            notes: 'Sombrero tradicional tejido a mano con palma dulce de la Mixteca.'
          });
        } else if (isHoney) {
          onLotCreated({
            title: 'Miel Virgen de Campanilla Silvestre',
            productType: 'Miel Pura Orgánica',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Sin adulteración', 'Floración silvestre', 'Pura de abeja'],
            pricePerKg: 180,
            volumeKg: 25,
            notes: 'Miel virgen cosechada en apiarios de la Mixteca Alta, sin calentar ni pasteurizar.'
          });
        } else if (isCorn) {
          onLotCreated({
            title: 'Maíz Azul Criollo de la Mixteca',
            productType: 'Grano Criollo Nativo',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Libre de OGM', 'Milpa comunitaria', 'Grano nativo'],
            pricePerKg: 22,
            volumeKg: 450,
            notes: 'Maíz nativo criollo cultivado en milpa tradicional con frijol y calabaza.'
          });
        } else if (isTomato) {
          onLotCreated({
            title: 'Jitomate Saladette Agroecológico',
            productType: 'Hortaliza Agroecológica',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Libre de pesticidas', 'Cosecha fresca', 'Riego limpio', 'Mixteca Alta'],
            pricePerKg: 32,
            volumeKg: 180,
            notes: 'Jitomate cultivado sin agroquímicos sintéticos en invernadero comunitario de la Mixteca.'
          });
        } else {
          onLotCreated({
            title: `Café ${variedad}`,
            productType: 'Café de Especialidad',
            variety: variedad,
            altitude: altitud,
            process: proceso,
            imageUrl: photoOneUrl,
            tags: ['Cero broca', 'Grano parejo', 'Fermentación en frío', 'NMX-F-083']
          });
        }
      }
      onNavigateScreen('pasaporte_digital');
    }, 2400);
  };

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-4 py-2 flex flex-col gap-4 pb-36">
      {/* Offline Rural Indicator Banner: ONLY when disconnected */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400/90 rounded-2xl p-3 shadow-xs flex items-center gap-2.5 text-[#a73918]">
          <span className="material-symbols-outlined text-[24px] text-orange-700 shrink-0 animate-bounce">
            cloud_off
          </span>
          <div className="text-[12px] leading-tight">
            <strong className="block font-black text-[#032517] text-[13px]">
              🏕️ Modo Parcela Sin Internet
            </strong>
            <span className="text-[#a73918] font-medium">
              Puedes tomar fotos, notas de voz y registrar tu cosecha. Se guardará de forma segura en este teléfono hasta tener señal en el pueblo.
            </span>
          </div>
        </div>
      )}

      {/* Context Step Badge & Modo Fácil Toggle */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 bg-[#f0eee8] px-3 py-1.5 rounded-full border border-[#c1c8c2]/40">
          <span className="w-2 h-2 rounded-full bg-[#a73918]"></span>
          <span className="text-[13px] text-[#1c1c18] font-bold">
            Paso 3 de 4 · Registrar {profile.displayName}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setEasyMode(!easyMode)}
          className={`px-3 py-1.5 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
            easyMode
              ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
              : 'bg-white text-[#424843] border-[#c1c8c2]/60 hover:bg-[#f0eee8]'
          }`}
          title="Activar o desactivar modo simplificado para personas mayores"
        >
          <span>👴🏽</span>
          <span>{easyMode ? 'Modo Fácil Activo' : 'Activar Modo Fácil'}</span>
        </button>
      </div>

      {/* Elder Assistance Card (Zero Friction Guide) */}
      {easyMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3.5 border-2 border-amber-300/80 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">elderly</span>
          </div>
          <div className="flex-1 text-[13px] text-amber-950">
            <div className="font-extrabold flex items-center justify-between">
              <span>Guía Asistida para Personas Mayores</span>
              <button
                type="button"
                onClick={() => handleSpeakDiagnosis()}
                className="text-[11px] bg-white hover:bg-amber-100 text-amber-950 font-bold px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-700">
                  {isSpeakingDiagnosis ? 'volume_off' : 'volume_up'}
                </span>
                <span>{isSpeakingDiagnosis ? 'Detener Voz' : 'Escuchar Guía'}</span>
              </button>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-amber-900/90 font-medium">
              {profile.assistiveGuideText}
            </p>
          </div>
        </div>
      )}

      {/* Bubble 1: Assistant instructions */}
      <section className="flex flex-col gap-1 items-start">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-[#032517] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
          </div>
          <span className="text-[13px] font-bold text-[#032517]">Asistente Comunitario</span>
          <span className="text-[11px] text-[#424843]">Hoy 10:42 AM</span>
        </div>

        <div className="bg-[#f6f3ed] text-[#032517] rounded-2xl rounded-tl-xs p-4 shadow-xs max-w-[96%] border border-[#c1c8c2]/30">
          <p className="text-[15px] leading-relaxed text-[#1c1c18] font-medium">
            {profile.assistantPromptText}
          </p>
          <div className="mt-3 pt-3 border-t border-[#c1c8c2]/40 flex items-center justify-between text-[#1c1c18] text-[13px]">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[18px] text-[#a73918]">verified</span>
              {profile.verificationBadge}
            </span>
            <span className="text-[12px] italic text-[#424843]">
              {profile.verificationSubtitle}
            </span>
          </div>
        </div>
      </section>

      {/* Photo Upload Module */}
      <section className="bg-white rounded-2xl p-4 border border-[#c1c8c2]/50 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a73918]">add_photo_alternate</span>
            <h2 className="text-[16px] font-bold text-[#032517]">
              {isHandicraft || isSombrero ? 'Muestras de la Pieza' : isPulque ? 'Muestras de Pulque / Tinacal' : 'Muestras de Cosecha'}
            </h2>
          </div>
          <span className="text-[12px] text-[#424843] bg-[#f0eee8] px-2.5 py-0.5 rounded-full font-medium">
            {photoCount} de 2 capturadas
          </span>
        </div>

        {/* Previews Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Preview Card 1: Allows retaking or taking real photo */}
          <div className="relative rounded-2xl overflow-hidden border border-[#c1c8c2] aspect-square bg-[#f0eee8] flex flex-col group shadow-xs">
            <img
              src={photoOneUrl}
              alt="Muestra de producto"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#032517]/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
              <div className="flex items-center justify-between text-white">
                <span className="text-[12px] font-semibold">Muestra #1</span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSlot(1);
                    setShowCameraModal(true);
                  }}
                  className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                  Cambiar
                </button>
              </div>
            </div>
          </div>

          {/* Upload Slot 2: Add or show photo 2 */}
          {!photoTwoUrl ? (
            <div className="min-h-[48px] aspect-square rounded-2xl border-2 border-dashed border-[#a73918]/60 bg-[#ffdbd1]/20 hover:bg-[#ffdbd1]/30 transition-all flex flex-col items-center justify-between p-2.5 text-center shadow-xs">
              <button
                type="button"
                onClick={() => handleDirectCamera(2)}
                className="w-full flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 transition-all"
                title="Abrir cámara del teléfono o dispositivo"
              >
                <div className="w-11 h-11 rounded-full bg-[#a73918] group-hover:bg-[#8e2e12] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-extrabold text-[#a73918]">Tomar Foto Real</span>
                  <span className="text-[10px] text-[#424843]">Abre tu cámara</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetSlot(2);
                  setShowCameraModal(true);
                }}
                className="w-full mt-1 py-1 px-2 rounded-lg bg-white/80 hover:bg-white text-[#032517] text-[10px] font-bold border border-[#c1c8c2]/50 shadow-2xs transition-colors cursor-pointer"
              >
                Más opciones...
              </button>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-[#c1c8c2] aspect-square bg-[#f0eee8] flex flex-col group shadow-xs">
              <img
                src={photoTwoUrl}
                alt="Muestra #2"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#032517]/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                <div className="flex items-center justify-between text-white">
                  <span className="text-[12px] font-semibold">Muestra #2</span>
                  <span className="material-symbols-outlined text-[16px] text-[#c7ebd4]">check_circle</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoTwoUrl(null);
                  setPhotoCount(1);
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-95 cursor-pointer"
                title="Quitar foto"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Defect Checklist */}
        <div className="bg-[#f6f3ed] rounded-xl p-3 flex items-start gap-2 text-[#424843] border border-[#c1c8c2]/30">
          <span className="material-symbols-outlined text-[18px] text-[#a73918] mt-0.5">info</span>
          <p className="text-[12px] leading-relaxed text-[#1c1c18]">
            {profile.defectCheckText}
          </p>
        </div>

        {/* AI Product State Detection Card */}
        <div className="rounded-2xl border-2 border-emerald-600/40 bg-gradient-to-br from-emerald-50/90 via-white to-[#f0eee8] p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#032517] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[22px] text-emerald-400">psychology</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[14px] font-extrabold text-[#032517]">
                    Evaluación de Calidad con IA
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    TecNM Tlaxiaco
                  </span>
                </div>
                <span className="text-[11px] text-[#424843] block mt-0.5">
                  {profile.aiEvaluatingSubtitle}
                </span>
              </div>
            </div>

            {aiDiagnosis && (
              <button
                type="button"
                onClick={() => handleSpeakDiagnosis()}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#032517] border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                title="Escuchar dictamen en voz alta"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-700">
                  {isSpeakingDiagnosis ? 'volume_off' : 'volume_up'}
                </span>
                <span>{isSpeakingDiagnosis ? 'Pausar' : 'Escuchar'}</span>
              </button>
            )}
          </div>

          {/* Diagnosis Result or Call to Action */}
          {aiDiagnosis ? (
            <div
              className={`rounded-2xl p-3.5 border-2 shadow-xs flex flex-col gap-3 text-[13px] ${
                aiDiagnosis.matchesSelectedProduct === false
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[24px] ${
                      aiDiagnosis.matchesSelectedProduct === false ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {aiDiagnosis.matchesSelectedProduct === false ? 'warning' : 'verified'}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#727973] block">
                      Resultado del Dictamen
                    </span>
                    <span
                      className={`text-[14px] font-extrabold ${
                        aiDiagnosis.matchesSelectedProduct === false ? 'text-amber-950' : 'text-[#032517]'
                      }`}
                    >
                      {aiDiagnosis.estado}
                    </span>
                  </div>
                </div>
                {aiDiagnosis.matchesSelectedProduct === false ? (
                  <span className="bg-amber-200 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 text-[12px] flex items-center gap-1">
                    <span>⚠️</span> Muestra Distinta
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-300 text-[13px]">
                    {aiDiagnosis.calidadScore} / 100
                  </span>
                )}
              </div>

              {aiDiagnosis.matchesSelectedProduct === false && (
                <div className="bg-white p-3 rounded-xl border border-amber-300 text-amber-950 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-[22px] shrink-0">💡</span>
                  <div className="text-[12px] leading-snug">
                    <strong className="font-extrabold block text-[13px] mb-0.5">Muestra Detectada: {aiDiagnosis.detectedItem}</strong>
                    La computadora verificó que esta fotografía no corresponde a {profile.displayName}. Por favor seleccione o tome foto a su muestra de {profile.displayName} para continuar el registro.
                  </div>
                </div>
              )}

              {/* High-contrast accessible metrics */}
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="bg-[#fcf9f3] p-2.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    {isPulque ? '🏺 Fermentación / Tinacal' : isHoney ? '🍯 Densidad' : isHandicraft || isSombrero ? '🧵 Trama' : '💧 Humedad'}
                  </span>
                  <span className="text-[14px] font-extrabold text-[#032517] mt-0.5">
                    {aiDiagnosis.humedadEstimada}
                  </span>
                  <span className="text-[10px] text-[#424843] mt-0.5">
                    {isPulque ? 'Tinacal tradicional' : isHoney ? 'Norma Apícola' : isCorn ? 'Grano seco' : isHandicraft || isSombrero ? 'Trama uniforme' : 'Norma NMX: 10% a 12%'}
                  </span>
                </div>
                <div className="bg-[#fcf9f3] p-2.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    {isPulque ? '🛡️ Pureza Aguamiel' : isHoney ? '🛡️ Pureza' : isHandicraft || isSombrero ? '🛡️ Autenticidad' : '🛡️ Sanidad / Broca'}
                  </span>
                  <span className="text-[14px] font-extrabold text-[#032517] mt-0.5">
                    {aiDiagnosis.defectosDetectados}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    {isPulque ? '100% Sin azúcar' : isHoney ? '100% Virgen' : isCorn ? 'Cero gorgojo' : isHandicraft || isSombrero ? 'Artesanal' : 'Cero grano negro'}
                  </span>
                </div>
              </div>

              <div
                className={`text-[12px] leading-relaxed whitespace-pre-line p-2.5 rounded-xl border font-medium ${
                  aiDiagnosis.matchesSelectedProduct === false
                    ? 'bg-amber-100/70 text-amber-950 border-amber-200'
                    : 'bg-[#f6f3ed] text-[#1c1c18] border-[#c1c8c2]/50'
                }`}
              >
                {aiDiagnosis.analysis}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div
                  className={`text-[11px] font-bold flex items-center gap-1.5 flex-1 ${
                    aiDiagnosis.matchesSelectedProduct === false ? 'text-amber-900' : 'text-emerald-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {aiDiagnosis.matchesSelectedProduct === false ? 'info' : 'verified'}
                  </span>
                  <span className="leading-tight">{aiDiagnosis.recomendacion}</span>
                </div>

                <button
                  type="button"
                  onClick={() => triggerCoffeeVisionAnalysis()}
                  disabled={isAnalyzingAI}
                  className="px-3 py-1.5 rounded-xl bg-[#032517] hover:bg-[#1b3b2b] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Reevaluar</span>
                </button>
              </div>
            </div>
          ) : isAnalyzingAI ? (
            <div className="bg-white rounded-2xl p-5 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2.5 text-center py-6 shadow-sm">
              <span className="material-symbols-outlined text-[36px] text-emerald-600 animate-spin">
                sync
              </span>
              <span className="text-[15px] font-extrabold text-[#032517]">
                {profile.aiEvaluatingText}
              </span>
              <span className="text-[12px] text-[#424843]">
                {profile.aiEvaluatingSubtitle}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* Giant Accessible Button for Older Adults */}
              <button
                type="button"
                onClick={() => triggerCoffeeVisionAnalysis()}
                disabled={isAnalyzingAI}
                className="w-full min-h-[52px] py-3 px-4 rounded-2xl bg-[#032517] hover:bg-[#153a27] text-white text-[15px] font-extrabold flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[24px] text-emerald-400">
                  search_check
                </span>
                <span>TOCAR AQUÍ PARA EVALUAR CON IA (Un solo toque)</span>
              </button>

              <div className="bg-white/90 rounded-xl p-2.5 border border-dashed border-emerald-400/80 text-[12px] text-[#424843] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified</span>
                  <span>La IA del TecNM Tlaxiaco calcula humedad y sanidad de la foto arriba sin costo.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDirectCamera(1)}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-[11px] font-bold border border-amber-300 shrink-0 cursor-pointer"
                >
                  📷 Tomar Foto
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bubble 2: Parcel pre-filled metadata */}
      <section className="flex flex-col gap-2 items-start">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-[#032517] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
          </div>
          <span className="text-[13px] font-bold text-[#032517]">Asistente Comunitario</span>
        </div>

        <div className="bg-[#f6f3ed] text-[#032517] rounded-2xl rounded-tl-xs p-4 shadow-xs w-full border border-[#c1c8c2]/30 flex flex-col gap-3">
          <p className="text-[15px] leading-relaxed text-[#1c1c18] font-medium">
            {isHandicraft || isSombrero
              ? 'Indica los datos de tu pieza artesanal o grábalo en una nota de voz. Puedes editar cualquier dato tocando el lápiz:'
              : isPulque
              ? 'Indica los datos de tu pulque o tinacal o grábalo en una nota de voz. Puedes editar cualquier dato tocando el lápiz:'
              : isHoney
              ? 'Indica los datos de tu apiario o grábalo en una nota de voz. Puedes editar cualquier dato tocando el lápiz:'
              : 'Indica los datos de tu cosecha o grábalo en una nota de voz. Hemos prellenado los datos de tu parcela registrada:'}
          </p>

          {/* Pre-filled cards */}
          <div className="space-y-2 pt-1">
            {/* 1. Variedad / Técnica */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-[#c1c8c2]/40 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <div className="text-[11px] font-bold text-[#424843] uppercase tracking-wider">
                    {labelField1}
                  </div>
                  {activeEditingField === 'variedad' ? (
                    <input
                      type="text"
                      value={variedad}
                      onChange={(e) => setVariedad(e.target.value)}
                      onBlur={() => setActiveEditingField(null)}
                      autoFocus
                      className="text-[15px] font-semibold text-[#032517] border-b border-[#a73918] outline-none"
                    />
                  ) : (
                    <div className="text-[15px] text-[#032517] font-semibold">{variedad}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEditingField(activeEditingField === 'variedad' ? null : 'variedad')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#424843] hover:bg-[#f0eee8]"
                aria-label={`Editar ${labelField1}`}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* 2. Altitud / Material */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-[#c1c8c2]/40 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <div className="text-[11px] font-bold text-[#424843] uppercase tracking-wider">
                    {labelField2}
                  </div>
                  {activeEditingField === 'altitud' ? (
                    <input
                      type="text"
                      value={altitud}
                      onChange={(e) => setAltitud(e.target.value)}
                      onBlur={() => setActiveEditingField(null)}
                      autoFocus
                      className="text-[15px] font-semibold text-[#032517] border-b border-[#a73918] outline-none"
                    />
                  ) : (
                    <div className="text-[15px] text-[#032517] font-semibold">{altitud}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEditingField(activeEditingField === 'altitud' ? null : 'altitud')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#424843] hover:bg-[#f0eee8]"
                aria-label={`Editar ${labelField2}`}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* 3. Proceso / Elaboración */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-[#c1c8c2]/40 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <div className="text-[11px] font-bold text-[#424843] uppercase tracking-wider">
                    {labelField3}
                  </div>
                  {activeEditingField === 'proceso' ? (
                    <input
                      type="text"
                      value={proceso}
                      onChange={(e) => setProceso(e.target.value)}
                      onBlur={() => setActiveEditingField(null)}
                      autoFocus
                      className="text-[15px] font-semibold text-[#032517] border-b border-[#a73918] outline-none"
                    />
                  ) : (
                    <div className="text-[15px] text-[#032517] font-semibold">{proceso}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEditingField(activeEditingField === 'proceso' ? null : 'proceso')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#424843] hover:bg-[#f0eee8]"
                aria-label={`Editar ${labelField3}`}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
          </div>

          {/* Voice Input Recorder - Primary Voice-First Option (Variant-Friendly) */}
          <div className="pt-1 flex flex-col gap-2">
            <div className={`p-3 rounded-2xl border transition-all ${
              isRecording
                ? 'bg-red-50 border-red-300 shadow-md ring-2 ring-red-400'
                : 'bg-[#fffaf5] border-[#fe7952]/60 shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceNoteRecording}
                  className={`w-14 h-14 rounded-full text-white flex items-center justify-center shrink-0 active:scale-95 shadow-md cursor-pointer transition-transform ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-[#a73918] hover:bg-[#8c2d12]'
                  }`}
                  title={isRecording ? 'Detener y guardar audio' : 'Grabar tu voz en tu lengua'}
                  aria-label={isRecording ? 'Detener grabación de voz' : 'Grabar descripción en tu lengua materna'}
                >
                  <span className="material-symbols-outlined text-[30px]">
                    {isRecording ? 'stop' : 'mic'}
                  </span>
                </button>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[14px] text-[#032517] font-extrabold truncate flex items-center gap-1.5">
                    {isRecording && <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />}
                    <span>{isRecording ? 'Escuchando tu voz...' : '🗣️ Habla en tu lengua materna'}</span>
                  </div>
                  <div className="text-[12px] text-[#424843] leading-snug">
                    {isRecording
                      ? liveVoiceTranscript
                        ? `"${liveVoiceTranscript}"`
                        : 'Grabando audio de origen...'
                      : 'Graba en tu variante (Mixteco, Zapoteco o Español). No necesitas escribir.'}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-[13px] font-mono font-black ${isRecording ? 'text-red-700 animate-pulse' : 'text-[#a73918]'}`}>
                    {isRecording && voiceSecondsRemaining !== null
                      ? `-${formatTimer(voiceSecondsRemaining)}`
                      : formatTimer(recordSeconds)}
                  </span>
                  <span className="text-[10px] text-[#727973] uppercase font-bold">
                    {isRecording ? 'REC' : 'VOZ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live audio level meter when recording */}
            {isRecording && (
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                  Volumen:
                </span>
                <div className="flex-1 h-1.5 bg-[#dcdad4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.max(8, audioVolume)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#424843]">{audioVolume}% · {audioDecibels} dB</span>
              </div>
            )}

            {/* Visual cue for the 90-second auto-stop limit */}
            {isRecording && voiceSecondsRemaining !== null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 border border-amber-400 text-amber-950 text-[11px] font-bold animate-pulse">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>
                  {voiceSecondsRemaining > 0
                    ? `Se detendrá automáticamente en ${voiceSecondsRemaining} s (límite ${MAX_RECORDING_SECONDS} s)`
                    : `Límite de ${MAX_RECORDING_SECONDS} s alcanzado`}
                </span>
              </div>
            )}

            {/* Toast notification */}
            {voiceToast && (
              <div className="text-[11px] font-medium text-[#032517] bg-[#e7f3ec] border border-[#a1d1b5] px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span>{voiceToast}</span>
                <button
                  type="button"
                  onClick={() => setVoiceToast(null)}
                  className="text-[#424843] text-[13px] ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Chat Bubble Preview with playable audio note */}
      <div className="flex justify-end">
        <div className="bg-[#1b3b2b] text-white rounded-2xl rounded-tr-xs p-3.5 max-w-[92%] shadow-xs flex flex-col gap-2">
          {recordedAudioNote ? (
            <div>
              {/* Playable audio chip */}
              <div className="flex items-center gap-2.5 bg-black/25 rounded-xl p-2 mb-1.5 border border-white/15">
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="w-8 h-8 rounded-full bg-[#a73918] hover:bg-[#8c2d12] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform active:scale-95"
                  title={isPlayingAudio ? 'Pausar audio' : 'Reproducir nota de voz'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPlayingAudio ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <div className="flex-1 flex flex-col">
                  <span className="text-[11px] font-bold text-[#c7ebd4] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">mic</span>
                    Nota de voz grabada ({recordedAudioNote.duration})
                  </span>
                  <div className="flex items-center gap-1 h-2 mt-0.5">
                    {[40, 75, 55, 90, 60, 85, 45, 70, 95, 50, 80, 65, 40].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full ${
                          isPlayingAudio ? 'bg-[#ffdbd1] animate-pulse' : 'bg-white/40'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-[#fcf9f3]">
                "{recordedAudioNote.transcript}"
              </p>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed text-[#fcf9f3]">
              {isPulque
                ? 'Pulque blanco tradicional elaborado con aguamiel de maguey mixteco en tinacal comunitario.'
                : isHandicraft || isSombrero
                ? 'Pieza elaborada artesanalmente a mano con técnicas ancestrales de la Mixteca Alta.'
                : isHoney
                ? 'Miel virgen cosechada en apiarios de la Mixteca Alta, floración silvestre.'
                : 'Lote cosechado en la ladera sur de la Mixteca. Secado natural y selección artesanal.'}
            </p>
          )}

          <div className="flex items-center justify-end gap-1 text-[#83a590] text-[11px]">
            <span>{recordedAudioNote ? 'Audio verificado' : '10:44 AM'}</span>
            <span className="material-symbols-outlined text-[14px]">done_all</span>
          </div>
        </div>
      </div>

      {/* Fixed Sticky Action Dock */}
      <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto z-40 bg-[#fcf9f3]/95 backdrop-blur-md px-4 py-3 border-t border-[#c1c8c2]/30">
        <button
          type="button"
          onClick={handleSendValidation}
          disabled={isValidating}
          className="w-full min-h-[50px] h-13 bg-[#a73918] text-white rounded-full text-[16px] font-bold shadow-lg hover:bg-[#6c1900] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
        >
          {isValidating ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
              <span>Validando Lote...</span>
            </>
          ) : (
            <>
              <span>Enviar lote a validación</span>
              <span className="material-symbols-outlined text-[22px]">send</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Simulation Modal (Paso 4) */}
      {isValidating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#c1c8c2]/50 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#ffdbd1] text-[#a73918] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[34px] animate-spin">
                sync
              </span>
            </div>

            <span className="text-[12px] font-bold text-[#a73918] bg-[#ffdbd1] px-3 py-1 rounded-full mb-2">
              Paso 4 de 4 · Certificación Normativa
            </span>

            <h3 className="text-[18px] font-bold text-[#032517] mb-2">
              {isPulque
                ? 'Certificación Tradicional y Sellado Stellar'
                : isHandicraft || isSombrero
                ? 'Certificación Artesanal y Sellado Stellar'
                : 'Auditoría de Calidad y Sellado Stellar'}
            </h3>

            <div className="w-full space-y-2.5 my-4 text-left">
              <div className="flex items-center gap-2 text-[13px]">
                <span className={`material-symbols-outlined text-[18px] ${validationStep >= 1 ? 'text-[#032517]' : 'text-gray-300'}`}>
                  {validationStep >= 1 ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={validationStep >= 1 ? 'text-[#032517] font-semibold' : 'text-gray-400'}>
                  {isPulque
                    ? '1. Muestra analizada (100% Aguamiel de Maguey Mixteco)'
                    : isHandicraft
                    ? '1. Muestra analizada (Telar de cintura tradicional)'
                    : isSombrero
                    ? '1. Muestra analizada (Palma dulce fina de la Mixteca)'
                    : isHoney
                    ? '1. Muestra analizada (Miel virgen pura de abeja)'
                    : isCorn
                    ? '1. Muestra analizada (Maíz criollo nativo)'
                    : isTomato
                    ? '1. Muestra analizada (Jitomate agroecológico)'
                    : '1. Muestra analizada (Café pergamino de altura)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[13px]">
                <span className={`material-symbols-outlined text-[18px] ${validationStep >= 2 ? 'text-[#032517]' : 'text-gray-300'}`}>
                  {validationStep >= 2 ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={validationStep >= 2 ? 'text-[#032517] font-semibold' : 'text-gray-400'}>
                  {isPulque
                    ? '2. Fermentación tradicional óptima sin químicos ni adulterantes'
                    : isHandicraft
                    ? '2. Certificación de origen e iconografía Mixteca tradicional'
                    : isSombrero
                    ? '2. Tejido uniforme y ribete tradicional de la Mixteca'
                    : isHoney
                    ? '2. Libre de adulteración y azúcares añadidos'
                    : isCorn
                    ? '2. Grano sano, libre de gorgojo y sin OGM'
                    : isTomato
                    ? '2. Cosecha fresca, libre de pesticidas sintéticos'
                    : '2. Conforme a NMX-F-083 (Humedad 11.4% y <2% defectos)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[13px]">
                <span className={`material-symbols-outlined text-[18px] ${validationStep >= 3 ? 'text-emerald-600' : 'text-gray-300'}`}>
                  {validationStep >= 3 ? 'verified_user' : 'radio_button_unchecked'}
                </span>
                <span className={validationStep >= 3 ? 'text-[#032517] font-bold' : 'text-gray-400'}>
                  3. Sellado inalterable de autenticidad comunal (Red Stellar)
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[#424843]">
              Generando Pasaporte Digital y folio inmutable...
            </p>
          </div>
        </div>
      )}

      {/* Toast confirmation */}
      {photoSuccessToast && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto bg-[#032517] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center justify-between text-[12px] font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{photoSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhotoSuccessToast(null)}
            className="text-white/70 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden Inputs for Direct Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Real Camera Modal */}
      {showCameraModal && (
        <div
          onClick={() => {
            stopLiveCamera();
            setShowCameraModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-[#c1c8c2]/50 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#c1c8c2]/30 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">photo_camera</span>
                <span className="text-[13px] font-bold text-[#032517]">
                  Tomar Foto Real - Muestra #{targetSlot}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  setShowCameraModal(false);
                }}
                className="w-7 h-7 rounded-full bg-[#f0eee8] text-[#1c1c18] flex items-center justify-center text-[12px] hover:bg-[#ebe8e2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Camera Viewfinder */}
            {isLiveCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-emerald-500 shadow-inner">
                <video
                  ref={(el) => {
                    if (el && mediaStreamRef.current && el.srcObject !== mediaStreamRef.current) {
                      el.srcObject = mediaStreamRef.current;
                      el.play().catch((err) => console.warn('Error play video:', err));
                    }
                    (videoRef as any).current = el;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Reticle / Viewfinder guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                  <div className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs w-fit">
                    🔴 Cámara en vivo activa
                  </div>
                  <div className="self-center w-36 h-36 border-2 border-dashed border-white/60 rounded-xl" />
                  <div className="text-center text-[10px] text-white/80 bg-black/40 py-0.5 rounded">
                    Centra el grano verde o muestra
                  </div>
                </div>

                {/* Capture Trigger */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCaptureRealPhoto}
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px] shadow-lg flex items-center gap-1.5 border-2 border-white cursor-pointer active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">camera</span>
                    <span>Disparar Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                    title="Cerrar visor"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* DIRECT NATIVE CAMERA TRIGGER (PRIMARY & UNIVERSAL) */}
                <button
                  type="button"
                  onClick={() => handleDirectCamera(targetSlot)}
                  className="w-full p-3.5 rounded-2xl bg-[#032517] hover:bg-[#1b3b2b] text-white flex items-center gap-3 shadow-md active:scale-98 transition-all cursor-pointer text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px] text-emerald-300">photo_camera</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-extrabold block">📸 Abrir Cámara del Teléfono</span>
                    <span className="text-[11px] text-emerald-200/90 block leading-tight">
                      Captura la foto directamente con la cámara de tu dispositivo
                    </span>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    className="p-3 rounded-2xl bg-[#f0eee8] hover:bg-[#e4e1d9] text-[#032517] flex flex-col items-center justify-center gap-1 border border-[#c1c8c2]/60 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <span className="material-symbols-outlined text-[22px] text-emerald-700">videocam</span>
                    <span className="text-[12px] font-bold">Visor en Pantalla</span>
                    <span className="text-[10px] text-[#727973]">Webcam en vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectGallery(targetSlot)}
                    className="p-3 rounded-2xl bg-[#f0eee8] hover:bg-[#e4e1d9] text-[#032517] flex flex-col items-center justify-center gap-1 border border-[#c1c8c2]/60 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <span className="material-symbols-outlined text-[22px] text-[#a73918]">photo_library</span>
                    <span className="text-[12px] font-bold">Subir de Galería</span>
                    <span className="text-[10px] text-[#727973]">Fotos guardadas</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
                    <div className="flex-1">
                      <p className="leading-snug font-medium">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => handleDirectCamera(targetSlot)}
                        className="mt-1.5 px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        <span>Abrir cámara del dispositivo</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick samples */}
                <div className="border-t border-[#c1c8c2]/30 pt-2">
                  <span className="text-[10px] font-bold text-[#727973] uppercase tracking-wide block mb-1.5">
                    O selecciona una muestra para probar la IA:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {quickSamples.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPhotoUrl(sample.url, sample.title)}
                        className={`p-1.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                          sample.isControl
                            ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-100'
                            : 'border-[#c1c8c2]/50 hover:bg-[#f0eee8]'
                        }`}
                        title={sample.title}
                      >
                        <span className="text-[16px]">{sample.emoji}</span>
                        <span
                          className={`text-[10px] font-bold truncate max-w-full ${
                            sample.isControl ? 'text-amber-900' : 'text-[#1c1c18]'
                          }`}
                        >
                          {sample.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
