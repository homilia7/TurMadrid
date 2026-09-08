import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  X,
  Share2,
  PlusSquare,
  Smartphone,
  CheckCircle,
  ArrowDownToLine,
  Copy,
  AlertTriangle,
  Sparkles,
  Bell,
} from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'floating' | 'header-arrow' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { hasNativePrompt, isInstalled, isIOS, isInAppBrowser, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [justInstalledToast, setJustInstalledToast] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isFloatingDismissed, setIsFloatingDismissed] = useState<boolean>(false);

  // If already running as installed standalone app on phone, hide the install buttons completely
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    // Proactively request browser notification permission so family members receive trip alerts
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.log('Notification permission request error:', e);
      }
    }

    if (hasNativePrompt) {
      const success = await install();
      if (success) {
        setJustInstalledToast(true);
        setTimeout(() => setJustInstalledToast(false), 4500);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleTriggerIOSShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TurMadrid - Itinerario España 2026',
          text: 'Descarga el itinerario España 2026 en tu iPhone para recibir notificaciones en vivo',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Native share closed or not supported:', err);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <>
      {/* Visual variant: HEADER BUTTON (En barra superior para móvil y desktop) */}
      {(variant === 'header-arrow' || variant === 'icon') && (
        <button
          id="btn-download-header"
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:bg-amber-500 rounded-xl border border-amber-500/80 shadow-xs transition-all cursor-pointer shrink-0 animate-bounce-subtle"
          title="Descargar la aplicación en tu celular para recibir notificaciones en vivo"
        >
          <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Descargar App</span>
          <span className="sm:hidden">Descargar</span>
        </button>
      )}

      {/* Visual variant: NAV button */}
      {variant === 'nav' && (
        <button
          id="btn-install-nav"
          type="button"
          onClick={handleInstallClick}
          className="group relative inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 rounded-xl shadow-xs hover:shadow-md transition-all border border-amber-400/40 shrink-0 cursor-pointer"
          title="Descargar aplicación en tu celular o computadora para recibir notificaciones"
        >
          <div className="flex items-center gap-0.5">
            <span className="text-xs">🇨🇷</span>
            <span className="text-[10px] text-amber-200">✈️</span>
            <span className="text-xs">🇪🇸</span>
          </div>

          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Descargar App</span>
            <span className="sm:hidden">Descargar</span>
          </span>
        </button>
      )}

      {/* Visual variant: BANNER in main dashboard (ideal para familiares que abren el link) */}
      {variant === 'banner' && (
        <div
          id="install-banner-family"
          className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-md relative overflow-hidden"
        >
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Logo with Costa Rica & Spain flags */}
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
                    Aplicación Móvil Oficial
                  </span>
                  <span className="text-xs bg-stone-700/80 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-400/30 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-400" />
                    Notificaciones en Vivo
                  </span>
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    🇨🇷 Costa Rica ✈️ España 🇪🇸
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Descarga la App para Seguir el Viaje en Vivo
                </h3>
                <p className="text-xs text-stone-300 mt-0.5 max-w-xl leading-relaxed">
                  Familiares y amigos: instala la aplicación en tu celular para recibir notificaciones sobre los vuelos, alertas de tours y el recorrido de Jessica, Mayela, Vilma, Mercedes y Angelica en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span>Descargar Aplicación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Download Bar for Family / Visitors */}
      {!isInstalled && !isFloatingDismissed && (
        <div
          id="family-download-floating-bar"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-stone-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl border border-amber-400/50 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-amber-400 truncate flex items-center gap-1.5">
                <span>¿Sigues el viaje?</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">Familia</span>
              </div>
              <div className="text-[11px] text-stone-300 truncate">
                Descarga la app para recibir notificaciones
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <span>Descargar</span>
              <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsFloatingDismissed(true)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Ocultar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Guía de Descarga e Instalación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-stone-900">
                      Descargar España 2026
                    </h3>
                    {isIOS && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full font-extrabold border border-amber-300">
                        iPhone / iPad
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                    🇨🇷 Costa Rica ➔ España 🇪🇸 • Notificaciones en Vivo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* Warning if inside In-App Browser on iOS (WhatsApp, Facebook, etc.) */}
              {isIOS && isInAppBrowser && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-400/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Estás en el navegador interno (WhatsApp / Red Social)</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Para instalar y recibir avisos, abre el enlace en <strong>Safari</strong>:
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                    <span className="text-[11px] text-stone-500 flex items-center">
                      Pega la dirección en Safari.
                    </span>
                  </div>
                </div>
              )}

              {/* iOS Specific Instructions */}
              {isIOS ? (
                <>
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-amber-600" />
                        Pasos para descargar en tu iPhone:
                      </div>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                        Navegador Safari
                      </span>
                    </div>

                    {/* Step 1 */}
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-stone-800 leading-relaxed">
                        Toca el botón <strong>Compartir</strong>{' '}
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 border border-blue-200 text-blue-600 align-middle mx-1">
                          <Share2 className="w-3.5 h-3.5" />
                        </span>{' '}
                        en la <strong>barra inferior de Safari</strong> (o pulsa el botón directo abajo).
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-stone-800 leading-relaxed">
                        En el menú que se despliega, baja y pulsa{' '}
                        <strong>"Agregar a pantalla de inicio"</strong>{' '}
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-stone-100 border border-stone-300 text-stone-800 align-middle mx-1">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </span>.
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-stone-800 leading-relaxed">
                        Pulsa <strong>"Agregar"</strong> arriba a la derecha. ¡La aplicación aparecerá en tu pantalla principal lista para recibir notificaciones!
                      </div>
                    </div>
                  </div>

                  {/* Direct Native Share Trigger for iOS */}
                  {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
                    <div className="bg-stone-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                      <div className="text-left">
                        <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Acceso Directo en iPhone
                        </div>
                        <p className="text-[11px] text-stone-300 mt-0.5">
                          Abre el menú de compartir de iOS de inmediato:
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTriggerIOSShare}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer shrink-0 shadow-sm"
                      >
                        <Share2 className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                        <span>Abrir Menú y Descargar</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Android / Desktop Browser Guide */
                <>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Instala la aplicación en tu dispositivo <strong>Android, PC o Mac</strong> para recibir notificaciones de los vuelos y avisos del viaje:
                  </p>

                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                      <Smartphone className="w-4 h-4 text-amber-500" />
                      En Android / Google Chrome:
                    </div>
                    <p className="text-xs text-stone-600 pl-6">
                      Toca el botón <strong>"Descargar Ahora"</strong> abajo o ve al menú de 3 puntos (⋮) y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Al abrir la aplicación desde tu pantalla de inicio, tendrás alertas de vuelos y tours en tiempo real.</span>
              </div>
            </div>

            {/* Footer actions with functional download button */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="order-2 sm:order-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>

              <div className="order-1 sm:order-2 flex items-center gap-2">
                {/* Notification Request button if supported and not granted */}
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const perm = await Notification.requestPermission();
                      if (perm === 'granted') {
                        setJustInstalledToast(true);
                        setTimeout(() => setJustInstalledToast(false), 3500);
                      }
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-stone-700"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Activar Avisos</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    // Try to request notification permissions as well
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                      try {
                        await Notification.requestPermission();
                      } catch {}
                    }

                    if (hasNativePrompt) {
                      const success = await install();
                      if (success) {
                        setJustInstalledToast(true);
                        setShowModal(false);
                        setTimeout(() => setJustInstalledToast(false), 4000);
                      }
                    } else if (isIOS) {
                      await handleTriggerIOSShare();
                    } else {
                      setShowModal(false);
                      setJustInstalledToast(true);
                      setTimeout(() => setJustInstalledToast(false), 4000);
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                  <span>{hasNativePrompt ? 'Descargar Ahora' : isIOS ? 'Abrir y Descargar' : 'Descargar Aplicación'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {justInstalledToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-white shrink-0" />
          <div>
            <div className="text-xs font-bold">¡Aplicación lista y notificaciones activadas!</div>
            <div className="text-[11px] text-emerald-100">Recibirás todas las alertas del viaje en tu celular.</div>
          </div>
        </div>
      )}
    </>
  );
};


