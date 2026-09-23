import React from 'react';
import { AppLanguage, DigitalPassportLot, ScreenView } from '../types';

interface DigitalPassportScreenProps {
  lot: DigitalPassportLot;
  onNavigateScreen: (screen: ScreenView) => void;
  onOpenDictamen: (lot: DigitalPassportLot) => void;
  onOpenQrTag?: (lot: DigitalPassportLot) => void;
  onDirectMessageProducer: (producerName: string) => void;
  onAddToCart: (item: {
    id: string;
    title: string;
    price: number;
    artisanName: string;
    location: string;
    imageUrl: string;
    quantity: number;
    unit: string;
  }) => void;
  elderMode?: boolean;
  appLanguage?: AppLanguage;
}

export const DigitalPassportScreen: React.FC<DigitalPassportScreenProps> = ({
  lot,
  onNavigateScreen,
  onOpenDictamen,
  onOpenQrTag,
  onDirectMessageProducer,
  onAddToCart,
  elderMode = false,
  appLanguage = 'es'
}) => {
  const isMixteco = appLanguage === 'mix';
  const handleBuyLot = () => {
    onAddToCart({
      id: lot.id,
      title: `${lot.title} (Bulto Acopio)`,
      price: lot.pricePerKg * 10, // standard 10kg sack or custom purchase
      artisanName: lot.producerName,
      location: lot.location,
      imageUrl: lot.imageUrl,
      quantity: 1,
      unit: '10 kg'
    });
  };

  return (
    <main className="w-full max-w-lg mx-auto px-4 py-3 flex flex-col gap-4 pb-32">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigateScreen('menu_principal')}
          className={`inline-flex items-center gap-1.5 font-bold text-[#032517] hover:text-[#a73918] bg-white rounded-full border border-[#c1c8c2]/50 shadow-2xs transition-all active:scale-95 cursor-pointer ${
            elderMode ? 'px-4 py-2 text-[15px] min-h-[46px]' : 'px-3 py-1.5 text-[13px]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{isMixteco ? "Nda'a Menú" : 'Volver al Menú'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#032517] bg-[#f0eee8] px-2.5 py-1 rounded-full border border-[#c1c8c2]/50 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Stellar Testnet (Simulado)</span>
          </span>
          <span className="text-[12px] font-semibold text-[#a73918] bg-[#ffdbd1] px-3 py-1 rounded-full">
            {isMixteco ? 'Paso 4 · Pasaporte' : 'Paso 4 de 4 · Pasaporte Emitido'}
          </span>
        </div>
      </div>

      {/* Conversational Assistant Bubble */}
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#032517] flex items-center justify-center text-white shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-[20px]">hub</span>
        </div>
        <div className="bg-white text-[#1c1c18] rounded-2xl rounded-tl-xs p-4 max-w-[90%] shadow-xs border border-[#c1c8c2]/40">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[14px] text-[#032517] font-bold">Asistente Raíz</span>
            <span className="text-[11px] text-[#424843]">10:42 AM</span>
          </div>
          <p className="text-[14px] text-[#424843] leading-relaxed">
            Aquí tienes la ficha transparente del lote validado en la Mixteca Alta. Puedes revisar trazabilidad comunitaria y verificación de origen antes de formalizar la compra.
          </p>
        </div>
      </div>

      {/* Main Passport Card */}
      <section className="bg-white rounded-2xl overflow-hidden border border-[#c1c8c2]/50 shadow-sm">
        {/* Hero Image with Badges */}
        <div className="relative w-full h-56 overflow-hidden bg-[#f0eee8]">
          <img
            src={lot.imageUrl}
            alt={lot.imageAlt || lot.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#032517]/90 via-black/20 to-black/30"></div>

          {/* Floating Verified Seal */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 border border-[#c7ebd4] shadow-sm">
            <span
              className="material-symbols-outlined text-[#032517] text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-[12px] text-[#032517] font-bold">Pasaporte Digital Activo</span>
          </div>

          {/* Identifier Over Image */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <span className="text-[11px] uppercase tracking-wider text-[#c7ebd4] font-bold bg-[#1b3b2b]/90 px-2.5 py-0.5 rounded-full inline-block">
              LOTE #{lot.code}
            </span>
            <h1 className="text-[22px] font-bold text-white mt-1 leading-tight tracking-tight">
              {lot.title}
            </h1>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 flex flex-col gap-4">
          {/* Producer Profile */}
          <div className="flex items-center justify-between pb-3 border-b border-[#f0eee8]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#ffdbd1] text-[#3b0900] flex items-center justify-center font-bold text-[16px] border-2 border-[#fe7952]">
                {lot.producerInitials}
              </div>
              <div>
                <span className="text-[11px] text-[#424843] font-medium block">
                  Productor Comunitario
                </span>
                <p className="text-[16px] text-[#1c1c18] font-bold leading-tight">
                  {lot.producerName}
                </p>
                <p className="text-[13px] text-[#424843] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[15px] text-[#a73918]">pin_drop</span>
                  {lot.location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#424843] block font-medium">Volumen</span>
              <span className="text-[18px] text-[#032517] font-bold">{lot.volumeKg} kg</span>
            </div>
          </div>

          {/* Verified Regulatory Status */}
          <div className="bg-[#f6f3ed] rounded-xl p-3 border border-[#c1c8c2]/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c7ebd4] text-[#002113] flex items-center justify-center shrink-0 shadow-2xs">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  gavel
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-[#032517]">
                    Estado Normativo: {lot.verifiedStatus}
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-[#abcfb8] text-[#002113] text-[11px] font-bold">
                    {lot.nomCompliance?.immutableSealStatus || 'Con Evidencia'}
                  </span>
                </div>
                <p className="text-[12px] text-[#424843] mt-0.5">
                  Organismo Evaluador:{' '}
                  <strong className="text-[#1c1c18] font-semibold">{lot.evaluatorOrg}</strong>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
                  {lot.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-[#f0eee8] px-2 py-0.5 rounded-md text-[#424843] font-medium"
                    >
                      <span className="material-symbols-outlined text-[13px] text-[#032517]">
                        check_circle
                      </span>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NOM / NMX Compliance & Stellar Ledger Banner */}
          {lot.nomCompliance && (
            <div className="bg-white rounded-xl p-3.5 border border-emerald-300/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                    verified_user
                  </span>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#032517] leading-tight">
                      Certificación Normativa NMX-F-083 & NOM-255
                    </h3>
                    <p className="text-[10px] text-[#727973]">Evaluación por Laboratorio Tec Tlaxiaco</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  Cumple 100%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#fcf9f3] p-2 rounded-lg border border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    Humedad en Grano (NMX)
                  </span>
                  <span className="font-extrabold text-[#032517] text-[13px]">
                    {lot.nomCompliance.humidity}
                  </span>
                  <span className="text-[9px] text-emerald-700 block font-medium">
                    Óptimo (10% - 12%)
                  </span>
                </div>

                <div className="bg-[#fcf9f3] p-2 rounded-lg border border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    Conteo de Defectos
                  </span>
                  <span className="font-extrabold text-[#032517] text-[13px]">
                    {lot.nomCompliance.defectPercentage}%
                  </span>
                  <span className="text-[9px] text-emerald-700 block font-medium">
                    Grado Especialidad
                  </span>
                </div>

                <div className="bg-[#fcf9f3] p-2 rounded-lg border border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    Altitud Parcela (NOM)
                  </span>
                  <span className="font-extrabold text-[#032517] text-[13px]">
                    {lot.altitude || '1,650 msnm'}
                  </span>
                  <span className="text-[9px] text-emerald-700 block font-medium">
                    Estricta Altura
                  </span>
                </div>

                <div className="bg-[#fcf9f3] p-2 rounded-lg border border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-[#727973] block">
                    Pureza Botánica
                  </span>
                  <span className="font-extrabold text-[#032517] text-[13px]">
                    Typica Pluma
                  </span>
                  <span className="text-[9px] text-emerald-700 block font-medium">
                    Libre de OGM
                  </span>
                </div>
              </div>

              {/* Inmutable Proof Seal - Anti-Piracy Protection */}
              <div className="bg-[#1b3b2b] text-white p-2.5 rounded-xl flex items-center justify-between text-[11px] shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-300 text-[18px]">
                    verified_user
                  </span>
                  <div>
                    <span className="font-bold block text-white text-[12px]">
                      Sello Comunitario Antifraude (TecNM)
                    </span>
                    <span className="text-[10px] text-emerald-200/90">
                      Protegido contra copias y coyotaje · Registro Oficial #{lot.nomCompliance.stellarTxLedger || '52,491,802'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {onOpenQrTag && (
                    <button
                      type="button"
                      onClick={() => onOpenQrTag(lot)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      title="Generar e imprimir etiqueta QR física"
                    >
                      <span className="material-symbols-outlined text-[13px]">qr_code_2</span>
                      <span>Etiqueta QR</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenDictamen(lot)}
                    className="px-2 py-1 bg-white/15 hover:bg-white/25 text-white font-bold text-[10px] rounded-lg border border-white/20 transition-all cursor-pointer flex items-center gap-1"
                    title="Compartir enlace público del certificado"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    <span>Compartir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDictamen(lot)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    Ver Dictamen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Producer Royalty Clause Card (Soroban Smart Contract) */}
          <div className="bg-gradient-to-r from-purple-50 via-purple-50/60 to-white rounded-xl p-3.5 border border-purple-300/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">💎</span>
                <div>
                  <h3 className="text-[13px] font-extrabold text-purple-950 leading-tight">
                    Cláusula de Regalías Perpetuas al Productor
                  </h3>
                  <p className="text-[10px] text-purple-800">Smart Contract Soroban (Stellar Network)</p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300">
                8% Garantizado
              </span>
            </div>

            <p className="text-[11px] text-[#424843] leading-relaxed">
              Este lote cuenta con protección de <strong>Regalía de Origen</strong>: si el café es tostado, empacado y revendido con mayor margen en cafeterías de especialidad de CDMX, Monterrey o el extranjero, el <strong>8% de cada transacción secundaria</strong> se deposita automáticamente a la cuenta de <strong className="text-purple-950">{lot.producerName}</strong>, más un <strong>2% al Fondo Comunal de la Mixteca</strong>.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-white/80 p-2 rounded-lg border border-purple-150">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Regalías Acumuladas</span>
                <span className="text-[14px] font-black text-purple-950">
                  +${(lot.royaltyClause?.accumulatedRoyaltiesMxn || 3420).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-purple-150">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Reventas Rastreadas</span>
                <span className="text-[14px] font-black text-purple-950">
                  {lot.royaltyClause?.secondarySalesCount || 3} Reventas en Boutiques
                </span>
              </div>
            </div>
          </div>

          {/* Traceability Timeline */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[13px] font-bold text-[#032517] uppercase tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">timeline</span>
              Línea de Tiempo del Lote
            </h2>
            <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#c1c8c2]">
              {lot.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <span
                    className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-2xs"
                    style={{ backgroundColor: event.color }}
                  ></span>
                  <div>
                    <p className="text-[14px] font-bold text-[#1c1c18]">{event.title}</p>
                    <p className="text-[12px] text-[#424843]">{event.dateAndLocation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numbered Passport Options */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-semibold text-[#424843] uppercase tracking-wider">
              Opciones del Pasaporte Digital
            </span>

            {/* Option 1: PDF Dictamen */}
            <button
              type="button"
              onClick={() => onOpenDictamen(lot)}
              className="min-h-[50px] bg-[#f0eee8] hover:bg-[#ebe8e2] active:scale-[0.98] transition-all rounded-xl p-3 flex items-center justify-between text-left group cursor-pointer border border-[#c1c8c2]/30 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#1c1c18]">
                    Inspeccionar Dictamen Normativo (PDF)
                  </p>
                  <p className="text-[12px] text-[#424843]">
                    Sello de autenticidad respaldado por TecNM Tlaxiaco · Folio: {lot.code}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#727973] group-hover:text-[#032517] transition-colors">
                chevron_right
              </span>
            </button>

            {/* Option 2: Printable QR Tag */}
            {onOpenQrTag && (
              <button
                type="button"
                onClick={() => onOpenQrTag(lot)}
                className="min-h-[50px] bg-[#fcf9f3] hover:bg-[#f6f3ed] active:scale-[0.98] transition-all rounded-xl p-3 flex items-center justify-between text-left group cursor-pointer border border-[#a73918]/30 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#032517] flex items-center gap-1.5">
                      <span>Generar e Imprimir Etiqueta QR de Autenticidad</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        Offline
                      </span>
                    </p>
                    <p className="text-[12px] text-[#424843]">
                      Etiqueta física (Hang-tag) para colgar al bulto de cosecha o coser a la artesanía
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#a73918] group-hover:scale-110 transition-transform">
                  qr_code_2
                </span>
              </button>
            )}

            {/* Option 3: Message Producer */}
            <button
              type="button"
              onClick={() => onDirectMessageProducer(lot.producerName)}
              className="min-h-[50px] bg-[#f0eee8] hover:bg-[#ebe8e2] active:scale-[0.98] transition-all rounded-xl p-3 flex items-center justify-between text-left group cursor-pointer border border-[#c1c8c2]/30 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#a73918] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {onOpenQrTag ? '3' : '2'}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#1c1c18]">
                    Enviar mensaje directo a {lot.producerName.split(' ')[0]} {lot.producerName.split(' ')[1] || ''}
                  </p>
                  <p className="text-[11px] text-[#424843]">
                    Vía Raíz con traducción opcional
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#727973] group-hover:text-[#032517] transition-colors">
                chevron_right
              </span>
            </button>
          </div>

          {/* Pricing & Purchase Area */}
          <div className="mt-1 pt-3 border-t border-[#f0eee8] flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[12px] text-[#424843] block">
                  Precio sugerido de comercio justo
                </span>
                <span className="text-[26px] font-bold text-[#032517]">
                  ${lot.pricePerKg.toFixed(2)}{' '}
                  <span className="text-[14px] font-normal text-[#424843]">MXN / kg</span>
                </span>
              </div>
              <span className="text-[12px] bg-[#c7ebd4] px-3 py-1 rounded-full text-[#002113] font-bold">
                Garantía Directa
              </span>
            </div>

            <button
              type="button"
              onClick={handleBuyLot}
              className="min-h-[50px] w-full bg-[#a73918] hover:bg-[#6c1900] active:scale-[0.98] transition-all text-white rounded-full text-[16px] flex items-center justify-center gap-2 shadow-sm font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Comprar este Lote Verificado
            </button>

            <button
              type="button"
              onClick={() => onDirectMessageProducer(lot.producerName)}
              className="min-h-[48px] w-full border-2 border-[#032517] text-[#032517] hover:bg-[#c7ebd4]/20 active:scale-[0.98] transition-all rounded-full text-[15px] flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Solicitar Muestra o Cotización por Bulto
            </button>

            <button
              type="button"
              onClick={() => onNavigateScreen('vitrina_productos')}
              className="min-h-[44px] w-full bg-[#f6f3ed] hover:bg-[#ebe8e2] text-[#032517] active:scale-[0.98] transition-all rounded-full text-[14px] flex items-center justify-center gap-2 font-semibold cursor-pointer border border-[#c1c8c2]/50"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              Explorar otros productos y lotes en la Vitrina
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
