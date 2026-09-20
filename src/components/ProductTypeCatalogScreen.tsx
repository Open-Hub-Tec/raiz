import React, { useState, useRef, useEffect } from 'react';
import { useAudioRecordingSession } from '../hooks/useAudioRecordingSession';
import { AppLanguage, ScreenView } from '../types';
import { LiveRecorderSession } from '../utils/audioRecorder';
import { sanitizeProductName } from '../utils/productUtils';

interface ProductTypeCatalogScreenProps {
  onSelectProduct: (productName: string) => void;
  onNavigateScreen: (screen: ScreenView) => void;
  elderMode?: boolean;
  appLanguage?: AppLanguage;
}

export const ProductTypeCatalogScreen: React.FC<ProductTypeCatalogScreenProps> = ({
  onSelectProduct,
  onNavigateScreen,
  elderMode = false,
  appLanguage = 'es'
}) => {
  const isMixteco = appLanguage === 'mix';
  const [selectedItem, setSelectedItem] = useState<string>('Café');
  const [inputText, setInputText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { startRecording, audioLevel: audioVolume } = useAudioRecordingSession();
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);

  const recorderSessionRef = useRef<LiveRecorderSession | null>(null);

  useEffect(() => {
    return () => {
      if (recorderSessionRef.current) {
        recorderSessionRef.current.cancel();
      }
    };
  }, []);

  const productOptions = [
    {
      id: 1,
      name: 'Café',
      desc: 'Grano o molido',
      icon: 'coffee',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g',
      imageAlt: 'Café de altura pergamino y grano'
    },
    {
      id: 2,
      name: 'Miel',
      desc: 'Virgen y orgánica',
      icon: 'hive',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg',
      imageAlt: 'Frasco de miel virgen silvestre de campanilla'
    },
    {
      id: 3,
      name: 'Maíz',
      desc: 'Criollo mixteco',
      icon: 'grain',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx4jUpQopozBH8CYGA3m-Tfhex_UjwxY-4UKei8h4QhxSSmzObP9OdoONSXqi0XITG11whMMoDAOmA4bw0hSNWommPAh4F1D5ffA86lEaxrdfmf3kJ11rzljgIJllTeHX25OBP5QgRG79YiKsHHOLHgZPBf6D-AEEoGtbjiemIcHXuuXj7ZM1cyu0e6F19V9rkEX4nPjc7Dsc2w4tfJ_eHgPoPJzpuWKstIg6jmmd_4HM4ixO1PrSK4Q',
      imageAlt: 'Maíz criollo nativo y frijol de la Mixteca'
    },
    {
      id: 4,
      name: 'Jitomate',
      desc: 'Invernadero o campo',
      icon: 'nutrition',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
      imageAlt: 'Jitomate fresco de campo'
    },
    {
      id: 5,
      name: 'Sombrero',
      desc: 'Tejido de palma',
      icon: 'dry_cleaning',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkQ_T-4HkMOGbUXCEL4WB3G-nckbk4y8MBXaW8RROxSTNJ7CpRum4bbwbnLCoYIsiGQouYyMcMM8EHk1DzR9XrOLMdVSb-RqJUa1aBk1p6JnwmWpKfFndzgY1CS6A1wg_wb_ZV0zrKj5zVgEEMN7Z3_m97Xx-9YigQ14ZAHHNVhaRXXI0nBiVqxjMXJ8MLMVi_gKnPRfs1qzravdO-6Uv0M8q2gl5pOM-K5nYvOyXYJ1GfD99czI_Ltw',
      imageAlt: 'Sombrero tradicional de palma mixteca'
    },
    {
      id: 6,
      name: 'Textil',
      desc: 'Bordado artesanal',
      icon: 'styler',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ch3EnTKfOPzLhJvKhO3lCcPIUAE3hVVkfX5Im0s-WO1vCixJXClxdVdruWiPRqr3ZuxAzdlH3yAof7r8gqeX3gu9Ib76kDaeSl6pOyNhXt8PsFUfn2Jc7_xqUysoYwZ8H3nJ1yfgy2pOSZt3H-5XCr1VJuyIa-sigPM_rzR4gUCUs1ekNF4IJND5FqstPVswevuKVBQzWO0uds-_-hVuY5mZRW5VnjA9Ovw00rmRFDxpZZ5yIbtMBA',
      imageAlt: 'Huipil artesanal en telar de cintura'
    },
    {
      id: 7,
      name: 'Pulque',
      desc: 'Aguamiel y tinacal',
      icon: 'local_bar',
      imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80',
      imageAlt: 'Maguey pulquero y fermentación de aguamiel'
    },
    {
      id: 8,
      name: 'Otro producto',
      desc: 'Escribir nombre o nota de voz',
      icon: 'edit_note',
      isFullWidth: true
    }
  ];

  const handleCardClick = (name: string) => {
    if (name === 'Otro producto') {
      setSelectedItem('Otro producto');
      setInputText('');
      return;
    }
    const clean = sanitizeProductName(name);
    setSelectedItem(clean);
    setInputText(clean);
    // Proceed to Step 3 with clean product name
    onSelectProduct(clean);
    onNavigateScreen('registrar_lote_cafe');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = inputText.trim() || selectedItem;
    if (val && val !== 'Otro producto') {
      const clean = sanitizeProductName(val);
      onSelectProduct(clean);
      onNavigateScreen('registrar_lote_cafe');
    }
  };

  const matchProductFromVoice = (spokenText: string): string | null => {
    const text = spokenText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!cleanText(text)) return null;

    // Check Option 7 FIRST (Pulque / Aguamiel / Maguey / Ndichi / usa)
    if (
      /\b(7|siete|septima|septimo|usa)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(7|siete)/i.test(text) ||
      text.includes('pulque') ||
      text.includes('aguamiel') ||
      text.includes('tinacal') ||
      text.includes('maguey') ||
      text.includes('ndichi')
    ) {
      return 'Pulque';
    }

    // Check Option 4 (Jitomate / Tomate / Tikuachi / kumi)
    if (
      /\b(4|cuatro|cuarta|kumi)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(4|cuatro)/i.test(text) ||
      text.includes('jitomate') ||
      text.includes('tomate') ||
      text.includes('saladette') ||
      text.includes('hortaliza') ||
      text.includes('tikuachi')
    ) {
      return 'Jitomate';
    }

    // Check Option 3 (Maíz / Frijol Criollo / Nuni / uni)
    if (
      /\b(3|tres|tercera|tercer|uni)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(3|tres)/i.test(text) ||
      text.includes('maiz') ||
      text.includes('frijol') ||
      text.includes('milpa') ||
      text.includes('granos') ||
      text.includes('criollo') ||
      text.includes('nuni')
    ) {
      return 'Maíz';
    }

    // Check Option 2 (Miel Pura / Ñuñu / uu)
    if (
      /\b(2|dos|segunda|segundo|uu)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(2|dos)/i.test(text) ||
      text.includes('miel') ||
      text.includes('abeja') ||
      text.includes('virgen') ||
      text.includes('panal') ||
      text.includes('apicola') ||
      text.includes('ñuñu') ||
      text.includes('nunu')
    ) {
      return 'Miel';
    }

    // Check Option 1 (Café Pergamino / Kafé / iin)
    if (
      /\b(1|uno|una|primera|primero|iin)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(1|uno|una)/i.test(text) ||
      text.includes('cafe') ||
      text.includes('kafe') ||
      text.includes('arabica') ||
      text.includes('pluma') ||
      text.includes('pergamino')
    ) {
      return 'Café';
    }

    // Check Option 5 (Sombrero de Palma / Titi / u'un)
    if (
      /\b(5|cinco|quinta|quinto|u'un|uun)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(5|cinco)/i.test(text) ||
      text.includes('sombrero') ||
      text.includes('palma') ||
      text.includes('tenate') ||
      text.includes('costeno') ||
      text.includes('titi')
    ) {
      return 'Sombrero';
    }

    // Check Option 6 (Textil Artesanal / Sa'ma / iñu)
    if (
      /\b(6|seis|sexta|sexto|iñu|inu)\b/i.test(text) ||
      /(opcion|numero|num|no\.?)\s*(6|seis)/i.test(text) ||
      text.includes('textil') ||
      text.includes('telar') ||
      text.includes('huipil') ||
      text.includes('rebozo') ||
      text.includes('artesania') ||
      text.includes("sa'ma") ||
      text.includes('sama')
    ) {
      return 'Textil';
    }

    return null;
  };

  function cleanText(t: string) {
    return t.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  }

  const toggleVoiceRecording = async (automatic = false) => {
    if (isRecording || automatic) {
      // STOP recording
      setIsRecording(false);
      if (recorderSessionRef.current) {
        try {
          const session = recorderSessionRef.current;
          recorderSessionRef.current = null;
          const result = await session.stop();
          const transcriptToEvaluate = (result.transcript || liveTranscript || '').trim();
          const matched = matchProductFromVoice(transcriptToEvaluate);
          if (matched) {
            const clean = sanitizeProductName(matched);
            setSelectedItem(clean);
            setInputText(clean);
            setMicStatusMessage(`¡Entendido! Reconocido: "${clean}". Entrando al registro...`);
            setTimeout(() => {
              onSelectProduct(clean);
              onNavigateScreen('registrar_lote_cafe');
            }, 900);
          } else if (transcriptToEvaluate) {
            const clean = sanitizeProductName(transcriptToEvaluate);
            setMicStatusMessage(`Escuchado: "${clean}". Selecciona o confirma tu producto.`);
            setInputText(clean);
          } else {
            setMicStatusMessage('Audio grabado. Habla claro o di el nombre del producto (ej. "Pulque", "Café").');
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          console.error(e);
          setMicStatusMessage('Error al procesar el audio del micrófono.');
        }
      }
    } else {
      // START recording
      setMicStatusMessage(null);
      setLiveTranscript('');
      try {
        const session = await startRecording({
          onStopped: (reason) => {
            if (reason === 'limit' || reason === 'hidden' || reason === 'ended' || reason === 'error') void toggleVoiceRecording(true);
          },
          onInterimTranscript: (text) => {
            setLiveTranscript(text);
            const matched = matchProductFromVoice(text);
            if (matched) {
              setSelectedItem(matched);
            }
          },
          lang: 'es-MX',
        });
        recorderSessionRef.current = session;
        setIsRecording(true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Error accediendo al micrófono:', err);
        setIsRecording(false);
        setMicStatusMessage(
          'Permiso de micrófono no otorgado en el navegador. Por favor permite el acceso al micrófono o toca directamente la tarjeta del producto.'
        );
      }
    }
  };

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-4 py-3 flex flex-col gap-4 pb-28">
      {/* Top back navigation button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigateScreen('menu_principal')}
          className={`inline-flex items-center gap-1.5 font-bold text-[#032517] hover:text-[#a73918] bg-white rounded-full border border-[#c1c8c2]/50 shadow-2xs active:scale-95 transition-all cursor-pointer ${
            elderMode ? 'px-4 py-2 text-[15px] min-h-[46px]' : 'px-3 py-1.5 text-[13px]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{isMixteco ? "Nda'a Menú" : 'Volver al Menú'}</span>
        </button>
        <span className="text-[12px] font-semibold text-[#727973] bg-[#f0eee8] px-2.5 py-1 rounded-full">
          Paso 1 de 4
        </span>
      </div>

      {/* Bot Chat Header Bubble */}
      <section className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#1b3b2b] flex items-center justify-center text-[#c7ebd4] shrink-0 mt-1 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
          </div>
          <div className="bg-white border border-[#c1c8c2]/30 rounded-2xl rounded-tl-xs p-4 shadow-sm flex-1">
            <p className={`text-[#032517] font-bold mb-1 tracking-tight ${elderMode ? 'text-[22px]' : 'text-[19px]'}`}>
              {isMixteco ? '¿Ña chichi ka’an koto yo vixin?' : '¿Qué producto deseas registrar hoy?'}
            </p>
            <p className={`text-[#424843] leading-relaxed ${elderMode ? 'text-[16px]' : 'text-[14px]'}`}>
              {isMixteco
                ? 'Koto tarjeta nuu teléfono o ka’an ndute voz.'
                : 'Selecciona una opción del catálogo rural de la Mixteca o di su nombre en voz alta.'}
            </p>
          </div>
        </div>
      </section>

      {/* Grid Header */}
      <div className="flex items-center justify-between px-1">
        <span className={`text-[#424843] font-medium ${elderMode ? 'text-[15px] font-bold' : 'text-[13px]'}`}>
          {isMixteco ? 'Chichi numerado' : 'Menú táctil numerado'}
        </span>
        <span className={`text-[#a73918] font-bold ${elderMode ? 'text-[15px]' : 'text-[13px]'}`}>
          {isMixteco ? 'Toca para elegir' : 'Toca para elegir'}
        </span>
      </div>

      {/* Bento Grid: 1-column in elderMode for large tap targets, 2-column otherwise */}
      <div className={`grid ${elderMode ? 'grid-cols-1 gap-3.5' : 'grid-cols-2 gap-3'}`}>
        {productOptions.map((item) => {
          const isSelected = selectedItem === item.name;

          if (elderMode) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCardClick(item.name)}
                className={`w-full text-left bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border-2 ${
                  isSelected ? 'border-[#a73918] bg-[#ffdbd1]/25 ring-2 ring-[#a73918]/30' : 'border-[#c1c8c2]/50'
                } p-4 rounded-2xl shadow-xs flex items-center justify-between min-h-[76px] cursor-pointer group`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-[#ffdbd1] text-[#3b0900] flex items-center justify-center text-[18px] font-black shrink-0 border border-[#a73918]/30">
                    {item.id}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[20px] font-black text-[#032517] leading-snug truncate">
                      {item.name}
                    </span>
                    <span className="text-[14px] font-semibold text-[#424843] block truncate">
                      {item.desc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f0eee8] border border-[#c1c8c2]/30 shadow-2xs shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="material-symbols-outlined text-[24px] text-[#a73918]">
                    chevron_right
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCardClick(item.name)}
              className={`text-left bg-white hover:bg-[#f0eee8] active:scale-[0.98] transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-[#a73918] bg-[#ffdbd1]/20'
                  : 'border-transparent'
              } p-3.5 rounded-2xl shadow-xs flex ${
                item.isFullWidth
                  ? 'col-span-2 items-center justify-between min-h-[64px]'
                  : 'flex-col justify-between min-h-[115px]'
              } group cursor-pointer`}
            >
              {item.isFullWidth ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#ffdbd1] text-[#3b0900] flex items-center justify-center text-[13px] font-bold shrink-0">
                      {item.id}
                    </span>
                    <div>
                      <span className="block text-[18px] font-bold text-[#032517]">
                        {item.name}
                      </span>
                      <span className="text-[13px] text-[#424843]">{item.desc}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#032517] text-[28px] group-hover:text-[#a73918] transition-colors">
                    {item.icon}
                  </span>
                </>
              ) : (
                <div className="flex flex-col w-full gap-2">
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-[#f0eee8] border border-[#c1c8c2]/30 shadow-2xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt || item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : null}
                    <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#ffdbd1] text-[#3b0900] flex items-center justify-center text-[12px] font-extrabold shadow-xs">
                      {item.id}
                    </span>
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-[#032517] flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[15px] text-[#a73918]">
                        {item.icon}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[16px] font-bold text-[#032517] leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[12px] text-[#424843] leading-snug line-clamp-1">
                      {item.desc}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Voice Dictation Banner */}
      <section className={`bg-[#f6f3ed] rounded-2xl flex flex-col gap-2 border border-[#c1c8c2]/40 shadow-xs ${
        elderMode ? 'p-4' : 'p-3'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={`rounded-full flex items-center justify-center shrink-0 transition-colors ${
                elderMode ? 'w-11 h-11' : 'w-9 h-9'
              } ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#a73918]/10 text-[#a73918]'
              }`}
            >
              <span className={`material-symbols-outlined ${elderMode ? 'text-[24px]' : 'text-[20px]'}`}>
                {isRecording ? 'graphic_eq' : 'mic'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[#1c1c18] font-bold block truncate ${elderMode ? 'text-[15px]' : 'text-[13px]'}`}>
                {isRecording
                  ? '🎙️ Micrófono activo · Habla ahora...'
                  : isMixteco
                  ? '¿Ka’an ndute voz? Di el número o producto'
                  : '¿Prefieres dictar? Di el número o nombre'}
              </span>
              <span className={`text-[#727973] block truncate ${elderMode ? 'text-[13px]' : 'text-[11px]'}`}>
                {isRecording
                  ? liveTranscript
                    ? `Detectando: "${liveTranscript}"`
                    : 'Ejemplo: "Café", "Miel", "Tres" o "Sombrero"'
                  : 'Presiona Grabar y di el producto'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleVoiceRecording()}
            className={`rounded-full font-bold text-white transition-all active:scale-95 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 ${
              elderMode ? 'px-5 py-3 text-[15px] min-h-[50px]' : 'px-4 py-2 text-[13px]'
            } ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-[#032517] hover:bg-[#1b3b2b]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRecording ? 'stop' : 'mic'}
            </span>
            <span>{isRecording ? 'Detener' : 'Grabar'}</span>
          </button>
        </div>

        {/* Live Audio Level Indicator when recording */}
        {isRecording && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#c1c8c2]/30">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Nivel de voz:
            </span>
            <div className="flex-1 h-2 bg-[#e4e2dc] rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75 rounded-full"
                style={{ width: `${Math.max(8, audioVolume)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#424843]">{audioVolume}%</span>
          </div>
        )}

        {/* Feedback / status toast if present */}
        {micStatusMessage && (
          <div className="text-[12px] font-medium text-[#032517] bg-white/80 border border-[#c1c8c2]/50 px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-1">
            <span>{micStatusMessage}</span>
            <button
              type="button"
              onClick={() => setMicStatusMessage(null)}
              className="text-[#727973] hover:text-[#1c1c18] text-[14px]"
            >
              ×
            </button>
          </div>
        )}
      </section>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <div className="relative flex-1">
          <input
            className={`w-full rounded-full bg-white border border-[#c1c8c2] px-4 text-[#1c1c18] placeholder:text-[#424843]/60 focus:outline-none focus:ring-2 focus:ring-[#032517] ${
              elderMode ? 'h-14 text-[17px]' : 'h-12 text-[16px]'
            }`}
            placeholder={isMixteco ? "Escribe '1', 'Kafé' o 'Nuni'..." : "Escribe '1' o 'Café'..."}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <button
          aria-label="Enviar selección"
          className={`rounded-full bg-[#a73918] text-white flex items-center justify-center hover:bg-[#6c1900] active:scale-95 transition-all shadow-sm cursor-pointer ${
            elderMode ? 'w-14 h-14' : 'w-12 h-12'
          }`}
          type="submit"
        >
          <span className="material-symbols-outlined text-[22px]">send</span>
        </button>
      </form>
    </main>
  );
};
