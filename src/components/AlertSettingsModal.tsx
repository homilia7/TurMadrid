import React, { useState } from 'react';
import { Bell, Clock, Volume2, VolumeX, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import {
  playChimeSound,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../utils/alertManager';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAlertHours: number;
  onSaveDefaultAlertHours: (hours: number, applyToAllTours: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

const PRESET_HOURS = [
  { value: 1, label: '1 hora antes', desc: 'Aviso rápido justo antes' },
  { value: 2, label: '2 horas antes', desc: 'Ideal para desplazamientos cortos' },
  { value: 3, label: '3 horas antes', desc: 'Recomendado para tours de ciudad' },
  { value: 4, label: '4 horas antes', desc: 'Ideal para excursiones lejanas y trenes' },
  { value: 5, label: '5 horas antes', desc: 'Tiempo amplio de preparación' },
  { value: 12, label: '12 horas antes', desc: 'Aviso la noche previa' },
];

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultAlertHours,
  onSaveDefaultAlertHours,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(defaultAlertHours);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testSent, setTestSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      sendBrowserNotification(
        '🔔 Alertas de Tour Activadas',
        `Te avisaremos con ${selectedHours} horas de anticipación antes de cada recorrido.`
      );
      playChimeSound();
    }
  };

  const handleTestNotification = () => {
    if (soundEnabled) {
      playChimeSound();
    }
    sendBrowserNotification(
      '🔔 Notificación de Prueba',
      `¡Alerta de Tour! Falta poco para tu recorrido a Toledo / Segovia. Revisa punto de encuentro y entradas.`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    onSaveDefaultAlertHours(selectedHours, applyToAll);
    onClose();
  };

  return (
    <div id="alert-settings-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div id="alert-settings-modal-card" className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Configuración de Alertas Previas</h3>
              <p className="text-xs text-stone-600">Aviso automático antes del inicio de cada tour o traslado</p>
            </div>
          </div>
          <button
            id="close-alert-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main prompt requirement: 3 horas o 4 horas antes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Tiempo de Anticipación de la Alerta:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_HOURS.map((preset) => {
                const isSelected = selectedHours === preset.value;
                const isHighlight = preset.value === 3 || preset.value === 4;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSelectedHours(preset.value)}
                    className={`relative p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-sm text-stone-900">
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-stone-500 line-clamp-1">{preset.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-700">Horas personalizadas:</span>
              <p className="text-[11px] text-stone-500">Introduce el número exacto de horas antes del tour</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="input-custom-alert-hours"
                type="number"
                min="1"
                max="72"
                value={selectedHours}
                onChange={(e) => setSelectedHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center font-bold text-stone-800 bg-white border border-stone-300 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="text-xs font-medium text-stone-500">horas</span>
            </div>
          </div>

          {/* Apply to existing tours option */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-100/50 transition-colors">
            <input
              id="checkbox-apply-all-tours"
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-0.5 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
            />
            <div className="text-xs">
              <span className="font-semibold text-stone-800">Actualizar todos los tours del itinerario</span>
              <p className="text-stone-500 mt-0.5">
                Aplica este tiempo ({selectedHours} horas antes) a todos los tours y excursiones programados actualmente.
              </p>
            </div>
          </label>

          {/* Sound alert and Browser notifications */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-800">Sonido de Campana</div>
                  <div className="text-[11px] text-stone-500">Chime suave al activarse la alerta</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  onToggleSound(next);
                  if (next) playChimeSound();
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  soundEnabled ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {soundEnabled ? 'Activado' : 'Silenciado'}
              </button>
            </div>

            {/* Native browser notifications permission button */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-stone-500" />
                <div>
                  <div className="text-xs font-semibold text-stone-800">Notificaciones del Navegador</div>
                  <div className="text-[11px] text-stone-500">
                    Estado actual: <span className="font-bold capitalize">{notificationStatus}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notificationStatus !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                  >
                    Habilitar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {testSent ? '¡Probado!' : 'Probar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            id="save-alert-settings-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
