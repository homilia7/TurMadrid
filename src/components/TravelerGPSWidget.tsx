import React, { useState } from 'react';
import {
  Navigation,
  Radio,
  MapPin,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Battery
} from 'lucide-react';
import { LiveLocationShare } from '../types';

interface TravelerGPSWidgetProps {
  isTracking: boolean;
  currentLocation: LiveLocationShare | null;
  accuracy: number | null;
  lastSyncTime: string | null;
  error: string | null;
  travelerName: string;
  travelerColor: string;
  onToggleTracking: () => void;
  onRefreshLocation: () => void;
}

export const TravelerGPSWidget: React.FC<TravelerGPSWidgetProps> = ({
  isTracking,
  currentLocation,
  accuracy,
  lastSyncTime,
  error,
  travelerName,
  travelerColor,
  onToggleTracking,
  onRefreshLocation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshLocation();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all">
      {/* Main Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white shadow-xs shrink-0 transition-all ${
              isTracking
                ? 'bg-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-100 animate-pulse'
                : 'bg-stone-300'
            }`}
          >
            <Navigation className={`w-5 h-5 ${isTracking ? 'text-white' : 'text-stone-600'}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-stone-950">
                GPS en Vivo a Familiares
              </span>
              {isTracking ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>Transmitiendo</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                  Pausado
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 truncate mt-0.5 font-medium">
              {isTracking && currentLocation?.placeName
                ? `📍 ${currentLocation.placeName}`
                : isTracking
                ? 'Buscando satélites GPS...'
                : 'Toca activar para que tu familia vea tu ubicación en el mapa'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTracking}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
              isTracking
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-500/60 ring-2 ring-amber-300/40'
            }`}
          >
            {isTracking ? 'Pausar GPS' : 'Activar GPS'}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title={isExpanded ? 'Ocultar detalles' : 'Ver detalles de telemetría'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Expanded Telemetry Details */}
      {isExpanded && (
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 space-y-3 animate-in fade-in text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Precisión</span>
              <span className="font-black text-stone-900">
                {accuracy ? `± ${accuracy} metros` : 'Buscando...'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Último Envío</span>
              <span className="font-black text-stone-900">
                {lastSyncTime || 'Pendiente'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Frecuencia</span>
              <span className="font-black text-stone-900">Cada 15s</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Batería</span>
              <span className="font-black text-emerald-700 flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" />
                <span>{currentLocation?.batteryLevel ? `${currentLocation.batteryLevel}%` : 'Conectado'}</span>
              </span>
            </div>
          </div>

          {currentLocation?.lat && currentLocation?.lng && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="truncate font-mono text-[11px] text-stone-600">
                Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span>{isRefreshing ? 'Actualizando...' : 'Actualizar Ya'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Privado y seguro. Tu posición solo es visible para tu familia en el portal TurEuropa.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
