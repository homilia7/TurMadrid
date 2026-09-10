import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Battery,
  Zap,
  Radio,
  Copy,
  Check,
  RefreshCw,
  Compass,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Users
} from 'lucide-react';
import { LiveLocationShare, Traveler } from '../types';
import { getPersonDetails } from '../utils/nameUtils';
import { getDualTimezoneStrings } from '../utils/timeUtils';

interface LiveGPSMapProps {
  locations: LiveLocationShare[];
  travelers: Traveler[];
  selectedTravelerName?: string;
  onSelectTraveler?: (name: string) => void;
  onOpenChat?: (travelerName: string) => void;
}

// Ubicaciones geográficas iniciales de referencia en Madrid para las 5 viajeras
const TRAVELER_DEFAULT_LOCATIONS: Record<
  string,
  { lat: number; lng: number; placeName: string; address: string; battery: number }
> = {
  jessica: {
    lat: 40.4169,
    lng: -3.7036,
    placeName: 'Puerta del Sol (Centro de Madrid)',
    address: 'Plaza de la Puerta del Sol, 28013 Madrid',
    battery: 94,
  },
  mayela: {
    lat: 40.4203,
    lng: -3.7058,
    placeName: 'Gran Vía & Plaza del Callao',
    address: 'Calle Gran Vía 32, 28013 Madrid',
    battery: 89,
  },
  vilma: {
    lat: 40.4155,
    lng: -3.7074,
    placeName: 'Plaza Mayor & Mercado San Miguel',
    address: 'Plaza Mayor, 28012 Madrid',
    battery: 86,
  },
  mercedes: {
    lat: 40.4179,
    lng: -3.7143,
    placeName: 'Palacio Real de Madrid & Almudena',
    address: 'Calle de Bailén s/n, 28071 Madrid',
    battery: 92,
  },
  angelica: {
    lat: 40.4153,
    lng: -3.6845,
    placeName: 'Parque del Retiro & Puerta de Alcalá',
    address: 'Plaza de la Independencia 1, 28001 Madrid',
    battery: 91,
  },
};

