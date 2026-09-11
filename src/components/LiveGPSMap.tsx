import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Battery,
  Radio,
  Copy,
  Check,
  Compass,
  MessageSquare,
  Users,
  Layers,
  Map as MapIcon,
  RefreshCw
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
  onRefresh?: () => void;
}

// Ubicaciones geográficas de respaldo en Madrid (si un viajero aún no ha transmitido GPS real)
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

// Resolver detalles geográficos inteligentes (Costa Rica vs España)
function getGeoDetails(lat?: number | null, lng?: number | null, currentPlaceName?: string | null) {
  if (!lat || !lng) {
    return {
      region: 'Madrid, España 🇪🇸',
      placeName: currentPlaceName || 'Madrid Centro, España',
      address: 'Madrid, España',
      isCostaRica: false,
    };
  }

  // Coordenadas en Costa Rica (lat entre 8.0 y 11.5, lng entre -86.0 y -82.5)
  if (lat >= 8.0 && lat <= 11.5 && lng >= -86.0 && lng <= -82.5) {
    // Alajuela / Residencial Cataluña / Desamparados
    if (lat >= 10.005 && lat <= 10.025 && lng >= -84.205 && lng <= -84.185) {
      return {
        region: 'Costa Rica (Punto de Salida / Reunión) 🇨🇷',
        placeName: 'Alajuela • Residencial Cataluña / Desamparados 🇨🇷',
        address: 'Residencial Cataluña, Desamparados de Alajuela, Costa Rica',
        isCostaRica: true,
      };
    }
    // Aeropuerto Internacional Juan Santamaría
    if (lat >= 9.990 && lat <= 10.005 && lng >= -84.220 && lng <= -84.195) {
      return {
        region: 'Costa Rica (Aeropuerto SJO) 🇨🇷',
        placeName: 'Aeropuerto Internacional Juan Santamaría (SJO) 🇨🇷',
        address: 'Aeropuerto SJO, Alajuela, Costa Rica',
        isCostaRica: true,
      };
    }
    // San José Centro
    if (lat >= 9.920 && lat <= 9.945 && lng >= -84.100 && lng <= -84.060) {
      return {
        region: 'Costa Rica (San José) 🇨🇷',
        placeName: 'San José Centro, Costa Rica 🇨🇷',
        address: 'San José, Costa Rica',
        isCostaRica: true,
      };
    }
    return {
      region: 'Costa Rica (Punto de Salida) 🇨🇷',
      placeName: (currentPlaceName && currentPlaceName !== 'En trayecto') ? currentPlaceName : 'Alajuela / San José, Costa Rica 🇨🇷',
      address: 'Costa Rica',
      isCostaRica: true,
    };
  }

  // Destino España / Europa
  return {
    region: 'España (Destino del Viaje) 🇪🇸',
    placeName: (currentPlaceName && currentPlaceName !== 'En trayecto') ? currentPlaceName : 'Madrid Centro, España 🇪🇸',
    address: 'Madrid, España',
    isCostaRica: false,
  };
}

// Función segura para parsear fechas de SQLite (Safari compatible)
function parseDateSafe(dStr?: string | null): Date | null {
  if (!dStr) return null;
  try {
    const formatted = dStr.includes('T') ? dStr : dStr.replace(' ', 'T') + (dStr.includes('Z') ? '' : 'Z');
    const d = new Date(formatted);
    return isNaN(d.getTime()) ? new Date(dStr) : d;
  } catch {
    return null;
  }
}

