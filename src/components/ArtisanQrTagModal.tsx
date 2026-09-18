import React, { useRef } from 'react';
import { DigitalPassportLot } from '../types';

interface ArtisanQrTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: DigitalPassportLot;
}

/**
 * Printable Artisan / Micro-lot Authenticity Tag with Scannable QR Code.
 * Tailored for physical attachment to artisanal textiles, coffee bags,
 * honey jars, or palm hats.
 */
export const ArtisanQrTagModal: React.FC<ArtisanQrTagModalProps> = ({
  isOpen,
  onClose,
  lot
}) => {
  const printableTagRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const qrPayloadUrl = `${window.location.origin}/?cert=MX-${lot.code}`;
  // Standard SVG QR generation via public QR API
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrPayloadUrl
  )}&margin=6&color=032517`;

  const handlePrint = () => {
    window.print();
  };

  const isArtisanItem =
    lot.variety.toLowerCase().includes('telar') ||
    lot.variety.toLowerCase().includes('palma') ||
    lot.variety.toLowerCase().includes('textil') ||
    lot.title.toLowerCase().includes('rebozo') ||
    lot.title.toLowerCase().includes('sombrero') ||
    lot.title.toLowerCase().includes('telar');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#c1c8c2]/60 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#fcf9f3] border-b border-[#c1c8c2]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a73918] text-[22px]">
              qr_code_2
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-[#032517]">
                Etiqueta QR de Autenticidad
              </h3>
              <p className="text-[11px] text-[#424843]">
                {isArtisanItem ? 'Para coser o colgar a la pieza' : 'Para colgar al bulto de cosecha'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0eee8] hover:bg-[#ebe8e2] active:scale-90 text-[#1c1c18] flex items-center justify-center cursor-pointer transition-all"
            aria-label="Cerrar modal de etiqueta"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Physical Tag Preview Card (Designed like a luxury craft hang-tag) */}
        <div className="p-5 overflow-y-auto flex flex-col items-center bg-[#f6f3ed]/60">
          <div
            ref={printableTagRef}
            className="w-full bg-[#fcf9f3] border-2 border-dashed border-[#a73918]/60 rounded-2xl p-4.5 shadow-md flex flex-col items-center text-center relative"
          >
            {/* Punch Hole for String/Rope */}
            <div className="w-4 h-4 rounded-full bg-white border-2 border-[#a73918]/50 shadow-inner -mt-1 mb-2 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c1c8c2]" />
            </div>

            {/* TecNM & Raíz Header */}
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#032517] tracking-wider uppercase">
              <span className="text-[#a73918]">●</span>
              <span>Raíz Mixteca · TecNM Tlaxiaco</span>
              <span className="text-[#a73918]">●</span>
            </div>

            <p className="text-[10px] text-[#424843] font-medium tracking-tight mt-0.5">
              Certificado de Origen y Trazabilidad Inmutable
            </p>

            {/* QR Code Container */}
            <div className="my-3 bg-white p-2.5 rounded-xl border border-[#c1c8c2]/50 shadow-2xs">
              <img
                src={qrImageSrc}
                alt={`Código QR para el lote ${lot.code}`}
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="text-[11px] font-mono font-black text-[#a73918] bg-[#ffdbd1]/80 px-2.5 py-0.5 rounded-full tracking-wider mb-2">
              FOLIO: MX-{lot.code}
            </div>

            {/* Artisan & Piece Info */}
            <div className="w-full bg-white rounded-xl p-2.5 border border-[#c1c8c2]/40 text-left space-y-1 mb-2">
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-[#5e6660] font-medium">Obra / Producto:</span>
                <span className="font-bold text-[#032517] truncate max-w-[170px]">
                  {lot.title}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-[#5e6660] font-medium">Autor(a):</span>
                <span className="font-bold text-[#032517] truncate max-w-[170px]">
                  {lot.producerName}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-[#5e6660] font-medium">Comunidad:</span>
                <span className="font-semibold text-[#032517]">{lot.location}</span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-[#5e6660] font-medium">Sellado en:</span>
                <span className="font-mono text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Soroban / Stellar
                </span>
              </div>
            </div>

            {/* Buyer Instructions */}
            <p className="text-[10.5px] text-[#424843] leading-tight italic px-1">
              "Escanea con la cámara de tu celular para escuchar la voz del autor(a), conocer la técnica ancestral y certificar origen sin intermediarios."
            </p>
          </div>

          <p className="text-[11px] text-[#727973] mt-3 text-center">
            Diseñada con medidas estándar para impresión térmica o cartulina kraft de taller.
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-white border-t border-[#c1c8c2]/30 flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full h-11 bg-[#032517] hover:bg-[#1b3b2b] text-white rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px] text-emerald-300">print</span>
            <span>Imprimir Etiqueta para Colgar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const shareText = `🏷️ *ETIQUETA DE AUTENTICIDAD - RAÍZ TLAXIACO*\n\n` +
                `*Obra:* ${lot.title}\n` +
                `*Autor(a):* ${lot.producerName}\n` +
                `*Comunidad:* ${lot.location}\n` +
                `*Folio:* MX-${lot.code}\n` +
                `*Verificar en línea:* ${qrPayloadUrl}`;
              const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="w-full h-10 border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-full font-bold text-[13px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-700">share</span>
            <span>Compartir Enlace QR por WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 text-[#5e6660] hover:text-[#032517] font-semibold text-[13px] cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};
