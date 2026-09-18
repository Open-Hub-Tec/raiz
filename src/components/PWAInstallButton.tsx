import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, isIOS, installPWA } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  if (isInstalled || !canInstall) {
    return null;
  }

  const handleClick = () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      installPWA();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1b3b2b] hover:bg-[#032517] text-white text-[12px] font-bold rounded-full shadow-xs transition-colors cursor-pointer"
        title="Instalar App en tu celular para usar sin internet"
      >
        <span className="material-symbols-outlined text-[16px] text-amber-300">install_mobile</span>
        <span>Instalar App</span>
      </button>

      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fcf9f3] p-5 rounded-2xl max-w-xs w-full text-[#1c1c18] border border-[#c1c8c2] shadow-xl">
            <h3 className="font-extrabold text-[16px] text-[#032517] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600">smartphone</span>
              Instalar en iPhone / iPad
            </h3>
            <p className="text-[13px] text-[#424843] mb-4 leading-relaxed">
              Para usar Raíz Mixteca en la parcela sin internet:
            </p>
            <ol className="text-[12px] space-y-2 text-[#1c1c18] mb-4 list-decimal list-inside bg-white p-3 rounded-xl border border-[#c1c8c2]/40">
              <li>Toca el botón <strong>Compartir</strong> <span className="text-[14px]">⎋</span> abajo en Safari.</li>
              <li>Baja y selecciona <strong>"Agregar a pantalla de inicio"</strong> (+).</li>
            </ol>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2 bg-[#032517] text-white font-bold text-[13px] rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
