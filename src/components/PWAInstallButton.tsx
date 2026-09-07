import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Sparkles, X, Share2, PlusSquare, Smartphone, CheckCircle, ArrowDownToLine } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'floating' | 'header-arrow' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, hasNativePrompt, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [justInstalledToast, setJustInstalledToast] = useState<boolean>(false);

  // If already running as installed PWA, hide the button completely from the UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const success = await install();
      if (success) {
        setJustInstalledToast(true);
        setTimeout(() => setJustInstalledToast(false), 4000);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Visual variant: HEADER ARROW (Flechita de descarga junto a Online) */}
      {(variant === 'header-arrow' || variant === 'icon') && (
        <button
          id="btn-download-arrow-header"
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] font-extrabold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-full border border-amber-500/80 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Descargar e instalar la app en tu teléfono celular"
        >
          <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Descargar App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* Visual variant: NAV button */}
      {variant === 'nav' && (
        <button
          id="btn-pwa-install-nav"
          type="button"
          onClick={handleInstallClick}
          className="group relative inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 rounded-xl shadow-xs hover:shadow-md transition-all border border-amber-400/40 shrink-0 cursor-pointer animate-pulse-slow"
          title="Descargar aplicación en tu celular o computadora para usar sin conexión"
        >
          {/* Costa Rica / Spain Flags + Airplane mini badge */}
          <div className="flex items-center gap-0.5">
            <span className="text-xs">🇨🇷</span>
            <span className="text-[10px] text-amber-200">✈️</span>
            <span className="text-xs">🇪🇸</span>
          </div>

          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar App</span>
            <span className="sm:hidden">Instalar</span>
          </span>
        </button>
      )}

      {/* Visual variant: BANNER in main dashboard */}
      {variant === 'banner' && (
        <div
          id="pwa-install-banner"
          className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-md relative overflow-hidden"
        >
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Airplane Logo with Costa Rica & Spain flags */}
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 border border-amber-400/40 p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/icon.svg"
                  alt="Logo Costa Rica a España 2026"
                  className="w-11 h-11 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950 px-2 py-0.5 rounded-md">
                    App PWA Descargable
                  </span>
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    🇨🇷 Costa Rica ✈️ España 🇪🇸
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Descarga el Itinerario en tu Celular
                </h3>
                <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
                  Funciona 100% sin conexión a internet en España. Tendrás tus entradas, alertas de 3h/4h y el progreso de los 5 viajeros siempre a mano.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>Descargar / Instalar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS & Browser Install Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 relative overflow-hidden">
            {/* Header with App Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <img
                  src="/icon.svg"
                  alt="Logo"
                  className="w-12 h-12 rounded-2xl shadow-xs border border-stone-200 p-0.5 bg-stone-900"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Instalar España 2026
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                    🇨🇷 Costa Rica ➔ España 🇪🇸
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content for iOS vs Android/Desktop */}
            <div className="py-4 space-y-3.5">
              {isIOS ? (
                <>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    Para instalar la aplicación en tu <strong>iPhone o iPad</strong> y tenerla en tu pantalla de inicio como una app normal:
                  </p>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-stone-800">
                        Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-1" /> en la barra inferior de Safari.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-stone-800">
                        Desplaza hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-stone-700 mx-1" />.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-stone-800">
                        Toca <strong>"Agregar"</strong> en la esquina superior derecha ¡y listo!
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Instala la aplicación en tu dispositivo <strong>Android, PC o Mac</strong> para acceder rápidamente desde tu pantalla principal y usarla sin internet:
                  </p>

                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                      <Smartphone className="w-4 h-4 text-amber-500" />
                      En Android / Google Chrome:
                    </div>
                    <p className="text-xs text-stone-600 pl-6">
                      Toca el menú de 3 puntos (⋮) en la esquina superior y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Una vez descargada, este botón se ocultará automáticamente.</span>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('pwa_app_installed_status_v1', 'true');
                  setShowModal(false);
                  window.location.reload();
                }}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Ocultar este botón si ya tienes la app en tu pantalla de inicio"
              >
                Ya la tengo instalada
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                {hasNativePrompt && (
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await install();
                      if (success) {
                        setJustInstalledToast(true);
                        setShowModal(false);
                        setTimeout(() => setJustInstalledToast(false), 4000);
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-stone-950" />
                    <span>Instalar Ahora</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {justInstalledToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-white" />
          <div>
            <div className="text-xs font-bold">¡Aplicación instalada con éxito!</div>
            <div className="text-[11px] text-emerald-100">Ya está lista en tu pantalla de inicio.</div>
          </div>
        </div>
      )}
    </>
  );
};
