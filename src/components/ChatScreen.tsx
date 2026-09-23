import React, { useState, useRef, useEffect } from 'react';
import { useAudioRecordingSession } from '../hooks/useAudioRecordingSession';
import { ScreenView, BotCardData, BotCardType, DigitalPassportLot } from '../types';
import { BotCardView } from './BotCardView';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import { LiveRecorderSession } from '../utils/audioRecorder';

interface ChatScreenProps {
  onNavigateScreen: (screen: ScreenView, productType?: string) => void;
  targetProducer?: string | null;
  initialCustomMessage?: string | null;
  onOpenDictamenModal?: () => void;
  onOpenLotsModal?: () => void;
  onOpenPaymentsModal?: () => void;
  onOpenCartModal?: () => void;
  onOpenMapModal?: () => void;
  onOpenMicDiagnosticModal?: () => void;
  onAddToCart?: (item: any) => void;
  selectedLot?: DigitalPassportLot;
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  type?: 'text' | 'image' | 'voice';
  mediaUrl?: string;
  audioDuration?: string;
  transcription?: string;
  agentTag?: string;
  card?: BotCardData;
  options?: { id: number; title: string; subtitle: string; icon?: string; action?: string }[];
  isCheck?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigateScreen,
  targetProducer,
  initialCustomMessage,
  onOpenDictamenModal,
  onOpenLotsModal,
  onOpenPaymentsModal,
  onOpenCartModal,
  onOpenMapModal,
  onOpenMicDiagnosticModal,
  onAddToCart,
  selectedLot
}) => {
  const [activeChannel, setActiveChannel] = useState<'asistente' | 'registro' | 'soporte'>(
    targetProducer || initialCustomMessage ? 'soporte' : 'asistente'
  );

  const [inputMessage, setInputMessage] = useState<string>(
    initialCustomMessage ||
      (targetProducer ? `Hola ${targetProducer}, me interesa conocer más sobre su lote.` : '')
  );

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const { startRecording, audioLevel: audioVolume } = useAudioRecordingSession();
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [showCardPicker, setShowCardPicker] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState<boolean>(false);

  // Realistic Bot Typing simulation state
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [typingAgent, setTypingAgent] = useState<string>('🤖 Asistente Bot');
  const [speakingMsgText, setSpeakingMsgText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const chatAudioSessionRef = useRef<LiveRecorderSession | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Text-to-Speech function for elderly accessibility
  const handleSpeakBotMessage = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgText === text) {
      window.speechSynthesis.cancel();
      setSpeakingMsgText(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    utterance.rate = 0.92;
    utterance.onend = () => setSpeakingMsgText(null);
    utterance.onerror = () => setSpeakingMsgText(null);
    setSpeakingMsgText(text);
    window.speechSynthesis.speak(utterance);
  };

  // Stop TTS on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Messages for the Bot Orchestrator & Cards Flow
  const [assistantMessages, setAssistantMessages] = useState<MessageItem[]>([
    {
      id: 'ast-1',
      sender: 'bot',
      agentTag: '🤖 Orquestador Raíz',
      text: '¡Buenos días Don Aurelio! Soy el Asistente Bot Multiagente de Raíz. Todos los flujos de la plataforma están simulados de forma interactiva en este chat.\n\nPuedes escribirme libremente por texto, enviar fotos de tu cultivo, notas de voz o usar las tarjetas interactivas:',
      time: '09:40 a. m.'
    },
    {
      id: 'ast-2',
      sender: 'bot',
      agentTag: '⛓️ Agente Notario Stellar',
      text: 'Aquí tienes el estado del Dictamen Normativo verificado y anclado en la red Stellar Testnet con hash inmutable:',
      time: '09:41 a. m.',
      card: {
        type: 'dictamen_stellar',
        title: 'Dictamen Oficial Lote #884',
        data: {
          hash: '0x8f3c4e204a9e527a98bc19d44e510f2c814407ab198762f0592'
        }
      }
    },
    {
      id: 'ast-3',
      sender: 'bot',
      agentTag: '💰 Agente Tesorero',
      text: 'Y este es el saldo acumulado en contrato de custodia (Escrow) disponible para cobro en Tlaxiaco:',
      time: '09:41 a. m.',
      card: {
        type: 'billetera_pago'
      }
    }
  ]);

  // Messages for Onboarding Registration flow
  const [registrationMessages, setRegistrationMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: '¡Buenos días paisano! Le damos la bienvenida a Raíz. Para vincular sus cosechas y abrir su catálogo regional, contestaremos tres datos sencillos en este chat.',
      time: '09:40 a. m.'
    },
    {
      id: 'm2',
      sender: 'bot',
      text: '1. Escriba su Nombre Completo (como aparece en su credencial).',
      time: '09:40 a. m.'
    },
    {
      id: 'm3',
      sender: 'user',
      text: 'Aurelio López Bautista',
      time: '09:41 a. m.',
      isCheck: true
    },
    {
      id: 'm4',
      sender: 'bot',
      text: '2. ¿En qué municipio se encuentra su parcela o centro de trabajo?\nToque una opción de la lista:',
      time: '09:41 a. m.',
      options: [
        { id: 1, title: 'Tlaxiaco', subtitle: 'Heroica Ciudad de Tlaxiaco', icon: 'chevron_right' },
        { id: 2, title: 'Huajuapan de León', subtitle: 'Región Mixteca Baja / Centro', icon: 'chevron_right' },
        { id: 3, title: 'Nochixtlán', subtitle: 'Asunción Nochixtlán', icon: 'chevron_right' },
        { id: 4, title: 'Otro municipio mixteco', subtitle: 'Escribir nombre por teclado o nota de voz', icon: 'edit' }
      ]
    }
  ]);

  // Messages for Support / Direct Conversation
  const [supportMessages, setSupportMessages] = useState<MessageItem[]>([
    {
      id: 's1',
      sender: 'bot',
      text: targetProducer
        ? `Canal seguro con ${targetProducer}. Todas las comunicaciones cuentan con traducción opcional al Tu'un Savi (Mixteco) y registro de trazabilidad.`
        : '¡Bienvenido al canal de Asistencia Técnica Comunitaria del Tec de Tlaxiaco! ¿En qué podemos ayudarte hoy? (Control de plagas, humedad de café, secado solar, precios de acopio)',
      time: '10:45 a. m.'
    }
  ]);

  // Auto scroll to bottom on new messages or when typing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, registrationMessages, supportMessages, isBotTyping]);

  // Audio recording simulation timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const togglePlayAudio = (msgId: string, mediaUrl?: string) => {
    if (playingAudioId === msgId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setPlayingAudioId(null);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      setPlayingAudioId(msgId);

      if (mediaUrl) {
        const audio = new Audio(mediaUrl);
        audioElementRef.current = audio;
        audio.play().catch((e) => console.warn('No se pudo reproducir audio:', e));
        audio.onended = () => {
          setPlayingAudioId(null);
          audioElementRef.current = null;
        };
      } else {
        // Auto-stop audio simulation after 4 seconds
        setTimeout(() => {
          setPlayingAudioId(null);
        }, 4000);
      }
    }
  };

  // Ensure speech synthesis is stopped completely if anything was queued
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to dispatch simulated Bot responses with realistic typing delay
  const dispatchSimulatedBotReply = (
    agentName: string,
    replyText: string,
    cardData?: BotCardData,
    options?: { id: number; title: string; subtitle: string; icon?: string; action?: string }[],
    delayMs: number = 1000
  ) => {
    setIsBotTyping(true);
    setTypingAgent(agentName);

    setTimeout(() => {
      setIsBotTyping(false);
      const newId = `bot-reply-${Date.now()}`;
      const botMsg: MessageItem = {
        id: newId,
        sender: 'bot',
        agentTag: agentName,
        text: replyText,
        time: 'Ahora',
        card: cardData,
        options
      };
      if (activeChannel === 'asistente') {
        setAssistantMessages((prev) => [...prev, botMsg]);
      } else if (activeChannel === 'registro') {
        setRegistrationMessages((prev) => [...prev, botMsg]);
      } else {
        setSupportMessages((prev) => [...prev, botMsg]);
      }
    }, delayMs);
  };

  // Checks if spoken/typed text contains an actionable instruction for the platform
  const processPlatformInstruction = (text: string): boolean => {
    const clean = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // 1. Saldo / Pagos
    if (
      clean.includes('saldo') ||
      clean.includes('pago') ||
      clean.includes('billetera') ||
      clean.includes('cuanto tengo') ||
      clean.includes('retirar dinero') ||
      clean.includes('cobrar')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Abriendo Billetera y Saldo Comunitario ($38,250.00 MXN en custodia Soroban)...';
      dispatchSimulatedBotReply('💰 Agente Tesorero', reply, { type: 'billetera_pago' }, undefined, 300);
      if (onOpenPaymentsModal) setTimeout(() => onOpenPaymentsModal(), 650);
      return true;
    }

    // 2. Dictamen / Stellar
    if (
      clean.includes('dictamen') ||
      clean.includes('norma') ||
      clean.includes('stellar') ||
      clean.includes('blockchain') ||
      clean.includes('certificado') ||
      clean.includes('hash')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Abriendo el Dictamen Agroecológico con verificación SHA-256 en Stellar Testnet...';
      dispatchSimulatedBotReply(
        '⛓️ Agente Notario Stellar',
        reply,
        { type: 'dictamen_stellar' },
        undefined,
        300
      );
      if (onOpenDictamenModal) setTimeout(() => onOpenDictamenModal(), 650);
      return true;
    }

    // 3. Registrar Lote / Nueva Cosecha / Producto Específico
    // 3.1 PULQUE / AGUAMIEL / TINACAL / MAGUEY
    if (
      clean.includes('pulque') ||
      clean.includes('aguamiel') ||
      clean.includes('tinacal') ||
      clean.includes('maguey')
    ) {
      const reply =
        '¡Con mucho gusto, paisano! En Raíz apoyamos con orgullo a los tlachiqueros y familias productoras de Pulque Tradicional de la Mixteca Alta sin intermediarios ("coyotes").\n\nEl registro se realiza en 3 pasos sencillos y rápidos:\n\n1. 🏺 Indique los litros o garrafas preparadas en su tinacal.\n2. 📸 Tómale una foto a su muestra en jícara o garrafa para avalar con IA que es 100% aguamiel natural sin azúcar añadida.\n3. 💰 Su lote queda registrado a precio comunal justo para venta directa.\n\nToque abajo para registrar su pulque de inmediato:';
      dispatchSimulatedBotReply(
        '🏺 Agente Tradicional Comunitario',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '🏺 Registrar Lote de Pulque',
            subtitle: 'Litros, tinacal y foto con IA',
            icon: 'local_bar',
            action: 'registrar_pulque'
          },
          {
            id: 2,
            title: '🌾 Catálogo de Otros Productos',
            subtitle: 'Ver miel, maíz o artesanías',
            icon: 'inventory_2',
            action: 'registrar_lote'
          },
          {
            id: 3,
            title: '📸 Foto a Muestra de Pulque',
            subtitle: 'Evaluación de pureza con IA',
            icon: 'photo_camera',
            action: 'evaluar_foto'
          }
        ],
        400
      );
      return true;
    }

    // 3.2 MIEL DE ABEJA
    if (clean.includes('miel') || clean.includes('abeja') || clean.includes('colmena')) {
      const reply =
        '¡Con mucho gusto, paisano! En Raíz apoyamos a los apicultores de la Mixteca Alta para comercializar su Miel Pura de Abeja a precio justo sin intermediarios.\n\nToque abajo para registrar su lote de miel de inmediato:';
      dispatchSimulatedBotReply(
        '🍯 Agente Apícola Comunitario',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '🍯 Registrar Lote de Miel',
            subtitle: 'Frascos o cubetas y foto con IA',
            icon: 'inventory_2',
            action: 'registrar_miel'
          },
          {
            id: 2,
            title: '🌾 Ver Catálogo Completo',
            subtitle: 'Pulque, café, granos',
            icon: 'storefront',
            action: 'registrar_lote'
          },
          {
            id: 3,
            title: '📸 Evaluar Miel con Foto',
            subtitle: 'Pureza y densidad con IA',
            icon: 'photo_camera',
            action: 'evaluar_foto'
          }
        ],
        400
      );
      return true;
    }

    // 3.3 OTRO PRODUCTO / QUE NO SEA CAFÉ
    if (
      clean.includes('otro producto') ||
      clean.includes('otros productos') ||
      clean.includes('no sea cafe')
    ) {
      const reply =
        '¡Entendido, paisano! En Raíz apoyamos a todas las cosechas y creaciones de la Mixteca: Pulque tradicional, Miel de abeja, Maíz criollo, Jitomate, Sombreros de palma y Textiles artesanales.\n\nToque abajo para abrir el catálogo y registrar su producto:';
      dispatchSimulatedBotReply(
        '🌾 Agente Multiproducto Raíz',
        reply,
        { type: 'producto_vitrina' },
        [
          {
            id: 1,
            title: '🌾 Abrir Catálogo Rural',
            subtitle: 'Pulque, miel, maíz y más',
            icon: 'storefront',
            action: 'registrar_lote'
          },
          {
            id: 2,
            title: '🏺 Registrar Pulque',
            subtitle: 'Aguamiel de maguey mixteco',
            icon: 'local_bar',
            action: 'registrar_pulque'
          },
          {
            id: 3,
            title: '🍯 Registrar Miel',
            subtitle: 'Miel virgen de la región',
            icon: 'inventory_2',
            action: 'registrar_miel'
          }
        ],
        400
      );
      return true;
    }

    // 3.4 SOMBRERO DE PALMA
    if (clean.includes('sombrero') || clean.includes('palma') || clean.includes('tenate')) {
      const reply =
        '¡Con mucho gusto, artesano! En Raíz protegemos el trabajo de los tejedores de Palma de la Mixteca con regalías y precio justo sin intermediarios.\n\nToque abajo para registrar sus piezas de palma:';
      dispatchSimulatedBotReply(
        '👒 Agente Artesanal Comunitario',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '👒 Registrar Sombrero o Palma',
            subtitle: 'Piezas y foto con IA',
            icon: 'styler',
            action: 'registrar_sombrero'
          },
          {
            id: 2,
            title: '🌾 Ver Catálogo Completo',
            subtitle: 'Ver más productos comunitarios',
            icon: 'storefront',
            action: 'registrar_lote'
          }
        ],
        400
      );
      return true;
    }

    // 3.5 MAÍZ CRIOLLO O GRANOS
    if (clean.includes('maiz') || clean.includes('maíz') || clean.includes('frijol') || clean.includes('milpa')) {
      const reply =
        '¡Con mucho gusto, campesino! En Raíz apoyamos a los guardianes del Maíz Criollo y Frijol nativo de la Mixteca sin intermediarios.\n\nToque abajo para registrar su cosecha de granos:';
      dispatchSimulatedBotReply(
        '🌽 Agente de Granos Nativos',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '🌽 Registrar Maíz Criollo',
            subtitle: 'Kilos y foto con IA',
            icon: 'grain',
            action: 'registrar_maiz'
          },
          {
            id: 2,
            title: '🌾 Ver Catálogo Completo',
            subtitle: 'Ver más productos comunitarios',
            icon: 'storefront',
            action: 'registrar_lote'
          }
        ],
        400
      );
      return true;
    }

    // 3.6 TEXTIL ARTESANAL
    if (clean.includes('textil') || clean.includes('huipil') || clean.includes('telar') || clean.includes('rebozo')) {
      const reply =
        '¡Con mucho gusto, artesana! En Raíz protegemos los telares y bordados tradicionales de la Mixteca con regalías garantizadas y precio justo directo.\n\nToque abajo para registrar su pieza textil:';
      dispatchSimulatedBotReply(
        '🧵 Agente Textil y Regalías',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '🧵 Registrar Textil Artesanal',
            subtitle: 'Pieza, técnica y foto con IA',
            icon: 'styler',
            action: 'registrar_textil'
          },
          {
            id: 2,
            title: '🌾 Ver Catálogo Completo',
            subtitle: 'Ver más productos comunitarios',
            icon: 'storefront',
            action: 'registrar_lote'
          }
        ],
        400
      );
      return true;
    }

    // 3.7 Registro General / Café
    if (
      clean.includes('registrar') ||
      clean.includes('producto') ||
      clean.includes('cosecha') ||
      clean.includes('dar de alta') ||
      clean.includes('alta') ||
      clean.includes('vender mi') ||
      clean.includes('vender cafe') ||
      clean.includes('vender cosecha') ||
      clean.includes('subir mi') ||
      clean.includes('inscribir') ||
      clean.includes('nuevo lote') ||
      clean.includes('nueva cosecha') ||
      clean.includes('entregar cafe')
    ) {
      const reply =
        '¡Con mucho gusto, paisano! En Raíz registrar su cosecha o producto es muy fácil y rápido, sin papeleos ni intermediarios ("coyotes").\n\nPuede registrar Pulque tradicional, Café pergamino, Miel pura, Granos criollos o Artesanías.\n\nToque abajo para elegir el producto que desea registrar:';
      dispatchSimulatedBotReply(
        '🌾 Asistente de Registro Rural',
        reply,
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '🌾 Catálogo de Productos',
            subtitle: 'Pulque, café, miel, granos y artesanías',
            icon: 'inventory_2',
            action: 'registrar_lote'
          },
          {
            id: 2,
            title: '☕ Registrar Café Pergamino',
            subtitle: 'Indicar kilos y foto con IA',
            icon: 'add_box',
            action: 'registrar_cafe'
          },
          {
            id: 3,
            title: '🏺 Registrar Pulque / Aguamiel',
            subtitle: 'Bebida tradicional de maguey',
            icon: 'local_bar',
            action: 'registrar_pulque'
          }
        ],
        400
      );
      return true;
    }

    // 4. Ver mis Lotes
    if (
      clean.includes('mis lotes') ||
      clean.includes('ver lotes') ||
      clean.includes('mis cosechas') ||
      clean.includes('lotes registrados') ||
      clean.includes('sacos de cafe')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Desplegando el inventario de tus lotes registrados en la Mixteca...';
      dispatchSimulatedBotReply('☕ Agente Agrónomo IA', reply, { type: 'lote_registro' }, undefined, 300);
      if (onOpenLotsModal) setTimeout(() => onOpenLotsModal(), 650);
      return true;
    }

    // 5. Vitrina / Tienda
    if (
      clean.includes('vitrina') ||
      clean.includes('tienda') ||
      clean.includes('catalogo') ||
      clean.includes('ver productos') ||
      clean.includes('comprar cafe') ||
      clean.includes('comprar')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Llevándote a la Vitrina Comunitaria de Comercio Justo...';
      dispatchSimulatedBotReply(
        '🛍️ Agente Comercial',
        reply,
        { type: 'producto_vitrina' },
        undefined,
        300
      );
      setTimeout(() => onNavigateScreen('vitrina_productos'), 700);
      return true;
    }

    // 6. Mapa Regional
    if (
      clean.includes('mapa') ||
      clean.includes('comunidades') ||
      clean.includes('municipios') ||
      clean.includes('donde estan') ||
      clean.includes('geolocalizacion')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Abriendo el Mapa Regional de la Mixteca Alta y centros de acopio...';
      dispatchSimulatedBotReply(
        '🏷️ Agente de Trazabilidad',
        reply,
        { type: 'trazabilidad_pasaporte' },
        undefined,
        300
      );
      if (onOpenMapModal) setTimeout(() => onOpenMapModal(), 650);
      return true;
    }

    // 7. Carrito / Bolsa
    if (
      clean.includes('carrito') ||
      clean.includes('bolsa') ||
      clean.includes('mi pedido') ||
      clean.includes('ver compra')
    ) {
      const reply = '🎤 Instrucción de voz ejecutada: Abriendo tu bolsa de compras y pedidos directos...';
      dispatchSimulatedBotReply('🛍️ Agente Comercial', reply, undefined, undefined, 300);
      if (onOpenCartModal) setTimeout(() => onOpenCartModal(), 650);
      return true;
    }

    // 8. Diagnóstico de micrófono
    if (
      clean.includes('probar microfono') ||
      clean.includes('diagnostico') ||
      clean.includes('calibrar micro') ||
      clean.includes('prueba de audio')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Abriendo el Diagnóstico y Calibrador Físico de Micrófono...';
      dispatchSimulatedBotReply('🤖 Orquestador Raíz', reply, undefined, undefined, 300);
      if (onOpenMicDiagnosticModal) setTimeout(() => onOpenMicDiagnosticModal(), 650);
      return true;
    }

    // 9. Menú principal
    if (
      clean.includes('menu') ||
      clean.includes('pantalla principal') ||
      clean.includes('ir al inicio')
    ) {
      const reply = '🎤 Instrucción de voz ejecutada: Regresando a la pantalla de Menú Principal...';
      dispatchSimulatedBotReply('🤖 Orquestador Raíz', reply, undefined, undefined, 300);
      setTimeout(() => onNavigateScreen('menu_principal'), 700);
      return true;
    }

    // 10. Flete / Transportista
    if (
      clean.includes('flete') ||
      clean.includes('transporte') ||
      clean.includes('coyote') ||
      clean.includes('camioneta')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Consultando el estado del flete transportista y cajero móvil en parcela...';
      dispatchSimulatedBotReply(
        '🚚 Agente Logístico',
        reply,
        { type: 'logistica_coyote' },
        undefined,
        300
      );
      return true;
    }

    // 11. Regalías / Artesanías
    if (
      clean.includes('regalia') ||
      clean.includes('artesana') ||
      clean.includes('huipil') ||
      clean.includes('reventa')
    ) {
      const reply =
        '🎤 Instrucción de voz ejecutada: Consultando contrato Soroban del 10% de regalías para creadoras...';
      dispatchSimulatedBotReply(
        '💎 Agente de Regalías',
        reply,
        { type: 'regalias_mercado' },
        undefined,
        300
      );
      return true;
    }

    return false;
  };

  // Camera stream controls
  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopLiveCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a cámara.');
      }
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setIsLiveCameraActive(true);
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('No se pudo acceder a la cámara web:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Permiso denegado. Puedes habilitar la cámara en el candado del navegador o subir una foto desde tu galería.'
          : 'No se pudo iniciar la cámara web. Puedes subir una foto de tu archivo o usar las muestras de campo.'
      );
      setIsLiveCameraActive(false);
    }
  };

  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  // Function to call Gemini Multimodal Vision API for real photo analysis
  const analyzePhotoWithAI = async (photoBase64: string, sourceLabel: string) => {
    setIsBotTyping(true);
    setTypingAgent('🌿 Agente Agrónomo IA (Analizando imagen...)');

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoBase64,
          mimeType: 'image/jpeg',
          prompt: `Analiza esta fotografía tomada desde la aplicación ("${sourceLabel}"). Evalúa la calidad del grano de café o muestra agrícola, nivel de maduración, humedad visual o sanidad agronómica y emite tu recomendación técnica para el productor de la Mixteca de Tlaxiaco.`
        })
      });

      const data = await res.json();
      setIsBotTyping(false);

      const botMsg: MessageItem = {
        id: `bot-vision-${Date.now()}`,
        sender: 'bot',
        agentTag: data.agent || '🌿 Agente Agrónomo IA (Visión Gemini)',
        text: data.analysis || 'Muestra de campo analizada con éxito.',
        time: 'Ahora',
        card: { type: (data.cardType as BotCardType) || 'dictamen_stellar' }
      };
      setAssistantMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Fallo al llamar /api/analyze-image, usando dictamen de respaldo:', err);
      setIsBotTyping(false);
      const fallbackMsg: MessageItem = {
        id: `bot-vision-fallback-${Date.now()}`,
        sender: 'bot',
        agentTag: '🌿 Agente Agrónomo IA',
        text: '📸 Muestra de campo recibida con éxito:\n\n• Parámetros físicos: Coloración uniforme y consistencia apta para acopio en el Tec.\n• Estado fitosanitario: 0% broca aparente, humedad estimada en rango de 11.4%.\n• Dictamen: Aprobado para emisión de Pasaporte Digital en Stellar.',
        time: 'Ahora',
        card: { type: 'dictamen_stellar' }
      };
      setAssistantMessages((prev) => [...prev, fallbackMsg]);
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

        // Stop stream & close modal
        stopLiveCamera();
        setShowCameraModal(false);

        // Add user photo
        const userPhotoMsg: MessageItem = {
          id: `usr-live-img-${Date.now()}`,
          sender: 'user',
          text: 'Fotografía capturada con la cámara del dispositivo',
          type: 'image',
          mediaUrl: photoDataUrl,
          time: 'Ahora',
          isCheck: true,
        };
        setAssistantMessages((prev) => [...prev, userPhotoMsg]);

        // Call real Gemini Multimodal Vision endpoint
        analyzePhotoWithAI(photoDataUrl, 'Cámara en vivo');
      }
    } catch (e) {
      console.error('Error al capturar foto:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const photoUrl = uploadEvent.target?.result as string;
      stopLiveCamera();
      setShowCameraModal(false);

      const userPhotoMsg: MessageItem = {
        id: `usr-uploaded-img-${Date.now()}`,
        sender: 'user',
        text: `Muestra subida: ${file.name}`,
        type: 'image',
        mediaUrl: photoUrl,
        time: 'Ahora',
        isCheck: true,
      };
      setAssistantMessages((prev) => [...prev, userPhotoMsg]);

      // Call real Gemini Multimodal Vision endpoint
      analyzePhotoWithAI(photoUrl, file.name);
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = '';
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // SIMULATED FLOW: Photo Upload & AI Agronomist Analysis
  const handleSimulatePhotoUpload = (photoType: 'cereza' | 'pergamino' | 'roya' | 'miel' | 'pulque') => {
    setShowCameraModal(false);

    let photoUrl = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80';
    let photoTitle = 'Muestra de cerezas de café (Parcela El Mirador)';
    let analysisAgent = '🌿 Agente Agrónomo IA';
    let analysisText = '';
    let cardType: BotCardType = 'dictamen_stellar';

    if (photoType === 'cereza') {
      photoUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
      photoTitle = 'Foto de cerezas maduras cosechadas en San Mateo Peñasco';
      analysisText =
        '🌿 Análisis de Calidad Espectral IA completado:\n\n• Variedad identificada: Arábica Typica Pluma\n• Índice de maduración: 94.2% (Grado óptimo para especialidad)\n• Defectos visuales: 0% broca, sin picaduras de insecto\n• Recomendación técnica: Proceder al despulpado y fermentación anaeróbica controlada antes de las 18:00 hrs.\n\nHe generado el pre-dictamen normativo listo para sellar en Stellar:';
      cardType = 'dictamen_stellar';
    } else if (photoType === 'pergamino') {
      photoUrl = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80';
      photoTitle = 'Foto de café pergamino lavado en camas de secado solar';
      analysisText =
        '☀️ Análisis de Secado y Humedad IA:\n\n• Humedad estimada por reflectancia: 11.4% (Rango ideal Norma Mexicana 10%-12%)\n• Color de pergamino: Uniforme, blanco hueso limpio\n• Olor / Fermento: Limpio, libre de moho\n• Conclusión: Lote listo para embolsar en sacos GrainPro y entregar al Centro de Acopio Tlaxiaco.';
      cardType = 'lote_registro';
    } else if (photoType === 'pulque') {
      photoUrl = 'https://images.unsplash.com/photo-1546853020-ca4909aef454?w=600&auto=format&fit=crop&q=80';
      photoTitle = 'Muestra de Pulque Tradicional de Maguey en Tinacal Comunitario';
      analysisAgent = '🏺 Agente Comunitario de Pulque y Tradición';
      analysisText =
        '🏺 Diagnóstico Tradicional y Físico IA:\n\n• Producto identificado: Pulque Blanco 100% natural de maguey mixteco (Agave salmiana).\n• Fermentación en tinacal: Grado óptimo, consistencia lechosa natural, libre de azúcar o adulterantes.\n• Aprobación comunal: Calidad avalada para venta directa sin intermediarios a $45/litro.\n• Pasaporte Digital: Generado y listo para registro de lote:';
      cardType = 'lote_registro';
    } else if (photoType === 'miel') {
      photoUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg';
      photoTitle = 'Muestra de Miel Pura de Abeja de la Mixteca';
      analysisAgent = '🍯 Agente Apícola y Agroecológico Tec';
      analysisText =
        '🍯 Verificación de Producto IA completada:\n\n• ¡Atención paisano! Esta fotografía NO corresponde a café; se identifica con 99% de certeza como Miel de Abeja 100% pura en frasco.\n• Pureza y densidad: Excelente consistencia ámbar, sin adulteración ni separación de fases.\n• Humedad estimada: 18.2% (Cumple Norma Oficial Mexicana de Miel NMX-F-036).\n• Recomendación: Para café, sube una foto de grano pergamino o cereza. Para comercializar esta miel con precio justo comunal, la vinculamos a la Vitrina Apícola:';
      cardType = 'producto_vitrina';
    } else {
      photoUrl = 'https://images.unsplash.com/photo-1524350876685-274059332603?w=600&auto=format&fit=crop&q=80';
      photoTitle = 'Muestra foliar para diagnóstico fitosanitario';
      analysisText =
        '🔬 Diagnóstico Fitosanitario de Hojas:\n\n• Detección de Roya del cafeto (Hemileia vastatrix): Grado 0 (Sano / Negativo)\n• Signos de minador: Negativo\n• Recomendación de nutrición: Aplicar biofertilizante foliar a base de biol de ceniza y melaza para reforzar floración.';
      cardType = 'trazabilidad_pasaporte';
    }

    // 1. Add User Photo message
    const userPhotoMsg: MessageItem = {
      id: `usr-img-${Date.now()}`,
      sender: 'user',
      text: photoTitle,
      type: 'image',
      mediaUrl: photoUrl,
      time: 'Ahora',
      isCheck: true
    };
    setAssistantMessages((prev) => [...prev, userPhotoMsg]);

    // 2. Dispatch Bot Analysis with Card
    dispatchSimulatedBotReply(analysisAgent, analysisText, { type: cardType }, undefined, 1400);
  };

  // Real Audio Recording with Web Speech API and Gemini Transcription
  const startVoiceRecording = async () => {
    try {
      const session = await startRecording({
        onStopped: (reason) => {
          if (reason === 'limit' || reason === 'hidden' || reason === 'ended' || reason === 'error') void stopVoiceRecording();
        },
        onInterimTranscript: (text) => setLiveVoiceTranscript(text),
        lang: 'es-MX',
      });
      setMicError(null);
      setLiveVoiceTranscript('');
      chatAudioSessionRef.current = session;
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Micrófono denegado o no disponible:', err);
      setIsRecording(false);
      setMicError(
        'El navegador no pudo acceder al micrófono. Por favor verifica que tenga permisos habilitados o escribe tu consulta abajo.'
      );
    }
  };

  const stopVoiceRecording = async () => {
    if (!chatAudioSessionRef.current) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);

    try {
      const session = chatAudioSessionRef.current;
      chatAudioSessionRef.current = null;
      const result = await session.stop();

      const durationSec = result.durationSeconds || Math.max(1, recordingSeconds);
      const formattedDuration = `0:${durationSec < 10 ? '0' : ''}${durationSec}`;
      const spokenText =
        (result.transcript || liveVoiceTranscript || '').trim() ||
        'Consulta de campo y registro de cosecha en la Mixteca.';

      // Add user audio message with real recorded audio URL and real transcription
      const userAudioMsg: MessageItem = {
        id: `usr-audio-${Date.now()}`,
        sender: 'user',
        text: spokenText,
        type: 'voice',
        mediaUrl: result.audioUrl,
        audioDuration: formattedDuration,
        transcription: `🎙️ Audio en vivo capturado:\n"${spokenText}"`,
        time: 'Ahora',
        isCheck: true,
      };

      setAssistantMessages((prev) => [...prev, userAudioMsg]);

      // 1. Check if the voice note is a direct instruction for the platform
      if (processPlatformInstruction(spokenText)) {
        return;
      }

      // 2. Otherwise, analyze the voice query with Gemini AI!
      setIsBotTyping(true);
      setTypingAgent('🤖 Asistente Raíz (Analizando voz...)');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: spokenText,
            history: assistantMessages.slice(-6).map((m) => ({
              sender: m.sender,
              text: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsBotTyping(false);
          const newBotId = `bot-reply-${Date.now()}`;
          const botMsg: MessageItem = {
            id: newBotId,
            sender: 'bot',
            agentTag: data.agent || '🤖 Asistente Raíz',
            text: data.reply || `Entendido: "${spokenText}". Tu mensaje fue procesado correctamente.`,
            time: 'Ahora',
            card: data.cardType ? { type: data.cardType } : undefined,
          };
          setAssistantMessages((prev) => [...prev, botMsg]);
          return;
        }
      } catch (chatErr) {
        console.warn('Fallo chat tras voz:', chatErr);
      }

      // Intelligent fallback if Gemini response fails
      setIsBotTyping(false);
      dispatchSimulatedBotReply(
        '☕ Asistente Raíz',
        `Recibí tu nota de voz: "${spokenText}". Los técnicos de acopio y trazabilidad comunitaria en Tlaxiaco han registrado tu consulta.`,
        undefined,
        undefined,
        700
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Error al finalizar grabación:', e);
      setIsRecording(false);
    }
  };

  const cancelVoiceRecording = () => {
    if (chatAudioSessionRef.current) {
      chatAudioSessionRef.current.cancel();
      chatAudioSessionRef.current = null;
    }
    setIsRecording(false);
    setLiveVoiceTranscript('');
  };

  // Sample Mixteco voice note helper
  const handleInsertSampleMixtecoAudio = () => {
    const userAudioMsg: MessageItem = {
      id: `usr-audio-${Date.now()}`,
      sender: 'user',
      text: 'Nota de voz en Tu\'un Savi (Mixteco)',
      type: 'voice',
      audioDuration: '0:12',
      transcription:
        '🎙️ Tu\'un Savi (Mixteco) / Español:\n"Kusii inii kuan, ya\'a kui bulto kafe pergamino. ¿A que hora acopio Tlaxiaco?"\n(Buenos días, aquí están los bultos de café pergamino seco. ¿A qué hora reciben en el acopio de Tlaxiaco?)',
      time: 'Ahora',
      isCheck: true,
    };

    setAssistantMessages((prev) => [...prev, userAudioMsg]);

    dispatchSimulatedBotReply(
      '🚚 Agente de Logística y Acopio',
      '¡Saludos paisano! El Centro de Acopio Comunitario del Tec en Tlaxiaco recibe de lunes a sábado de 08:00 a 16:00 hrs.\n\nContamos con pesaje certificado, prueba de humedad en 2 minutos y liquidación directa en billetera Stellar:',
      { type: 'lote_registro' },
      undefined,
      1000
    );
  };

  // SIMULATED FLOW: Card Invocation by Button or Keyword
  const invokeBotCard = (type: BotCardType, customPrompt?: string) => {
    setShowCardPicker(false);

    // User triggers the card invocation
    const userMsg: MessageItem = {
      id: `usr-invoke-${Date.now()}`,
      sender: 'user',
      text: customPrompt || `Consultar módulo: ${type.replace('_', ' ')}`,
      time: 'Ahora',
      isCheck: true
    };

    setAssistantMessages((prev) => [...prev, userMsg]);

    let agentTag = '🤖 Orquestador Bot';
    let botText = '';

    if (type === 'dictamen_stellar') {
      agentTag = '⛓️ Agente Notario Stellar';
      botText =
        'He verificado en vivo la firma en Stellar Testnet Ledger #52,491,802. El dictamen cumple al 100% con la Norma Agroecológica Regional:';
    } else if (type === 'billetera_pago') {
      agentTag = '💰 Agente Tesorero';
      botText =
        'Billetera Comunitaria sincronizada con contrato inteligente Soroban. Tienes saldo disponible por liquidación de café:';
    } else if (type === 'lote_registro') {
      agentTag = '☕ Agente Agrónomo';
      botText =
        'Aquí está la ficha de control de cosecha. Puedes registrar un nuevo lote o revisar los sacos entregados:';
    } else if (type === 'producto_vitrina') {
      agentTag = '🛍️ Agente Comercial';
      botText =
        'Tarjeta de la Vitrina Mixteca con protección de pago en custodia (Escrow) para compradores directos:';
    } else if (type === 'trazabilidad_pasaporte') {
      agentTag = '🏷️ Agente de Trazabilidad';
      botText =
        'Pasaporte Digital con trazabilidad completa de origen desde San Mateo Peñasco hasta el punto de venta:';
    } else if (type === 'logistica_coyote') {
      agentTag = '🚚 Agente Logístico';
      botText =
        'Red de logística comunitaria y transporte: El transportista local cuenta con contrato de flete garantizado y actúa como cajero móvil en parcela:';
    } else if (type === 'regalias_mercado') {
      agentTag = '💎 Agente de Regalías';
      botText =
        'Mecanismo de protección y regalías on-chain: 10% de cada reventa en galerías o el extranjero se liquida directamente a la artesana:';
    } else {
      agentTag = '🤖 Orquestador Multiagente';
      botText =
        'Panel de control de los 4 agentes en línea que asisten a productores y compradores:';
    }

    dispatchSimulatedBotReply(agentTag, botText, { type }, undefined, 900);
  };

  // Conversational response logic for user typing with Real Gemini AI + Domain Guardrail
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || inputMessage).trim();
    if (!text) return;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Ahora',
      isCheck: true
    };

    setInputMessage('');

    // Append user message to active channel
    if (activeChannel === 'asistente') {
      if (processPlatformInstruction(text)) {
        setAssistantMessages((prev) => [...prev, userMsg]);
        return;
      }
      setAssistantMessages((prev) => [...prev, userMsg]);
    } else if (activeChannel === 'registro') {
      setRegistrationMessages((prev) => [...prev, userMsg]);
    } else {
      setSupportMessages((prev) => [...prev, userMsg]);
    }

    const defaultAgentLabel =
      activeChannel === 'soporte'
        ? (targetProducer ? `💬 ${targetProducer}` : '💬 Asesoría Técnica Comunitaria')
        : activeChannel === 'registro'
        ? '📝 Padrón Comunitario'
        : '🤖 Asistente Comunitario Raíz';

    setIsBotTyping(true);
    setTypingAgent(defaultAgentLabel);

    const activeHistory =
      activeChannel === 'asistente'
        ? assistantMessages
        : activeChannel === 'registro'
        ? registrationMessages
        : supportMessages;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: activeHistory.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsBotTyping(false);

        const newBotId = `bot-${Date.now()}`;
        const botMsg: MessageItem = {
          id: newBotId,
          sender: 'bot',
          agentTag: data.agent || defaultAgentLabel,
          text: data.reply || 'Consulta atendida por el sistema Raíz.',
          time: 'Ahora',
          card: data.cardType ? { type: data.cardType as BotCardType } : undefined,
          options: data.options || undefined
        };

        if (activeChannel === 'asistente') {
          setAssistantMessages((prev) => [...prev, botMsg]);
        } else if (activeChannel === 'registro') {
          setRegistrationMessages((prev) => [...prev, botMsg]);
        } else {
          setSupportMessages((prev) => [...prev, botMsg]);
        }
        return;
      }
    } catch (err) {
      console.warn('Fallo en /api/chat, recurriendo a agente agroecológico local:', err);
    }

    // Fallback local domain simulation if API is offline or encountered network error
    const lower = text.toLowerCase();

    // Check out-of-domain filter locally
    const isOutOfDomain =
      lower.includes('futbol') ||
      lower.includes('fútbol') ||
      lower.includes('chiste') ||
      lower.includes('pelicula') ||
      lower.includes('película') ||
      lower.includes('videojuego') ||
      lower.includes('politica') ||
      lower.includes('política');

    if (isOutOfDomain) {
      dispatchSimulatedBotReply(
        defaultAgentLabel,
        'Disculpe paisano, como asistente oficial de Raíz en la Mixteca, únicamente puedo orientarle sobre temas de la plataforma: registro de cosechas, evaluación con foto, trazabilidad en Stellar, pagos comunitarios y asesoría técnica para la región. ¿En qué podemos apoyarle respecto a su café o producción agrícola?',
        undefined,
        [
          { id: 1, title: '📸 Evaluar Cosecha con Foto', subtitle: 'Revisar café o muestra', icon: 'photo_camera', action: 'evaluar_foto' },
          { id: 2, title: '💰 Ver Mis Pagos y Saldo', subtitle: 'Consultar $38,250 MXN', icon: 'payments', action: 'ver_pagos' }
        ],
        700
      );
    } else if (
      lower.includes('registrar') ||
      lower.includes('producto') ||
      lower.includes('cosecha') ||
      lower.includes('lote') ||
      lower.includes('dar de alta') ||
      lower.includes('alta') ||
      lower.includes('vender mi') ||
      lower.includes('vender cafe') ||
      lower.includes('vender') ||
      lower.includes('subir mi') ||
      lower.includes('inscribir')
    ) {
      dispatchSimulatedBotReply(
        '☕ Agente Agrónomo IA',
        '¡Con mucho gusto, paisano! En Raíz registrar su cosecha o producto es muy fácil y rápido, sin papeleos ni intermediarios ("coyotes").\n\nPara que reciba su pago directo a precio justo, el proceso tiene 3 pasos sencillos:\n\n1. 🌾 Seleccione qué producto tiene listo (Café pergamino, Miel, Granos o Artesanías).\n2. ⚖️ Indique cuántos kilos o bultos tiene preparados.\n3. 📸 Tómale una foto a la muestra para avalar calidad y humedad con IA en 3 segundos.\n\nToque abajo la opción que desea para comenzar de inmediato:',
        { type: 'lote_registro' },
        [
          {
            id: 1,
            title: '☕ Registrar Café Pergamino',
            subtitle: 'Indicar kilos, humedad y foto con IA',
            icon: 'add_box',
            action: 'registrar_cafe'
          },
          {
            id: 2,
            title: '🍯 Registrar Miel u Otro Producto',
            subtitle: 'Catálogo de cosechas comunitarias',
            icon: 'inventory_2',
            action: 'registrar_lote'
          },
          {
            id: 3,
            title: '📸 Tomar Foto a la Muestra',
            subtitle: 'Evaluación rápida con cámara',
            icon: 'photo_camera',
            action: 'evaluar_foto'
          }
        ],
        500
      );
    } else if (
      lower.includes('que mas') ||
      lower.includes('pued ehacer') ||
      lower.includes('puede hacer') ||
      lower.includes('que hace') ||
      lower.includes('para que sirve') ||
      lower.includes('para que sirbe') ||
      lower.includes('como funciona') ||
      lower.includes('ayuda')
    ) {
      dispatchSimulatedBotReply(
        '🤖 Asistente Comunitario Raíz',
        '¡Con mucho gusto, paisano! La plataforma Raíz fue creada junto al Tec de Tlaxiaco para que las familias del campo reciban un pago justo por su cosecha y no dependan de intermediarios ("coyotes").\n\nAquí puede realizar 4 cosas muy sencillas con un solo toque:\n\n1. 📸 Evaluar su cosecha con foto: Le toma foto a sus granos de café o producto y la IA revisa la humedad y calidad en 3 segundos sin costo.\n2. 💰 Ver y retirar su dinero: El pago de sus cosechas se guarda seguro en su billetera comunitaria ($85/kg o más) y puede cobrarlo en efectivo en Tlaxiaco.\n3. 🏷️ Pasaporte y Sello Oficial: Su lote recibe certificación con sello digital para venderlo a cafeterías a precio alto.\n4. 🚚 Flete y transporte en parcela: Las camionetas de la región recogen los sacos en su comunidad con tarifa fija acordada.',
        undefined,
        [
          { id: 1, title: '📦 Registrar Cosecha o Producto', subtitle: 'Café, miel o artesanías', icon: 'add_box', action: 'registrar_cafe' },
          { id: 2, title: '📸 Evaluar Cosecha con Foto', subtitle: 'Revisar café o muestra al instante', icon: 'photo_camera', action: 'evaluar_foto' },
          { id: 3, title: '💰 Ver Mis Pagos y Saldo', subtitle: 'Consultar dinero disponible', icon: 'payments', action: 'ver_pagos' }
        ],
        600
      );
    } else if (
      lower.includes('evalua') ||
      lower.includes('calidad') ||
      lower.includes('humedad') ||
      lower.includes('foto') ||
      lower.includes('camara') ||
      lower.includes('cámara') ||
      lower.includes('muestra') ||
      lower.includes('grano')
    ) {
      dispatchSimulatedBotReply(
        '🌿 Agente Agrónomo IA',
        'Para evaluar su café o cosecha sin ninguna complicación:\n\n• Toque el botón de abajo "📸 Abrir Cámara y Evaluar".\n• Apunte la cámara a un puñado de granos o a su producto sobre una superficie con buena luz.\n• La inteligencia artificial del TecNM Tlaxiaco detectará la humedad estimada (10%-12%), revisará si hay broca y emitirá su Dictamen Comunitario al momento.',
        { type: 'dictamen_stellar' },
        [
          { id: 1, title: '📸 Abrir Cámara y Evaluar', subtitle: 'Tomar foto de muestra de campo', icon: 'photo_camera', action: 'evaluar_foto' },
          { id: 2, title: '📜 Consultar Dictamen Oficial', subtitle: 'Ver parámetros de la norma', icon: 'verified', action: 'ver_dictamen' }
        ],
        800
      );
    } else if (
      lower.includes('saldo') ||
      lower.includes('pago') ||
      lower.includes('retiro') ||
      lower.includes('dinero') ||
      lower.includes('billetera') ||
      lower.includes('cobro') ||
      lower.includes('cuanto') ||
      lower.includes('cuánto') ||
      lower.includes('usdc')
    ) {
      dispatchSimulatedBotReply(
        '💰 Agente Tesorero',
        'Tu saldo acumulado por 450 kg de café pergamino lavado es de $38,250.00 MXN en contrato de custodia (Escrow):\n\nPuedes solicitar el retiro en efectivo en Tlaxiaco o directamente en parcela con el transportista aliado:',
        { type: 'billetera_pago' },
        [
          { id: 1, title: '💰 Ver Mi Billetera', subtitle: 'Consultar saldo y retiros', icon: 'payments', action: 'ver_pagos' },
          { id: 2, title: '🚚 Pago en Parcela', subtitle: 'Cajero móvil con transportista', icon: 'local_shipping', action: 'logistica_coyote' }
        ],
        800
      );
    } else if (
      lower.includes('coyote') ||
      lower.includes('flete') ||
      lower.includes('transporte') ||
      lower.includes('camioneta') ||
      lower.includes('logistica') ||
      lower.includes('logística') ||
      lower.includes('envio') ||
      lower.includes('envío')
    ) {
      dispatchSimulatedBotReply(
        '🚚 Agente Logístico Comunitario',
        'En Raíz, el transportista local se integra formalmente como Agente Logístico Comunitario y Cajero Móvil en su parcela.\n\n• Flete garantizado con tarifa fija de $2.00 por kilogramo.\n• El chofer puede entregarle su pago en efectivo al subir los sacos a la camioneta escaneando su código QR.',
        { type: 'logistica_coyote' },
        [
          { id: 1, title: '🚚 Ver Red de Transporte', subtitle: 'Rutas Tlaxiaco - Huajuapan', icon: 'local_shipping', action: 'logistica_coyote' }
        ],
        800
      );
    } else if (
      lower.includes('stellar') ||
      lower.includes('blockchain') ||
      lower.includes('dictamen') ||
      lower.includes('norma') ||
      lower.includes('hash') ||
      lower.includes('certificado')
    ) {
      dispatchSimulatedBotReply(
        '⛓️ Agente Notario Stellar',
        'Consultando la red Stellar Testnet...\n\n✅ Hash verificado en bloque #52,491,802. Datos de humedad (11.4%) y cero broca sellados sin intermediarios:',
        { type: 'dictamen_stellar' },
        [
          { id: 1, title: '📜 Ver Dictamen Oficial', subtitle: 'Certificado del TecNM', icon: 'verified', action: 'ver_dictamen' }
        ],
        800
      );
    } else if (
      lower.includes('lote') ||
      lower.includes('cafe') ||
      lower.includes('café') ||
      lower.includes('cosecha') ||
      lower.includes('registro') ||
      lower.includes('kilos') ||
      lower.includes('bultos')
    ) {
      dispatchSimulatedBotReply(
        '☕ Agente Agrónomo IA',
        'Aquí tienes el resumen de tu cosecha registrada en San Mateo Peñasco con folio oficial #884:',
        { type: 'lote_registro' },
        [
          { id: 1, title: '📦 Registrar Nueva Cosecha', subtitle: 'Paso a paso guiado', icon: 'add_box', action: 'registrar_lote' },
          { id: 2, title: '📸 Evaluar Muestra', subtitle: 'Tomar foto con IA', icon: 'photo_camera', action: 'evaluar_foto' }
        ],
        800
      );
    } else if (
      lower.includes('plaga') ||
      lower.includes('roya') ||
      lower.includes('broca') ||
      lower.includes('secado') ||
      lower.includes('enfermedad')
    ) {
      dispatchSimulatedBotReply(
        '🌿 Agente Agrónomo IA',
        'Recomendaciones agroecológicas del TecNM Tlaxiaco para la Mixteca Alta:\n\n• Roya del cafeto: Aplicar caldo bordelés o biofertilizante enriquecido con microorganismos de montaña nativos.\n• Broca: Recolectar a tiempo todos los granos maduros y caídos ("pepena") para cortar el ciclo de reproducción.\n• Secado: Usar zarandas o camas africanas elevadas del suelo para mantener humedad entre 10% y 12%.',
        { type: 'dictamen_stellar' },
        [
          { id: 1, title: '📸 Evaluar con Foto', subtitle: 'Revisar si hay broca en muestra', icon: 'photo_camera', action: 'evaluar_foto' }
        ],
        800
      );
    } else if (
      lower.includes('hola') ||
      lower.includes('buenos') ||
      lower.includes('buenas') ||
      lower.includes('saludos')
    ) {
      dispatchSimulatedBotReply(
        '🤖 Asistente Comunitario Raíz',
        '¡Hola paisano! Un gusto saludarle. Soy el asistente comunitario de Raíz en Tlaxiaco. ¿Qué desea realizar hoy?',
        undefined,
        [
          { id: 1, title: '📸 Evaluar Cosecha con Foto', subtitle: 'Revisar muestra con IA', icon: 'photo_camera', action: 'evaluar_foto' },
          { id: 2, title: '💰 Ver Mis Pagos y Saldo', subtitle: 'Billetera con $38,250 MXN', icon: 'payments', action: 'ver_pagos' },
          { id: 3, title: '❓ ¿Qué más puede hacer esta app?', subtitle: 'Explicación sencilla', icon: 'help', action: 'consulta' }
        ],
        700
      );
    } else if (lower.includes('tlaxiaco') || lower.includes('tec') || lower.includes('donde') || lower.includes('dónde')) {
      dispatchSimulatedBotReply(
        '🏛️ Tecnológico de Tlaxiaco',
        'El Centro de Innovación y Acopio Comunitario se ubica en las instalaciones del Instituto Tecnológico de Tlaxiaco, Oaxaca. Apoyamos a productores de la Mixteca Alta con laboratorio de análisis físico-sensorial, pesaje certificado y tecnología blockchain sin costo.',
        undefined,
        [
          { id: 1, title: '📸 Evaluar Muestra', subtitle: 'Prueba de laboratorio IA', icon: 'photo_camera', action: 'evaluar_foto' }
        ],
        800
      );
    } else {
      dispatchSimulatedBotReply(
        defaultAgentLabel,
        `Entendido, paisano. Estoy a su servicio para apoyarle con cosechas, evaluación con foto, pagos y dudas del campo. ¿Desea realizar alguna de estas acciones directas?`,
        undefined,
        [
          { id: 1, title: '📸 Evaluar Cosecha con Foto', subtitle: 'Revisar muestra con IA', icon: 'photo_camera', action: 'evaluar_foto' },
          { id: 2, title: '💰 Ver Mis Pagos y Saldo', subtitle: 'Consultar $38,250 MXN', icon: 'payments', action: 'ver_pagos' },
          { id: 3, title: '❓ ¿Qué más hace esta app?', subtitle: 'Explicación en 4 pasos', icon: 'help', action: 'consulta' }
        ],
        800
      );
    }
  };

  const handleSelectOption = (optionTitle: string, action?: string) => {
    // 1. Direct system actions
    if (
      action === 'evaluar_foto' ||
      optionTitle.toLowerCase().includes('evaluar') ||
      optionTitle.toLowerCase().includes('cámara') ||
      optionTitle.toLowerCase().includes('camara')
    ) {
      setShowCameraModal(true);
      return;
    }
    if (
      action === 'ver_pagos' ||
      optionTitle.toLowerCase().includes('pagos') ||
      optionTitle.toLowerCase().includes('saldo') ||
      optionTitle.toLowerCase().includes('billetera')
    ) {
      onOpenPaymentsModal?.();
      return;
    }
    if (action === 'ver_dictamen' || optionTitle.toLowerCase().includes('dictamen')) {
      onOpenDictamenModal?.();
      return;
    }
    if (
      action === 'registrar_pulque' ||
      optionTitle.toLowerCase().includes('pulque') ||
      optionTitle.toLowerCase().includes('aguamiel')
    ) {
      onNavigateScreen?.('registrar_lote_cafe', 'Pulque');
      return;
    }
    if (
      action === 'registrar_miel' ||
      (optionTitle.toLowerCase().includes('miel') && !optionTitle.toLowerCase().includes('catálogo'))
    ) {
      onNavigateScreen?.('registrar_lote_cafe', 'Miel');
      return;
    }
    if (action === 'registrar_sombrero' || optionTitle.toLowerCase().includes('sombrero')) {
      onNavigateScreen?.('registrar_lote_cafe', 'Sombrero');
      return;
    }
    if (
      action === 'registrar_maiz' ||
      optionTitle.toLowerCase().includes('maíz') ||
      optionTitle.toLowerCase().includes('maiz')
    ) {
      onNavigateScreen?.('registrar_lote_cafe', 'Maíz');
      return;
    }
    if (action === 'registrar_textil' || optionTitle.toLowerCase().includes('textil')) {
      onNavigateScreen?.('registrar_lote_cafe', 'Textil');
      return;
    }
    if (
      action === 'registrar_cafe' ||
      optionTitle.toLowerCase().includes('registrar café') ||
      optionTitle.toLowerCase().includes('registrar cafe') ||
      optionTitle.toLowerCase().includes('café pergamino') ||
      optionTitle.toLowerCase().includes('cafe pergamino')
    ) {
      onNavigateScreen?.('registrar_lote_cafe', 'Café');
      return;
    }
    if (
      action === 'registrar_lote' ||
      optionTitle.toLowerCase().includes('registrar nuevo lote') ||
      optionTitle.toLowerCase().includes('registrar cosecha') ||
      optionTitle.toLowerCase().includes('catálogo') ||
      optionTitle.toLowerCase().includes('catalogo')
    ) {
      onNavigateScreen?.('catalogo_producto');
      return;
    }

    // 2. Registration Questionnaire (if active in registration tab)
    if (activeChannel === 'registro') {
      const userMsg: MessageItem = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: optionTitle,
        time: 'Ahora',
        isCheck: true
      };
      setRegistrationMessages((prev) => [...prev, userMsg]);

      const isMunicipality = ['Tlaxiaco', 'Huajuapan de León', 'Nochixtlán', 'Otro municipio mixteco'].includes(optionTitle);

      setIsBotTyping(true);
      setTypingAgent('📝 Padrón Comunitario');

      if (isMunicipality) {
        setTimeout(() => {
          setIsBotTyping(false);
          const botFollowUp: MessageItem = {
            id: `bot-mun-${Date.now()}`,
            sender: 'bot',
            agentTag: '📝 Padrón Comunitario',
            text: `Municipio registrado: ${optionTitle}.\n\n3. ¿A qué cooperativa, unión de ejidos o grupo pertenece? Seleccione una opción o escriba la suya:`,
            time: 'Ahora',
            options: [
              { id: 1, title: 'Cooperativa Café de las Nubes', subtitle: 'Tlaxiaco / San Juan Ñumí', icon: 'chevron_right' },
              { id: 2, title: 'Unión Ejidal de la Mixteca Alta', subtitle: 'Red de Acopio Comunitario', icon: 'chevron_right' },
              { id: 3, title: 'Productor Comunitario Independiente', subtitle: 'Finca familiar tradicional', icon: 'chevron_right' }
            ]
          };
          setRegistrationMessages((prev) => [...prev, botFollowUp]);
        }, 900);
      } else {
        setTimeout(() => {
          setIsBotTyping(false);
          const botSuccess: MessageItem = {
            id: `bot-done-${Date.now()}`,
            sender: 'bot',
            agentTag: '📝 Padrón Comunitario',
            text: `¡Felicidades Don Aurelio! Su registro como Productor Verificado ha concluido con éxito.\nSu Credencial Digital ID #HUB-MIX-2026 está activa en el sistema.`,
            time: 'Ahora',
            card: {
              type: 'lote_registro'
            }
          };
          setRegistrationMessages((prev) => [...prev, botSuccess]);
        }, 900);
      }
      return;
    }

    // 3. Default: Trigger conversational AI message
    handleSendMessage(undefined, optionTitle);
  };

  const currentMessages =
    activeChannel === 'asistente'
      ? assistantMessages
      : activeChannel === 'registro'
      ? registrationMessages
      : supportMessages;

  return (
    <main className="w-full max-w-md mx-auto px-4 py-3 flex-1 flex flex-col justify-between pb-40">
      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-1.5 bg-[#ebe8e2] p-1 rounded-full mb-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveChannel('asistente')}
          className={`flex-1 py-1.5 px-2.5 rounded-full text-[12px] font-bold transition-all ${
            activeChannel === 'asistente'
              ? 'bg-[#032517] text-white shadow-xs'
              : 'text-[#424843] hover:text-[#032517]'
          }`}
        >
          🤖 Bot &amp; Cards
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel('registro')}
          className={`flex-1 py-1.5 px-2.5 rounded-full text-[12px] font-bold transition-all ${
            activeChannel === 'registro'
              ? 'bg-[#032517] text-white shadow-xs'
              : 'text-[#424843] hover:text-[#032517]'
          }`}
        >
          📝 Registro
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel('soporte')}
          className={`flex-1 py-1.5 px-2.5 rounded-full text-[12px] font-bold transition-all ${
            activeChannel === 'soporte'
              ? 'bg-[#032517] text-white shadow-xs'
              : 'text-[#424843] hover:text-[#032517]'
          }`}
        >
          {targetProducer ? `💬 Productor` : '💬 Ayuda'}
        </button>
      </div>

      {/* Interactive Simulation Status Bar */}
      <div className="bg-[#f0eee8] rounded-xl px-3 py-1.5 mb-2 border border-[#c1c8c2]/40 shadow-2xs flex items-center justify-between text-[11px] text-[#424843]">
        <span className="flex items-center gap-1.5 font-bold text-[#032517]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>IA Gemini • Instrucciones &amp; Análisis</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowKnowledgeBaseModal(true)}
            className="font-bold text-[10.5px] bg-white hover:bg-[#ebe8e2] text-[#424843] px-2 py-0.5 rounded-full border border-[#c1c8c2]/50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Ver base de conocimiento"
          >
            <span>📖 Dossier</span>
          </button>
          {onOpenMicDiagnosticModal && (
            <button
              type="button"
              onClick={onOpenMicDiagnosticModal}
              className="font-bold text-[10.5px] bg-[#032517] hover:bg-[#1b3b2b] text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir calibrador y prueba física de micrófono"
            >
              <span className="material-symbols-outlined text-[13px]">mic</span>
              <span>Probar Mic</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Flow */}
      <div className="flex-1 flex flex-col gap-3 justify-end">
        {currentMessages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex flex-col items-end self-end w-full max-w-[88%]">
                <div className="bg-[#1b3b2b] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-xs w-full">
                  {/* Image attachment rendering */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/20">
                      <img
                        src={msg.mediaUrl}
                        alt="Muestra de campo"
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  )}

                  {/* Voice Note rendering */}
                  {msg.type === 'voice' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl">
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                          className="w-9 h-9 rounded-full bg-emerald-400 text-[#032517] flex items-center justify-center font-bold shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {playingAudioId === msg.id ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {/* Animated waveform bars */}
                            {[40, 70, 90, 60, 80, 50, 95, 65, 85, 45, 75, 55, 90, 60].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full transition-all duration-300 ${
                                  playingAudioId === msg.id
                                    ? 'bg-emerald-300 animate-pulse'
                                    : 'bg-white/40'
                                }`}
                                style={{ height: `${(h * 18) / 100}px` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-200 mt-1">
                            <span>{playingAudioId === msg.id ? 'Reproduciendo...' : 'Nota de voz'}</span>
                            <span>{msg.audioDuration || '0:14'}</span>
                          </div>
                        </div>
                      </div>
                      {msg.transcription && (
                        <p className="text-[12px] text-emerald-100 italic bg-black/30 p-2 rounded-lg leading-relaxed whitespace-pre-line border border-white/10">
                          {msg.transcription}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[14px] font-medium leading-snug">{msg.text}</p>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[#83a590] text-[10px]">
                    <span>{msg.time}</span>
                    {msg.isCheck && (
                      <span className="material-symbols-outlined text-[13px] text-emerald-300">
                        done_all
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Bot message
          return (
            <div key={msg.id} className="flex flex-col items-start w-full max-w-[96%] gap-1.5">
              {msg.agentTag && (
                <span className="text-[11px] font-bold text-[#032517] bg-[#f0eee8] px-2 py-0.5 rounded-md border border-[#c1c8c2]/30">
                  {msg.agentTag}
                </span>
              )}

              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-[#c1c8c2]/30 w-full">
                <p className="text-[14px] text-[#1c1c18] whitespace-pre-line leading-relaxed">
                  {msg.text}
                </p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#c1c8c2]/20">
                  <button
                    type="button"
                    onClick={() => handleSpeakBotMessage(msg.text)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#032517] bg-[#f0eee8] hover:bg-[#e4e1d9] px-2.5 py-1 rounded-full border border-[#c1c8c2]/50 transition-colors cursor-pointer active:scale-95"
                    title="Escuchar mensaje en voz alta (Lectura para adultos mayores)"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-800">
                      {speakingMsgText === msg.text ? 'volume_off' : 'volume_up'}
                    </span>
                    <span>{speakingMsgText === msg.text ? 'Detener voz' : '🔊 Escuchar'}</span>
                  </button>
                  <span className="text-[10px] text-[#727973]">{msg.time}</span>
                </div>
              </div>

              {/* RENDER DYNAMIC BOT CARD (IF ATTACHED) */}
              {msg.card && (
                <BotCardView
                  card={msg.card}
                  onNavigateScreen={onNavigateScreen}
                  onOpenDictamen={onOpenDictamenModal}
                  onOpenLots={onOpenLotsModal}
                  onOpenPayments={onOpenPaymentsModal}
                  onOpenCart={onOpenCartModal}
                  onAddToCart={onAddToCart}
                  onSendChatMessage={(txt) => handleSendMessage(undefined, txt)}
                  selectedLot={selectedLot}
                />
              )}

              {/* Optional interactive choice options */}
              {msg.options && (
                <div className="w-full space-y-1.5 pt-0.5">
                  {msg.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleSelectOption(opt.title, opt.action);
                      }}
                      className="w-full bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all rounded-xl px-3 py-2 border border-[#c1c8c2]/60 flex items-center justify-between text-left shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#ffdbd1] flex items-center justify-center font-bold text-[#a73918] text-[12px] group-hover:bg-[#a73918] group-hover:text-white transition-colors">
                          {opt.id}
                        </span>
                        <div>
                          <p className="text-[13px] font-bold text-[#1c1c18] leading-tight">
                            {opt.title}
                          </p>
                          <p className="text-[11px] text-[#424843]">{opt.subtitle}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#727973] text-[18px]">
                        {opt.icon || 'chevron_right'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Realistic "Escribiendo..." / Typing Indicator */}
        {isBotTyping && (
          <div className="flex items-center gap-2 bg-white rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs border border-[#c1c8c2]/30 w-fit animate-pulse">
            <span className="text-[11px] font-bold text-[#032517]">{typingAgent}</span>
            <span className="text-[11px] text-[#727973]">está escribiendo</span>
            <span className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b3b2b] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b3b2b] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b3b2b] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}

        {/* Generous bottom clearance spacer so cards and option buttons are never hidden under the bottom dock */}
        <div className="h-44 shrink-0 pointer-events-none" aria-hidden="true" />
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Dock & Simulator Controls */}
      <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto px-4 pb-2 bg-gradient-to-t from-[#fcf9f3] via-[#fcf9f3] to-transparent pointer-events-auto z-30 pt-2">
        {/* Hidden file inputs for direct camera and gallery */}
        <input
          ref={directCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Camera Modal (Real Live Camera + Upload + Simulated Field Samples) */}
        {showCameraModal && (
          <div className="mb-2 bg-white rounded-2xl p-3.5 shadow-2xl border border-[#c1c8c2]/60 animate-fade-in flex flex-col gap-2.5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#c1c8c2]/30 pb-2">
              <span className="text-[12px] font-extrabold text-[#032517] uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">photo_camera</span>
                Cámara de Campo &amp; Análisis IA
              </span>
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  setShowCameraModal(false);
                }}
                className="w-6 h-6 rounded-full bg-[#f0eee8] text-[#1c1c18] flex items-center justify-center text-[12px] hover:bg-[#ebe8e2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* LIVE CAMERA VIEWFINDER (IF ACTIVE) */}
            {isLiveCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-emerald-500 shadow-inner">
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

                {/* Camera Overlay Guides */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between items-center text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs w-fit">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5" />
                    <span>En vivo • Apunta al grano o planta</span>
                  </div>

                  {/* Corner brackets guide */}
                  <div className="self-center w-36 h-28 border border-white/40 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-white/70 font-mono tracking-wider">Área de enfoque</span>
                  </div>

                  <div className="text-center text-[10px] text-white/80 bg-black/40 py-0.5 rounded">
                    Tec de Tlaxiaco • Visión Agroecológica
                  </div>
                </div>

                {/* Bottom Controls on Live View */}
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-3 px-3">
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    title="Cambiar cámara frontal/trasera"
                    className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-xs border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCaptureRealPhoto}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[12px] shadow-lg flex items-center gap-1.5 border-2 border-white cursor-pointer active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">camera</span>
                    <span>Tomar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    title="Cerrar cámara en vivo"
                    className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-xs border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ) : (
              /* PRIMARY ACTION BUTTONS: Real Camera or Upload from Device */
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    setShowCameraModal(false);
                    setTimeout(() => directCameraInputRef.current?.click(), 50);
                  }}
                  className="w-full p-3 rounded-xl bg-[#032517] hover:bg-[#1b3b2b] text-white flex items-center gap-3 shadow-md active:scale-98 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-emerald-300">photo_camera</span>
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
                    className="p-2.5 rounded-xl bg-[#f0eee8] hover:bg-[#e4e1d9] text-[#032517] flex flex-col items-center justify-center gap-1 border border-[#c1c8c2]/60 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <span className="material-symbols-outlined text-[22px] text-emerald-700">videocam</span>
                    <span className="text-[11px] font-bold">Visor en Pantalla</span>
                    <span className="text-[9px] text-[#727973]">Webcam en vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setShowCameraModal(false);
                      setTimeout(() => galleryInputRef.current?.click(), 50);
                    }}
                    className="p-2.5 rounded-xl bg-[#f0eee8] hover:bg-[#e4e1d9] text-[#032517] flex flex-col items-center justify-center gap-1 border border-[#c1c8c2]/60 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <span className="material-symbols-outlined text-[22px] text-[#a73918]">photo_library</span>
                    <span className="text-[11px] font-bold">Subir de Galería</span>
                    <span className="text-[9px] text-[#727973]">Fotos guardadas</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Error / Permission Notice (if triggered) */}
            {cameraError && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
                <div className="flex-1">
                  <p className="leading-snug">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setShowCameraModal(false);
                      setTimeout(() => directCameraInputRef.current?.click(), 50);
                    }}
                    className="mt-1 px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <span>Abrir cámara directa</span>
                  </button>
                </div>
              </div>
            )}

            {/* PRE-LOADED FIELD SAMPLES FOR FAST TESTING / DEMOS */}
            <div className="border-t border-[#c1c8c2]/30 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#424843]">
                  Muestras de campo para prueba con IA:
                </span>
                <span className="text-[9px] text-[#727973] uppercase tracking-wide">5 Muestras</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    handleSimulatePhotoUpload('cereza');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-[#fcf9f3] hover:bg-[#ffdbd1]/40 border border-[#c1c8c2]/50 transition-all text-center cursor-pointer group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80"
                    alt="Cereza"
                    className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[10px] font-bold text-[#1c1c18] leading-tight">
                    🍒 Cereza
                  </span>
                  <span className="text-[8px] text-[#727973]">Madurez</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    handleSimulatePhotoUpload('pergamino');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-[#fcf9f3] hover:bg-emerald-50 border border-[#c1c8c2]/50 transition-all text-center cursor-pointer group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop&q=80"
                    alt="Pergamino"
                    className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[10px] font-bold text-[#1c1c18] leading-tight">
                    ☀️ Café
                  </span>
                  <span className="text-[8px] text-[#727973]">Pergamino</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    handleSimulatePhotoUpload('pulque');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-lime-50/70 hover:bg-lime-100 border border-lime-300 transition-all text-center cursor-pointer group"
                  title="Muestra de Pulque tradicional para avalar que la IA no lo confunde con café"
                >
                  <img
                    src="https://images.unsplash.com/photo-1546853020-ca4909aef454?w=200&auto=format&fit=crop&q=80"
                    alt="Pulque"
                    className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform border border-lime-200"
                  />
                  <span className="text-[10px] font-bold text-lime-950 leading-tight">
                    🏺 Pulque
                  </span>
                  <span className="text-[8px] text-lime-800 font-semibold">Tinacal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    handleSimulatePhotoUpload('miel');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-300 transition-all text-center cursor-pointer group"
                  title="Muestra de Miel para comprobar que no la confunde con café"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg"
                    alt="Miel"
                    className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform border border-amber-200"
                  />
                  <span className="text-[10px] font-bold text-amber-950 leading-tight">
                    🍯 Miel
                  </span>
                  <span className="text-[8px] text-amber-800 font-semibold">Apícola</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    handleSimulatePhotoUpload('roya');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-[#fcf9f3] hover:bg-blue-50 border border-[#c1c8c2]/50 transition-all text-center cursor-pointer group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1524350876685-274059332603?w=200&auto=format&fit=crop&q=80"
                    alt="Hojas"
                    className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[10px] font-bold text-[#1c1c18] leading-tight">
                    🍂 Hoja
                  </span>
                  <span className="text-[8px] text-[#727973]">Sanidad</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Invoker Popover Menu */}
        {showCardPicker && (
          <div className="mb-2 bg-white rounded-2xl p-3 shadow-xl border border-[#c1c8c2]/60 animate-fade-in flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-[#c1c8c2]/30 pb-1.5">
              <span className="text-[12px] font-extrabold text-[#032517] uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">widgets</span>
                Desplegar Card de Módulo
              </span>
              <button
                type="button"
                onClick={() => setShowCardPicker(false)}
                className="w-6 h-6 rounded-full bg-[#f0eee8] text-[#1c1c18] flex items-center justify-center text-[12px] hover:bg-[#ebe8e2]"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[12px]">
              <button
                type="button"
                onClick={() => invokeBotCard('dictamen_stellar')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left border border-emerald-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">⛓️</span>
                <span>Dictamen Stellar</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('billetera_pago')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-left border border-amber-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">💳</span>
                <span>Billetera &amp; Saldo</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('lote_registro')}
                className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 font-bold text-left border border-orange-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">☕</span>
                <span>Lote Cosecha</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('producto_vitrina')}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-950 font-bold text-left border border-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">🛍️</span>
                <span>Producto Vitrina</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('trazabilidad_pasaporte')}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-left border border-blue-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">🏷️</span>
                <span>Pasaporte Digital</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('logistica_coyote')}
                className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-950 font-bold text-left border border-cyan-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">🚚</span>
                <span>Flete Coyote Aliado</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('regalias_mercado')}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-950 font-bold text-left border border-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">💎</span>
                <span>10% Regalías Soroban</span>
              </button>
              <button
                type="button"
                onClick={() => invokeBotCard('agente_multiagente')}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-left border border-purple-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">🤖</span>
                <span>Multiagente</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCardPicker(false);
                  setShowKnowledgeBaseModal(true);
                }}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left border border-emerald-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">📖</span>
                <span>Base Notion</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCardPicker(false);
                  if (onOpenMapModal) onOpenMapModal();
                }}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-left border border-blue-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[16px]">🗺️</span>
                <span>Mapa Parcelas</span>
              </button>
            </div>
          </div>
        )}

        {/* Clean, High-Contrast Quick Action Bar (Designed for Elderly Adults - Zero Friction) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-2 pb-0.5 text-[12px]">
          <button
            type="button"
            onClick={() => handleSelectOption('Registrar Café Pergamino', 'registrar_cafe')}
            className="shrink-0 bg-[#032517] hover:bg-[#1b3b2b] text-white font-bold px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>☕ Registrar Cosecha</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            className="shrink-0 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span>Evaluar con Foto</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPaymentsModal?.()}
            className="shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-3 py-1.5 rounded-full border border-amber-300 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>💰 Mi Saldo ($38,250)</span>
          </button>
          <button
            type="button"
            onClick={handleInsertSampleMixtecoAudio}
            className="shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold px-3 py-1.5 rounded-full border border-stone-300 shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>🎙️ Audio Mixteco</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCardPicker(!showCardPicker)}
            className="shrink-0 bg-white hover:bg-[#f0eee8] text-[#032517] font-semibold px-2.5 py-1.5 rounded-full border border-[#c1c8c2]/50 shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <span className="material-symbols-outlined text-[15px]">widgets</span>
            <span>Más Módulos</span>
          </button>
        </div>

        {/* Text, Photo and Voice Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between shadow-lg border border-[#c1c8c2]/40"
        >
          {/* Card Invoker Quick Icon */}
          <button
            type="button"
            onClick={() => setShowCardPicker(!showCardPicker)}
            title="Desplegar tarjeta de módulo"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#032517] hover:bg-[#f0eee8] transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
          </button>

          {/* Photo upload camera button */}
          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            title="Abrir cámara o subir foto de cultivo"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#424843] hover:text-[#032517] hover:bg-[#f0eee8] transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[19px]">photo_camera</span>
          </button>

          <input
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[14px] text-[#1c1c18] placeholder:text-[#424843]/60 px-2 py-1 outline-none"
            placeholder={
              activeChannel === 'asistente'
                ? 'Escriba su mensaje, registre café o use el micrófono...'
                : activeChannel === 'registro'
                ? 'Escriba su respuesta o toque una opción...'
                : 'Escriba un mensaje al productor...'
            }
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />

          <div className="flex items-center gap-1">
            {/* Audio Voice Note Button */}
            <button
              type="button"
              onClick={() => {
                if (!isRecording) {
                  startVoiceRecording();
                } else {
                  stopVoiceRecording();
                }
              }}
              aria-label="Mensaje de voz"
              title={isRecording ? "Detener y enviar consulta de voz" : "Grabar consulta de voz con micrófono"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-[#424843] hover:bg-[#f0eee8]'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                {isRecording ? 'stop' : 'mic'}
              </span>
            </button>

            {/* Send text button */}
            <button
              aria-label="Enviar mensaje"
              className="w-9 h-9 rounded-full bg-[#a73918] hover:bg-[#6c1900] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
              type="submit"
            >
              <span className="material-symbols-outlined text-[17px]">send</span>
            </button>
          </div>
        </form>

        {/* Live Audio Recording Dock */}
        {isRecording && (
          <div className="mt-2 bg-[#1b3b2b] text-white p-3 rounded-2xl shadow-md border border-[#c7ebd4]/20 flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[12px] font-bold text-red-300 font-mono">
                  0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                </span>
                <span className="text-[11px] text-[#c7ebd4] font-semibold">
                  🎙️ Micrófono en vivo (Español / Mixteco)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="px-2.5 py-1 text-[11px] bg-white/15 hover:bg-white/25 rounded-full text-white cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="px-3 py-1 text-[11px] font-bold bg-[#a73918] hover:bg-[#8c2d12] rounded-full text-white flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">send</span>
                  <span>Enviar</span>
                </button>
              </div>
            </div>

            {/* Live Volume Level Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Nivel:</span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-yellow-400 to-red-400 transition-all duration-75 rounded-full"
                  style={{ width: `${audioVolume}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-200">{audioVolume}%</span>
            </div>

            {/* Live speech preview */}
            <div className="text-[12px] text-white/90 italic bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/10 truncate">
              {liveVoiceTranscript ? `"${liveVoiceTranscript}"` : 'Habla claro frente a tu micrófono...'}
            </div>
          </div>
        )}

        {/* Microphone error toast */}
        {micError && (
          <div className="mt-1 text-[11px] font-medium text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl flex items-center justify-between shadow-xs">
            <span>{micError}</span>
            <button
              type="button"
              onClick={() => setMicError(null)}
              className="text-red-900 font-bold text-[14px] ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Full Knowledge Base & Technical Blueprint Modal */}
      <KnowledgeBaseModal
        isOpen={showKnowledgeBaseModal}
        onClose={() => setShowKnowledgeBaseModal(false)}
        onOpenCard={(cardType) => invokeBotCard(cardType)}
      />
    </main>
  );
};
