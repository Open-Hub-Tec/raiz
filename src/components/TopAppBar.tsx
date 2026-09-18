import React from 'react';
import { AppLanguage, NavigationTab, ScreenView } from '../types';

interface TopAppBarProps {
  currentTab: NavigationTab;
  currentScreen: ScreenView;
  onNavigateScreen: (screen: ScreenView) => void;
  onOpenCart?: () => void;
  onOpenMicDiagnostic?: () => void;
  cartCount: number;
  appLanguage?: AppLanguage;
  onToggleLanguage?: () => void;
  elderMode?: boolean;
  onToggleElderMode?: () => void;
  isOnline?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTab,
  currentScreen,
  onNavigateScreen,
  onOpenCart,
  onOpenMicDiagnostic,
  cartCount,
  appLanguage = 'es',
  onToggleLanguage,
  elderMode = false,
  onToggleElderMode,
  isOnline = true
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#fcf9f3] border-b border-[#c1c8c2]/30 px-3 py-2 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-1.5">
        {currentScreen === 'registrar_lote_cafe' ? (
          <button
            type="button"
            onClick={() => onNavigateScreen('catalogo_producto')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#032517] hover:bg-[#ebe8e2] transition-colors active:scale-95"
            title="Volver a seleccionar producto"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        ) : currentScreen === 'catalogo_producto' ? (
          <button
            type="button"
            onClick={() => onNavigateScreen('menu_principal')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#032517] hover:bg-[#ebe8e2] transition-colors active:scale-95"
            title="Volver al Menú Principal"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        ) : currentScreen === 'pasaporte_digital' ? (
          <button
            type="button"
            onClick={() => onNavigateScreen('menu_principal')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#032517] hover:bg-[#ebe8e2] transition-colors active:scale-95"
            title="Volver al Menú Principal"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateScreen('menu_principal')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#032517] hover:bg-[#ebe8e2] transition-colors active:scale-95"
            title="Ir al Menú Principal"
          >
            <span className="material-symbols-outlined text-[24px]">signal_cellular_alt</span>
          </button>
        )}

        <div>
          <h1 className="text-[18px] font-extrabold text-[#032517] tracking-tight leading-tight flex items-center gap-1">
            <span>Raíz</span>
            <span className="text-[10px] bg-[#c7ebd4] text-[#002b18] px-1.5 py-0.2 rounded-md font-bold uppercase">
              Mixteca
            </span>
          </h1>
          <div className="flex items-center gap-1 -mt-0.5">
            {!isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-[11px] font-extrabold text-[#a73918]">
                  {appLanguage === 'mix' ? '🏕️ Ñu’u (Offline)' : '🏕️ Modo Parcela'}
                </span>
              </>
            ) : currentTab === 'menu' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-[#032517]">
                  {appLanguage === 'mix' ? '🟢 Tu’un Savi' : '🟢 En Línea'}
                </span>
              </>
            ) : currentTab === 'chat' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#fe7952] animate-pulse"></span>
                <span className="text-[11px] text-[#424843] font-medium">
                  {appLanguage === 'mix' ? 'Tu’un Bot' : 'Asistente Comunitario'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#fe7952]"></span>
                <span className="text-[11px] text-[#424843] font-medium">Tienda Artesanal</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Toggle Language Mixteco (Tu'un Savi) / Español */}
        {onToggleLanguage && (
          <button
            type="button"
            onClick={onToggleLanguage}
            className={`px-2 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
              appLanguage === 'mix'
                ? 'bg-[#1b3b2b] text-amber-200 border-[#1b3b2b]'
                : 'bg-white text-[#032517] border-[#c1c8c2] hover:bg-[#f0eee8]'
            }`}
            title="Cambiar idioma: Español / Tu'un Savi (Mixteco)"
            aria-label="Cambiar idioma a Tu'un Savi Mixteco"
          >
            <span>🗣️</span>
            <span>{appLanguage === 'mix' ? "Tu'un Savi" : 'Español'}</span>
          </button>
        )}

        {/* Toggle Elder Mode / Letra Grande */}
        {onToggleElderMode && (
          <button
            type="button"
            onClick={onToggleElderMode}
            className={`px-2 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer flex items-center gap-0.5 ${
              elderMode
                ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                : 'bg-white text-[#424843] border-[#c1c8c2] hover:bg-[#f0eee8]'
            }`}
            title="Modo Abuelo: Letras más grandes y asistencia por voz automática"
            aria-label="Alternar Modo Letra Grande"
          >
            <span className="text-[13px]">🧓🏽</span>
            <span>{elderMode ? 'Grande' : 'Normal'}</span>
          </button>
        )}

        {/* Mic Test / Diagnostics button */}
        {onOpenMicDiagnostic && (
          <button
            type="button"
            onClick={onOpenMicDiagnostic}
            className="w-9 h-9 rounded-full bg-[#f0eee8] text-[#032517] hover:bg-[#e0ded8] flex items-center justify-center transition-all active:scale-95 border border-[#c1c8c2]/40"
            title="Probar y Diagnosticar Micrófono"
            aria-label="Probar y Diagnosticar Micrófono"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        )}

        {/* Shopping Cart button */}
        <button
          type="button"
          onClick={onOpenCart}
          className="relative w-9 h-9 rounded-full bg-[#1b3b2b] text-white flex items-center justify-center shadow-sm hover:bg-[#032517] transition-all active:scale-95"
          aria-label="Ver bolsa de productos"
        >
          <span className="material-symbols-outlined text-[18px]">local_mall</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#a73918] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#fcf9f3]">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