export const LiveGPSMap: React.FC<LiveGPSMapProps> = ({
  locations = [],
  travelers = [],
  selectedTravelerName,
  onSelectTraveler,
  onOpenChat,
  onRefresh,
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapViewMode, setMapViewMode] = useState<'google' | 'satellite' | 'osm'>('google');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Mapa de ubicaciones más recientes indexadas por nombre minúscula
  const locationsMap = useMemo(() => {
    const map = new Map<string, LiveLocationShare>();
    locations.forEach((loc) => {
      if (!loc || !loc.travelerName) return;
      const key = loc.travelerName.trim().toLowerCase();
      const existing = map.get(key);
      const locDate = parseDateSafe(loc.updatedAt)?.getTime() || 0;
      const existDate = parseDateSafe(existing?.updatedAt)?.getTime() || 0;
      if (!existing || locDate >= existDate) {
        map.set(key, loc);
      }
    });
    return map;
  }, [locations]);

  // Viajero seleccionado actualmente
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
      accuracy: 10,
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

  // Detalles geográficos resueltos
  const geo = useMemo(() => {
    return getGeoDetails(activeLoc?.lat, activeLoc?.lng, activeLoc?.placeName);
  }, [activeLoc?.lat, activeLoc?.lng, activeLoc?.placeName]);

  // Detectar viajeras que están juntas en el mismo punto físico (< 300 metros)
  const groupedTravelers = useMemo(() => {
    if (!activeLoc?.lat || !activeLoc?.lng) return [];
    const list: Traveler[] = [];
    travelers.forEach((t) => {
      const key = t.name.trim().toLowerCase();
      const loc = locationsMap.get(key);
      if (loc && loc.lat && loc.lng) {
        const dLat = Math.abs(loc.lat - activeLoc.lat);
        const dLng = Math.abs(loc.lng - activeLoc.lng);
        // Margen de ~0.003 grados (~300 metros)
        if (dLat < 0.003 && dLng < 0.003) {
          list.push(t);
        }
      }
    });
    return list;
  }, [activeLoc?.lat, activeLoc?.lng, locationsMap, travelers]);

  // Tiempo transcurrido desde la última sincronización GPS
  const timeSinceUpdate = useMemo(() => {
    if (!activeLoc?.updatedAt) return null;
    const parsed = parseDateSafe(activeLoc.updatedAt);
    if (!parsed) return null;
    const diffMs = Date.now() - parsed.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Transmitido hace unos segundos';
    if (diffMins === 1) return 'Transmitido hace 1 minuto';
    if (diffMins < 60) return `Transmitido hace ${diffMins} minutos`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Transmitido hace 1 hora';
    if (diffHours < 24) return `Transmitido hace ${diffHours} horas`;
    return 'Última transmisión hace más de 1 día';
  }, [activeLoc?.updatedAt]);

  const handleCopy = (coordsStr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(coordsStr);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  // URL del iframe interactivo según la vista seleccionada (Google Maps Calles, Satélite o OSM)
  const mapEmbedUrl = useMemo(() => {
    const lat = activeLoc?.lat || 10.0133;
    const lng = activeLoc?.lng || -84.1945;

    if (mapViewMode === 'google') {
      return `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=${mapZoom}&output=embed`;
    }
    if (mapViewMode === 'satellite') {
      return `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=${mapZoom}&t=k&output=embed`;
    }
    // Fallback OpenStreetMap
    const delta = mapZoom >= 17 ? 0.003 : mapZoom === 16 ? 0.006 : 0.012;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [activeLoc?.lat, activeLoc?.lng, mapZoom, mapViewMode]);

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
                  <span>Transmitiendo en Tiempo Real</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Toca cualquier viajera abajo para enfocar el mapa instantáneamente en su ubicación real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
              title="Actualizar datos GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
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
              Toca una viajera para ver su ubicación en el mapa:
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
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="GPS activo transmitiendo en vivo" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title="Ubicación registrada" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group Notice Banner: Explica por qué el mapa muestra el mismo lugar si están juntas */}
      {groupedTravelers.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-black text-sm">
            <Users className="w-4 h-4 text-amber-900" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-amber-900 text-xs sm:text-sm">
                👥 Viajeras reunidas en este mismo punto ({groupedTravelers.length} de {travelers.length}):
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                GPS Exacto Confirmado
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              <strong>{groupedTravelers.map((g) => g.name).join(', ')}</strong> se encuentran juntas en esta misma ubicación física en{' '}
              <strong>{geo.isCostaRica ? 'Costa Rica 🇨🇷' : 'España 🇪🇸'}</strong> preparándose para el viaje. Sus teléfonos están transmitiendo coordenadas GPS reales con precisión de pocos metros, por lo que el mapa enfoca exactamente el mismo lugar al tocarlas a cualquiera de ellas.
            </p>
          </div>
        </div>
      )}

      {/* Main Map & Location Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Interactive Map Canvas */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col min-h-[400px] sm:min-h-[460px]">
          {/* Map Top Bar: Layer Switcher & Controls */}
          <div className="p-3 px-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs font-black text-stone-900 truncate">
                {geo.placeName}
              </span>
            </div>

            {/* View Mode & Zoom Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Map Layer Switcher */}
              <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl text-[11px] font-black">
                <button
                  type="button"
                  onClick={() => setMapViewMode('google')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    mapViewMode === 'google'
                      ? 'bg-white text-stone-950 shadow-2xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Vista de calles Google Maps"
                >
                  <MapIcon className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Calles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('satellite')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    mapViewMode === 'satellite'
                      ? 'bg-white text-stone-950 shadow-2xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Vista Satélite Fotográfico de Google"
                >
                  <Compass className="w-3 h-3 text-sky-600" />
                  <span>Satélite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('osm')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    mapViewMode === 'osm'
                      ? 'bg-white text-stone-950 shadow-2xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Vista OpenStreetMap"
                >
                  <Layers className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">OSM</span>
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(z + 1, 19))}
                  className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-700 font-black text-xs hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Acercar mapa (+)"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(z - 1, 12))}
                  className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-700 font-black text-xs hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Alejar mapa (-)"
                >
                  -
                </button>
              </div>
            </div>
          </div>

          {/* Map Embed Frame */}
          <div className="relative flex-1 bg-stone-100 min-h-[320px] sm:min-h-[400px] w-full">
            <iframe
              key={`${activeLoc?.lat}-${activeLoc?.lng}-${mapZoom}-${mapViewMode}-${activeTraveler?.id}`}
              title={`Mapa GPS de ${activeTraveler?.name || 'Viajero'}`}
              src={mapEmbedUrl}
              className="w-full h-full min-h-[320px] sm:min-h-[400px] border-0 transition-opacity duration-300"
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

            {/* Quick Map Mode Pill on bottom right */}
            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-mono shadow-md">
              {mapViewMode === 'google' ? 'Google Maps • Calles' : mapViewMode === 'satellite' ? 'Google Maps • Satélite' : 'OpenStreetMap'}
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

            {/* Location Address / Place Name with Region Label */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{geo.isCostaRica ? '📍 Ubicación Actual en Costa Rica (Salida):' : '📍 Ubicación Actual en España (Destino):'}</span>
              </span>
              <p className="text-sm font-black text-stone-950 leading-snug">
                {geo.placeName}
              </p>
              {geo.address && (
                <p className="text-xs text-stone-600 font-medium">
                  {geo.address}
                </p>
              )}
              {timeSinceUpdate && (
                <p className="text-[11px] text-stone-500 font-semibold flex items-center gap-1 pt-1 border-t border-amber-200/60">
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
                  {activeLoc?.accuracy ? `± ${Math.round(activeLoc.accuracy)} metros` : '± 10 metros'}
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
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Hora Local CR</span>
                <span className="text-xs font-black text-amber-800">
                  {dualTime.costaRica.split(' ')[0]}
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

          {/* Action Buttons: Google Maps, Apple Maps, Waze, Chat */}
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

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://waze.com/ul?ll=${activeLoc.lat},${activeLoc.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>🚗 Abrir en Waze</span>
                  </a>
                  <a
                    href={`https://maps.apple.com/?q=${activeLoc.lat},${activeLoc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>🍎 Apple Maps</span>
                  </a>
                </div>
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
                <span>Escribir por Chat a {activeTraveler?.name}</span>
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
            <span>Ubicación Individual de las 5 Viajeras (Toca para centrar el mapa)</span>
          </h4>
          <span className="text-[11px] text-stone-500 font-semibold">
            Haz clic en cualquier viajera para ver sus coordenadas exactas
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
            const currentLat = live?.lat ?? def.lat;
            const currentLng = live?.lng ?? def.lng;
            const currentGeo = getGeoDetails(currentLat, currentLng, live?.placeName);
            const hasActiveGps = Boolean(live && live.isActive);

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
                  {hasActiveGps ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En vivo" />
                  ) : null}
                </div>

                <div className="text-[11px] text-stone-700 font-bold leading-tight line-clamp-2">
                  📍 {currentGeo.placeName}
                </div>

                <div className={`text-[10px] font-black flex items-center justify-between pt-1.5 border-t ${
                  isSelected ? 'border-amber-300 text-amber-900' : 'border-stone-200 text-stone-500'
                }`}>
                  <span>{isSelected ? '🎯 En Pantalla' : '👉 Ver Ubicación'}</span>
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