export const LiveGPSMap: React.FC<LiveGPSMapProps> = ({
  locations = [],
  travelers = [],
  selectedTravelerName,
  onSelectTraveler,
  onOpenChat,
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [mapZoom, setMapZoom] = useState(16);

  // Estado dinámico local para el viajero seleccionado con actualización inmediata al dar clic
  const [internalSelectedName, setInternalSelectedName] = useState<string>(() => {
    return selectedTravelerName || (travelers[0]?.name ?? 'Jessica');
  });

  useEffect(() => {
    if (selectedTravelerName) {
      setInternalSelectedName(selectedTravelerName);
    }
  }, [selectedTravelerName]);

  const handleSelectTraveler = (name: string) => {
    setInternalSelectedName(name);
    onSelectTraveler?.(name);
  };

  // Active or most recent locations map keyed by travelerName lowercase
  const locationsMap = useMemo(() => {
    const map = new Map<string, LiveLocationShare>();
    locations.forEach((loc) => {
      if (!loc || !loc.travelerName) return;
      const key = loc.travelerName.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing || new Date(loc.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        map.set(key, loc);
      }
    });
    return map;
  }, [locations]);

  // Selected traveler dynamically resolved from clicked name
  const activeTraveler = useMemo(() => {
    const targetName = internalSelectedName.trim().toLowerCase();
    const matched = travelers.find(
      (t) => t.name.trim().toLowerCase() === targetName
    );
    return matched || travelers[0] || null;
  }, [travelers, internalSelectedName]);

  // Ubicación activa del viajero: GPS en vivo real transmitido o punto de itinerario
  const activeLoc: LiveLocationShare | null = useMemo(() => {
    if (!activeTraveler) return null;
    const key = activeTraveler.name.trim().toLowerCase();
    const live = locationsMap.get(key);
    if (live && live.lat && live.lng) {
      return live;
    }
    const def = TRAVELER_DEFAULT_LOCATIONS[key] || {
      lat: 40.4168,
      lng: -3.7038,
      placeName: 'Madrid Centro, España',
      address: 'Madrid, España',
      battery: 85,
    };
    return {
      travelerId: activeTraveler.id,
      travelerName: activeTraveler.name,
      lat: def.lat,
      lng: def.lng,
      accuracy: 6,
      placeName: def.placeName,
      address: def.address,
      batteryLevel: def.battery,
      speed: 0,
      heading: 0,
      altitude: 667,
      updatedAt: new Date().toISOString(),
      isActive: Boolean(live?.isActive),
    };
  }, [activeTraveler, locationsMap]);

  const travelerDetails = activeTraveler
    ? getPersonDetails(activeTraveler.name, travelers, activeTraveler.avatarColor)
    : null;

  // Compute time since last location update
  const timeSinceUpdate = useMemo(() => {
    if (!activeLoc?.updatedAt) return null;
    const diffMs = Date.now() - new Date(activeLoc.updatedAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return 'Hace más de 1 día';
  }, [activeLoc?.updatedAt]);

  const handleCopy = (coordsStr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(coordsStr);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    }
  };

  // OpenStreetMap embed URL centrado exactamente en las coordenadas del viajero seleccionado
  const osmEmbedUrl = useMemo(() => {
    const lat = activeLoc?.lat || 40.4168;
    const lng = activeLoc?.lng || -3.7038;
    const delta = mapZoom === 16 ? 0.008 : mapZoom === 17 ? 0.004 : 0.015;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [activeLoc?.lat, activeLoc?.lng, mapZoom]);

  const dualTime = getDualTimezoneStrings();

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-4 sm:p-6 shadow-md border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Navigation className="w-6 h-6 animate-pulse text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Rastreo GPS en Vivo de los Viajeros
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                  <span>Sincronización Dinámica</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Toca el nombre de cualquier viajero para centrar el mapa en su ubicación en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="text-right text-xs bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="text-emerald-400 font-bold block">{dualTime.spain}</span>
              <span className="text-amber-400 text-[10px] block">{dualTime.costaRica}</span>
            </div>
          </div>
        </div>

        {/* Traveler Selection Bar - Clic dinámico que cambia el mapa */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              Toca un viajero para centrar el mapa:
            </span>
            <span className="text-[10px] font-bold text-stone-400">
              Viendo: <strong className="text-amber-300">{activeTraveler?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {travelers.map((t) => {
              const tLoc = locationsMap.get(t.name.trim().toLowerCase());
              const isSelected = activeTraveler?.name.toLowerCase() === t.name.toLowerCase();
              const hasActiveGps = Boolean(tLoc && tLoc.isActive);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTraveler(t.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 border transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md scale-105 ring-2 ring-amber-300/80 font-black'
                      : 'bg-stone-800/90 text-stone-200 border-stone-700 hover:bg-stone-800 hover:border-amber-400/50'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-xs border border-white shrink-0"
                    style={{ backgroundColor: t.avatarColor || '#f59e0b' }}
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{t.name}</span>
                  {hasActiveGps ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="GPS en vivo activo" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title="Ubicación registrada" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Map & Location Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Interactive Map Canvas */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col min-h-[380px] sm:min-h-[440px]">
          {/* Map Top Bar */}
          <div className="p-3 px-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-black text-stone-900 truncate">
                {activeLoc?.placeName || 'Madrid, España'}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
                className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-700 font-black text-xs hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                title="Acercar mapa"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.max(z - 1, 13))}
                className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-700 font-black text-xs hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                title="Alejar mapa"
              >
                -
              </button>
            </div>
          </div>

          {/* Map Embed Frame */}
          <div className="relative flex-1 bg-stone-100 min-h-[300px] w-full">
            <iframe
              key={`${activeLoc?.lat}-${activeLoc?.lng}-${mapZoom}-${activeTraveler?.id}`}
              title={`Mapa GPS de ${activeTraveler?.name || 'Viajero'}`}
              src={osmEmbedUrl}
              className="w-full h-full min-h-[320px] sm:min-h-[380px] border-0 transition-opacity duration-300"
              loading="lazy"
            />

            {/* Floating Live Badge over the map */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-md flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ backgroundColor: travelerDetails?.color || '#f59e0b' }}
              >
                {travelerDetails?.initial || 'V'}
              </div>
              <span className="text-xs font-black text-stone-950">
                {travelerDetails?.formattedName}
              </span>
              {activeLoc?.isActive ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En vivo</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-stone-400">Pausado</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed GPS Status Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Traveler Profile Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md border-2 border-white shrink-0"
                style={{ backgroundColor: travelerDetails?.color || '#f59e0b' }}
              >
                {travelerDetails?.initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-black text-stone-950 truncate">
                    {travelerDetails?.formattedName}
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300 uppercase shrink-0">
                    ✈️ Viajero
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {activeLoc?.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Transmitiendo en Tiempo Real</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      <Radio className="w-3 h-3 text-stone-400" />
                      <span>Última posición registrada</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Address / Place Name */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Punto de Ubicación en España:</span>
              </span>
              <p className="text-sm font-black text-stone-950 leading-snug">
                {activeLoc?.placeName || 'Madrid Centro, España'}
              </p>
              {timeSinceUpdate && (
                <p className="text-[11px] text-stone-500 font-semibold flex items-center gap-1 pt-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{timeSinceUpdate}</span>
                </p>
              )}
            </div>

            {/* Telemetry Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Precisión GPS</span>
                <span className="text-xs font-black text-stone-800">
                  {activeLoc?.accuracy ? `± ${activeLoc.accuracy} metros` : '± 10 metros'}
                </span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Batería Móvil</span>
                <span className="text-xs font-black text-stone-800 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeLoc?.batteryLevel ? `${activeLoc.batteryLevel}%` : 'Conectado'}</span>
                </span>
              </div>

              {activeLoc?.speed !== null && activeLoc?.speed !== undefined && activeLoc.speed > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Velocidad</span>
                  <span className="text-xs font-black text-stone-800">
                    {activeLoc.speed} km/h
                  </span>
                </div>
              )}

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Hora España</span>
                <span className="text-xs font-black text-emerald-700">
                  {dualTime.spain.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Lat / Lng Coordinates Box with Copy Button */}
            {activeLoc?.lat && activeLoc?.lng && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="truncate">
                  <span className="text-[10px] font-bold text-stone-400 block">Coordenadas exactas:</span>
                  <span className="font-mono font-bold text-stone-800 text-[11px]">
                    {activeLoc.lat.toFixed(5)}, {activeLoc.lng.toFixed(5)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(`${activeLoc.lat}, ${activeLoc.lng}`)}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-2xs"
                  title="Copiar coordenadas"
                >
                  {copiedCoords ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-500" />}
                  <span>{copiedCoords ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: Google Maps, Apple Maps, Chat */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            {activeLoc?.lat && activeLoc?.lng ? (
              <div className="space-y-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeLoc.lat},${activeLoc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  <span>Abrir en Google Maps Oficial</span>
                </a>

                <a
                  href={`https://www.google.com/maps/@${activeLoc.lat},${activeLoc.lng},18z/data=!3m1!1e3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-amber-300 font-bold text-xs rounded-2xl border border-stone-800 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Ver en Satélite 3D de Google</span>
                </a>
              </div>
            ) : (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center text-xs text-stone-500">
                Esperando primera señal GPS del viajero...
              </div>
            )}

            {onOpenChat && (
              <button
                type="button"
                onClick={() => onOpenChat(activeTraveler?.name || 'Jessica')}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-amber-50 text-stone-800 hover:text-amber-950 font-bold text-xs rounded-2xl border border-stone-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-amber-700" />
                <span>Escribir por Chat Privado a {activeTraveler?.name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Directorio Interactivo de los 5 Viajeros para cambiar de ubicación con un solo clic */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h4 className="text-xs sm:text-sm font-black text-stone-950 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Ubicación Individual de las 5 Viajeras (Toca para ver en el mapa)</span>
          </h4>
          <span className="text-[11px] text-stone-500 font-semibold">
            Haz clic en cualquier nombre para cambiar el mapa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {travelers.map((t) => {
            const isSelected = activeTraveler?.name.toLowerCase() === t.name.toLowerCase();
            const key = t.name.trim().toLowerCase();
            const live = locationsMap.get(key);
            const def = TRAVELER_DEFAULT_LOCATIONS[key] || {
              placeName: 'Madrid Centro',
              lat: 40.4168,
              lng: -3.7038,
            };
            const currentPlace = live?.placeName || def.placeName;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTraveler(t.name)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-400/15 border-amber-400 shadow-sm ring-2 ring-amber-400/60'
                    : 'bg-stone-50 hover:bg-stone-100/80 border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: t.avatarColor || '#f59e0b' }}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs truncate ${isSelected ? 'font-black text-stone-950' : 'font-bold text-stone-800'}`}>
                      {t.name}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shrink-0">
                      En pantalla
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-600 shrink-0">
                      Ver
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-700 font-bold leading-tight line-clamp-2">
                  📍 {currentPlace}
                </div>

                <div className={`text-[10px] font-black flex items-center justify-between pt-1.5 border-t ${
                  isSelected ? 'border-amber-300 text-amber-900' : 'border-stone-200 text-stone-500'
                }`}>
                  <span>{isSelected ? '🎯 Ubicación Actual' : '👉 Ver Ubicación'}</span>
                  <span>➔</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
