import React, { useState, useEffect } from 'react';
import { DigitalPassportLot } from '../types';

interface MyLotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: DigitalPassportLot[];
  onSelectLot: (lot: DigitalPassportLot) => void;
  onRegisterNewLot: () => void;
  onOpenQrTag?: (lot: DigitalPassportLot) => void;
}

export const MyLotsModal: React.FC<MyLotsModalProps> = ({
  isOpen,
  onClose,
  lots,
  onSelectLot,
  onRegisterNewLot,
  onOpenQrTag
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#fcf9f3] rounded-3xl overflow-hidden shadow-2xl border border-[#c1c8c2]/50 max-h-[88vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#c1c8c2]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ffdbd1] text-[#a73918] flex items-center justify-center font-bold text-[18px]">
              2
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#032517]">Mis Lotes en Acopio</h3>
              <p className="text-[12px] text-[#424843]">{lots.length} lotes registrados activos en Mixteca</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f0eee8] hover:bg-[#ebe8e2] active:scale-90 text-[#1c1c18] flex items-center justify-center cursor-pointer transition-all"
            aria-label="Cerrar modal de lotes"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {lots.map((lot) => (
            <div
              key={lot.id}
              onClick={() => {
                onSelectLot(lot);
                onClose();
              }}
              className="bg-white rounded-2xl p-3.5 border border-[#c1c8c2]/40 hover:border-[#a73918] transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
            >
              <div className="flex gap-3">
                <img
                  src={lot.imageUrl}
                  alt={lot.title}
                  className="w-18 h-18 rounded-xl object-cover bg-[#f0eee8] shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#a73918] uppercase">
                      Lote #{lot.code}
                    </span>
                    <span className="text-[11px] bg-[#c7ebd4] text-[#002113] font-bold px-2 py-0.5 rounded-full">
                      {lot.verifiedStatus.includes('Verificado') ? 'Verificado' : 'Aprobado'}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-bold text-[#032517] leading-snug mt-0.5 group-hover:text-[#a73918] transition-colors">
                    {lot.title}
                  </h4>
                  <p className="text-[12px] text-[#424843] mt-1">
                    {lot.volumeKg} kg · ${lot.pricePerKg} MXN/kg
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#f0eee8] flex items-center justify-between text-[12px]">
                <span className="text-[#424843] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#a73918]">pin_drop</span>
                  {lot.location}
                </span>
                <div className="flex items-center gap-2">
                  {onOpenQrTag && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrTag(lot);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#a73918] font-bold text-[11px] flex items-center gap-1 border border-amber-300/60 transition-all cursor-pointer"
                      title="Ver e imprimir etiqueta QR de este lote"
                    >
                      <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                      <span>Etiqueta QR</span>
                    </button>
                  )}
                  <span className="font-bold text-[#032517] flex items-center gap-0.5 group-hover:underline">
                    Ver Pasaporte
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#c1c8c2]/30 flex flex-col gap-2">
          {onRegisterNewLot && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegisterNewLot();
              }}
              className="w-full h-11 bg-[#a73918] hover:bg-[#6c1900] text-white rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
              <span>Registrar un Nuevo Lote de Cosecha</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 border border-[#c1c8c2] text-[#424843] hover:bg-[#f0eee8] rounded-full font-bold text-[13px] active:scale-98 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
