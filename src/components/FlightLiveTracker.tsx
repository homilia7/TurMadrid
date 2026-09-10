import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plane, 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Navigation, 
  Gauge, 
  CheckCircle2, 
  Globe,
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { REALISTIC_AIRPLANE_CENTERED_PATH } from './RealisticAirplane';
import { getDualClocks } from '../utils/timeUtils';

interface FlightLiveTrackerProps {
  documents?: DocumentItem[];
}

interface FlightRoute {
  id: string;
  code: string;
  airline: string;
  title: string;
  originName: string;
  originCode: string;
  originCity: string;
  destinationName: string;
  destinationCode: string;
  destinationCity: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  flightDurationHours: number;
  totalDistanceKm: number;
  departureTimeLocal: string;
  arrivalTimeLocal: string;
  departureTimeUtc: string;
  arrivalTimeUtc: string;
}

const PRESET_ROUTES: FlightRoute[] = [
  {
    id: 'outbound-sjo-mad',
    code: 'E9 858',
    airline: 'Iberojet',
    title: 'Vuelo de Ida: San José ✈ Madrid (E9 858)',
    originName: 'Aeropuerto Internacional Juan Santamaría (Terminal M)',
    originCode: 'SJO',
    originCity: 'San José, Costa Rica',
    destinationName: 'Aeropuerto Adolfo Suárez Madrid-Barajas (Terminal 1)',
    destinationCode: 'MAD',
    destinationCity: 'Madrid, España',
    scheduledDeparture: '2026-09-10T23:20:00-06:00',
    scheduledArrival: '2026-09-11T17:35:00+02:00',
    flightDurationHours: 10.25,
    totalDistanceKm: 8485,
    departureTimeLocal: '10 Sept • 11:20 PM (Terminal M, Costa Rica)',
    arrivalTimeLocal: '11 Sept • 5:35 PM (Terminal 1, España)',
    departureTimeUtc: '11 Sept 05:20 UTC',
    arrivalTimeUtc: '11 Sept 15:35 UTC',
  },
  {
    id: 'return-mad-sjo',
    code: 'E9 857',
    airline: 'Iberojet',
    title: 'Vuelo de Retorno: Madrid ✈ San José',
    originName: 'Aeropuerto Adolfo Suárez Madrid-Barajas (Terminal 1)',
    originCode: 'MAD',
    originCity: 'Madrid, España',
    destinationName: 'Aeropuerto Internacional Juan Santamaría',
    destinationCode: 'SJO',
    destinationCity: 'San José, Costa Rica',
    scheduledDeparture: '2026-09-22T12:30:00+02:00',
    scheduledArrival: '2026-09-22T16:15:00-06:00',
    flightDurationHours: 11.75,
    totalDistanceKm: 8485,
    departureTimeLocal: '22 Sept • 12:30 PM (Terminal 1, España)',
    arrivalTimeLocal: '22 Sept • 4:15 PM (Costa Rica)',
    departureTimeUtc: '22 Sept 10:30 UTC',
    arrivalTimeUtc: '22 Sept 22:15 UTC',
  },
];

export const FlightLiveTracker: React.FC<FlightLiveTrackerProps> = ({ documents = [] }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('outbound-sjo-mad');
  const [activeTrackerTab, setActiveTrackerTab] = useState<'native_map' | 'satellite_radar'>('native_map');
  
  // Reloj en tiempo real segundo a segundo
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [previewPercent, setPreviewPercent] = useState<number | null>(null);
  const [showSimulationTools, setShowSimulationTools] = useState<boolean>(false);

  // OpenSky / Live GPS State
  const [isFetchingOpenSky, setIsFetchingOpenSky] = useState<boolean>(false);
  const [lastApiSync, setLastApiSync] = useState<string>('');
  const [telemetrySource, setTelemetrySource] = useState<'opensky' | 'dead_reckoning' | 'scheduled'>('scheduled');
  const [liveAltitudeFeet, setLiveAltitudeFeet] = useState<number>(0);
  const [liveSpeedKmh, setLiveSpeedKmh] = useState<number>(0);
  const [flightPhase, setFlightPhase] = useState<string>('Programado a Tiempo');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Ruta activa
  const activeRoute = PRESET_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_ROUTES[0];

  // Intenta leer el código de vuelo desde documentos subidos si existe
  const flightDocs = documents.filter((d) => d.category === 'vuelo' && d.flightNumber);
  const displayFlightCode = flightDocs.length > 0 && flightDocs[0].flightNumber
    ? flightDocs[0].flightNumber.trim().toUpperCase()
    : activeRoute.code;
  const radarFlightCode = displayFlightCode.replace(/\s+/g, '').toUpperCase();

  // Actualización periódica del reloj local cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clocks = getDualClocks(currentTime);

  // Cálculos precisos conforme al horario del vuelo real
  const depDate = new Date(activeRoute.scheduledDeparture);
  const arrDate = new Date(activeRoute.scheduledArrival);
  const totalDurationMs = arrDate.getTime() - depDate.getTime();
  const elapsedMs = currentTime.getTime() - depDate.getTime();

  const isBeforeFlight = currentTime < depDate;
  const isFlightActive = currentTime >= depDate && currentTime <= arrDate;
  const isFlightCompleted = currentTime > arrDate;

  const diffMs = Math.max(0, depDate.getTime() - currentTime.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  // Porcentaje real transcurrido según el reloj oficial
  let calculatedRealPct = 0;
  if (isBeforeFlight) {
    calculatedRealPct = 0;
  } else if (isFlightActive) {
    calculatedRealPct = Math.min(99.4, Math.max(0.6, (elapsedMs / totalDurationMs) * 100));
  } else {
    calculatedRealPct = 100;
  }

  // Si está en modo demostración usa el valor probado; de lo contrario SIEMPRE el vuelo real
  const isPreviewMode = previewPercent !== null;
  const progressPercent = isPreviewMode ? previewPercent : Math.round(calculatedRealPct * 10) / 10;

  // Consulta en tiempo real a la API de OpenSky Network
  const fetchOpenSkyTelemetry = useCallback(async () => {
    const dep = new Date(activeRoute.scheduledDeparture);
    const arr = new Date(activeRoute.scheduledArrival);
    const now = new Date();
    const isActiveNow = now >= dep && now <= arr;

    if (!isActiveNow) {
      if (now < dep) {
        setTelemetrySource('scheduled');
        setLiveAltitudeFeet(0);
        setLiveSpeedKmh(0);
        setFlightPhase('En Tierra • Programado a Tiempo');
      } else {
        setTelemetrySource('scheduled');
        setLiveAltitudeFeet(0);
        setLiveSpeedKmh(0);
        setFlightPhase(`Aterrizado en ${activeRoute.destinationCode}`);
      }
      setLastApiSync(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return;
    }

    setIsFetchingOpenSky(true);
    const cleanCallsign = displayFlightCode.replace(/[\s-]+/g, '').toUpperCase();
    const flightDigits = cleanCallsign.replace(/^[A-Z0-9]{2,3}/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://opensky-network.org/api/states/all', {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      let foundOnline = false;

      if (res && res.ok) {
        const data = await res.json();
        const states = Array.isArray(data?.states) ? data.states : [];
        
        const match = states.find((st: any[]) => {
          const callsign = (st[1] || '').trim().toUpperCase();
          return (
            callsign.includes(cleanCallsign) ||
            (flightDigits && callsign.includes('EVE' + flightDigits)) ||
            (flightDigits && callsign.includes('IBE' + flightDigits))
          );
        });

        if (match) {
          foundOnline = true;
          const baroAltMeters = match[7] || 11500;
          const altFeet = Math.round(baroAltMeters * 3.28084);
          const velMps = match[9] || 245;
          const speedKm = Math.round(velMps * 3.6);

          setLiveAltitudeFeet(altFeet);
          setLiveSpeedKmh(speedKm);
          setTelemetrySource('opensky');
          setFlightPhase('En Vuelo • Radar Satelital ADS-B Conectado');
        }
      }

      if (!foundOnline) {
        // Navegación ortodrómica de alta fidelidad durante el vuelo real
        setTelemetrySource('dead_reckoning');
        const pct = calculatedRealPct;
        if (pct < 8) {
          setLiveAltitudeFeet(Math.round(1500 + (pct / 8) * 35000));
          setLiveSpeedKmh(Math.round(420 + (pct / 8) * 465));
          setFlightPhase('Despegue y Ascenso sobre el Caribe');
        } else if (pct < 88) {
          setLiveAltitudeFeet(38200);
          setLiveSpeedKmh(895);
          setFlightPhase(pct < 50 ? 'Crucero Transatlántico (Océano Atlántico)' : 'Cruce Atlántico rumbo a Península Ibérica');
        } else {
          const descentRatio = (100 - pct) / 12;
          setLiveAltitudeFeet(Math.round(2500 + descentRatio * 34000));
          setLiveSpeedKmh(Math.round(320 + descentRatio * 560));
          setFlightPhase('Descenso y Aproximación a Madrid Barajas');
        }
      }

      const nowSync = new Date();
      setLastApiSync(nowSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      setTelemetrySource('dead_reckoning');
      setLastApiSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsFetchingOpenSky(false);
    }
  }, [displayFlightCode, activeRoute, calculatedRealPct]);

  useEffect(() => {
    fetchOpenSkyTelemetry();
    const interval = setInterval(fetchOpenSkyTelemetry, 90000);
    return () => clearInterval(interval);
  }, [fetchOpenSkyTelemetry]);

  // Manejo de compartir enlace con la familia
  const handleShareFlight = () => {
    const text = `Seguimiento en Vivo del Vuelo ${displayFlightCode} (${activeRoute.originCode} ✈ ${activeRoute.destinationCode}): https://www.flightradar24.com/${radarFlightCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Coordenadas ortodrómicas en la curva de Bézier (Soporte Ida y Regreso)
  const isReturn = activeRoute.id === 'return-mad-sjo';
  const p0 = isReturn ? { x: 675, y: 115 } : { x: 130, y: 245 };
  const p1 = { x: 400, y: 55 };
  const p2 = isReturn ? { x: 130, y: 245 } : { x: 675, y: 115 };
  const progressRatio = progressPercent / 100;
  const t = progressRatio;

  const planeX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const planeY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

  // Ángulo tangente para orientar el avión
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  const planeAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const distanceDoneKm = isPreviewMode
    ? Math.round(activeRoute.totalDistanceKm * progressRatio)
    : isBeforeFlight
    ? 0
    : isFlightCompleted
    ? activeRoute.totalDistanceKm
    : Math.round(activeRoute.totalDistanceKm * progressRatio);

  const distanceLeftKm = Math.max(0, activeRoute.totalDistanceKm - distanceDoneKm);

  const hoursLeft = isPreviewMode
    ? ((1 - progressRatio) * activeRoute.flightDurationHours).toFixed(1)
    : isBeforeFlight
    ? activeRoute.flightDurationHours.toFixed(1)
    : isFlightCompleted
    ? '0.0'
    : Math.max(0, ((arrDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60))).toFixed(1);

  const displayAltitude = isPreviewMode
    ? 38200
    : isBeforeFlight || isFlightCompleted
    ? 0
    : liveAltitudeFeet || 38200;

  const displaySpeed = isPreviewMode
    ? 895
    : isBeforeFlight || isFlightCompleted
    ? 0
    : liveSpeedKmh || 885;

  const displayPhase = isPreviewMode
    ? `Demostración de Avance (${previewPercent}%)`
    : isBeforeFlight
    ? diffDays > 0
      ? `En Tierra • Salida en ${diffDays}d ${diffHours}h ${diffMins}m`
      : `En Tierra • Salida en ${diffHours}h ${diffMins}m ${diffSecs}s`
    : isFlightCompleted
    ? `✅ Aterrizado en ${activeRoute.destinationCode}`
    : flightPhase;

  return (
    <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-blue-950 text-white p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 text-sky-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                <Radio className="w-3 h-3 animate-pulse" />
                Seguimiento en Vivo para Familiares
              </span>
              <span className="text-xs font-mono font-bold bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded border border-sky-700/60">
                {displayFlightCode} • {activeRoute.airline}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeRoute.title}
            </h3>
            <p className="text-xs sm:text-sm text-sky-200/90 mt-0.5">
              Monitoreo en tiempo real del cruce transatlántico de Costa Rica a España
            </p>

            {/* Relojes duales en vivo para los familiares */}
            <div className="flex items-center gap-2 flex-wrap mt-2.5">
              <div className="bg-sky-900/80 border border-sky-700/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-sky-100 text-xs shadow-2xs">
                <span className="text-[11px] font-bold">🇨🇷 Costa Rica:</span>
                <span className="font-mono font-black text-amber-300">{clocks.costaRicaTime}</span>
              </div>
              <div className="bg-sky-900/80 border border-sky-700/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-sky-100 text-xs shadow-2xs">
                <span className="text-[11px] font-bold">🇪🇸 Madrid:</span>
                <span className="font-mono font-black text-emerald-300">{clocks.spainTime}</span>
                <span className="text-[10px] text-sky-300 font-bold">(+8h)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-800/60 hover:bg-sky-700/80 text-white border border-sky-600/40 flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title="Compartir con familiares"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir con Familia</span>
            </button>

            <button
              type="button"
              onClick={fetchOpenSkyTelemetry}
              disabled={isFetchingOpenSky}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Refrescar posición GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingOpenSky ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar GPS</span>
            </button>
          </div>
        </div>

        {/* Selector de Trayecto (Ida o Regreso) */}
        <div className="mt-5 pt-3 border-t border-sky-800/40 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">Trayecto:</span>
          {PRESET_ROUTES.map((route) => {
            const isSelected = route.id === selectedRouteId;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  setSelectedRouteId(route.id);
                  setPreviewPercent(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-sky-900/60 text-sky-200 hover:bg-sky-800/80 hover:text-white border border-sky-700/50'
                }`}
              >
                <Plane className={`w-3 h-3 ${route.id === 'return-mad-sjo' ? 'rotate-180' : ''}`} />
                <span>{route.originCode} ➔ {route.destinationCode}</span>
                <span className="opacity-75 font-normal">({route.code})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Vista: Opción A vs Opción B */}
      <div className="bg-sky-50/70 p-3 border-b border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>Vista para los Familiares:</span>
        </span>

        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTrackerTab('native_map')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTrackerTab === 'native_map'
                ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
            <span>1. Mapa Nativo & GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrackerTab('satellite_radar')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTrackerTab === 'satellite_radar'
                ? 'bg-white text-slate-950 shadow-xs border border-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Radar Satelital en Vivo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: MAPA NATIVO INTERACTIVO & TELEMETRÍA EN VIVO CONFORME AL HORARIO */}
      {/* ========================================================================= */}
      {activeTrackerTab === 'native_map' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Telemetry Dashboard Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Estado del Vuelo
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5 truncate">
                {isBeforeFlight && !isPreviewMode ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                ) : isFlightCompleted && !isPreviewMode ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                )}
                <span>{displayPhase}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {isPreviewMode
                  ? '⚠️ Demostración Visual'
                  : telemetrySource === 'opensky'
                  ? '🛰️ Señal ADS-B Activa'
                  : isBeforeFlight
                  ? '⏱️ Espera en Rampa SJO'
                  : isFlightCompleted
                  ? '🏁 Llegada Confirmada'
                  : '⏱️ Navegación Ortodrómica'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Altitud
              </span>
              <span className="text-xs sm:text-sm font-black text-sky-950 flex items-center gap-1 mt-0.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" />
                {displayAltitude > 0 ? `${displayAltitude.toLocaleString()} pies` : '0 pies (En tierra)'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {displayAltitude > 0 ? `~${Math.round(displayAltitude * 0.3048).toLocaleString()} metros` : 'Rampa de abordaje'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Velocidad Respecto al Suelo
              </span>
              <span className="text-xs sm:text-sm font-black text-sky-950 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {displaySpeed > 0 ? `${displaySpeed} km/h` : '0 km/h (Estacionado)'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {displaySpeed > 0 ? `~${Math.round(displaySpeed * 0.5399)} nudos (kts)` : 'Aeronave en tierra'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isBeforeFlight && !isPreviewMode ? 'Cuenta Regresiva Salida' : 'Tiempo Restante'}
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-700 flex items-center gap-1 mt-0.5">
                {isBeforeFlight && !isPreviewMode ? (
                  `${diffHours}h ${diffMins}m ${diffSecs}s`
                ) : isFlightCompleted && !isPreviewMode ? (
                  '0 horas (Llegó)'
                ) : (
                  `~${hoursLeft} horas`
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {isBeforeFlight && !isPreviewMode
                  ? 'Salida hoy 11:20 PM'
                  : isFlightCompleted && !isPreviewMode
                  ? 'Trayecto completado'
                  : `Faltan ${distanceLeftKm.toLocaleString()} km`}
              </span>
            </div>
          </div>

          {/* Interactive Visual Flight Map Container */}
          <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 rounded-2xl border-2 border-slate-800 p-4 sm:p-5 shadow-inner overflow-hidden">
            {/* Ocean Grid Lines */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

            {/* Geographical Markers & Context */}
            <div className="relative z-10 flex items-center justify-between text-white text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/30" />
                <div>
                  <p className="font-black text-emerald-400 text-sm">{activeRoute.originCode}</p>
                  <p className="text-[10px] text-slate-300">{activeRoute.originCity}</p>
                </div>
              </div>

              <div className="text-center px-2 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-sky-300">
                Trayectoria Ortodrómica • Océano Atlántico Norte
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <p className="font-black text-amber-400 text-sm">{activeRoute.destinationCode}</p>
                  <p className="text-[10px] text-slate-300">{activeRoute.destinationCity}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/30" />
              </div>
            </div>

            {/* SVG Flight Path Vector */}
            <div className="w-full relative h-48 sm:h-56">
              <svg 
                viewBox="0 0 800 320" 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="flightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {/* Continental outlines stylized */}
                <path 
                  d="M 60 210 Q 110 230 140 280 Q 150 250 180 230 Q 160 210 120 190 Z" 
                  fill="#1e293b" 
                  opacity="0.4" 
                />
                <path 
                  d="M 640 80 Q 710 70 740 110 Q 720 160 670 170 Q 640 140 640 80 Z" 
                  fill="#1e293b" 
                  opacity="0.4" 
                />
                <circle cx="430" cy="115" r="4" fill="#64748b" opacity="0.6" />
                <text x="430" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle">Islas Azores</text>

                {/* Planned Route Line (dashed arc) */}
                <path
                  d="M 130 245 Q 400 55 675 115"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="3"
                  strokeDasharray="6,6"
                />

                {/* Traveled Route Line (colored glow) - solo si ha comenzado el vuelo */}
                {progressPercent > 0.5 && (
                  <path
                    d={`M ${p0.x} ${p0.y} Q ${(1 - t) * p0.x + t * p1.x} ${(1 - t) * p0.y + t * p1.y} ${planeX} ${planeY}`}
                    fill="none"
                    stroke="url(#flightGrad)"
                    strokeWidth="3.5"
                    filter="url(#glow)"
                  />
                )}

                {/* Origin Marker SJO */}
                <circle cx="130" cy="245" r="7" fill={isReturn ? "#f59e0b" : "#10b981"} />
                {(!isReturn && isBeforeFlight) && (
                  <circle cx="130" cy="245" r="14" fill="#10b981" opacity="0.25" className="animate-ping" />
                )}
                <text x="130" y="272" fill={isReturn ? "#fbbf24" : "#34d399"} fontSize="11" fontWeight="bold" textAnchor="middle">
                  SJO (Costa Rica)
                </text>

                {/* Destination Marker MAD */}
                <circle cx="675" cy="115" r="7" fill={isReturn ? "#10b981" : "#f59e0b"} />
                {(isReturn && isBeforeFlight) && (
                  <circle cx="675" cy="115" r="14" fill="#10b981" opacity="0.25" className="animate-ping" />
                )}
                <text x="675" y="142" fill={isReturn ? "#34d399" : "#fbbf24"} fontSize="11" fontWeight="bold" textAnchor="middle">
                  MAD (Madrid Barajas)
                </text>

                {/* The Flying Airplane Icon positioned at (planeX, planeY) */}
                <g transform={`translate(${planeX}, ${planeY}) rotate(${planeAngle})`}>
                  <circle cx="0" cy="0" r="22" fill="#38bdf8" opacity="0.15" />
                  <circle cx="0" cy="0" r="14" fill="#38bdf8" opacity="0.3" />
                  
                  {/* Airplane SVG Silhouette Realista */}
                  <path
                    d={REALISTIC_AIRPLANE_CENTERED_PATH}
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Current Flight Label above the plane */}
                <g transform={`translate(${planeX}, ${planeY - 26})`}>
                  <rect x="-65" y="-14" width="130" height="20" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <text x="0" y="0" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {isPreviewMode
                      ? `✈ ${displayFlightCode} (${Math.round(progressPercent)}% Demo)`
                      : isBeforeFlight
                      ? `✈ ${displayFlightCode} (Salida Hoy 11:20 PM)`
                      : isFlightCompleted
                      ? `✈ ${displayFlightCode} (Aterrizado)`
                      : `✈ ${displayFlightCode} (${Math.round(progressPercent)}%)`}
                  </text>
                </g>
              </svg>
            </div>

            {/* Progress Bar & Distance stats */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>{distanceDoneKm.toLocaleString()} km recorridos</span>
                <span className="text-amber-300 font-bold">
                  {isPreviewMode
                    ? `${progressPercent}% (Demostración)`
                    : isBeforeFlight
                    ? '0% • En Espera de Salida'
                    : isFlightCompleted
                    ? '100% • Vuelo Concluido'
                    : `${progressPercent}% del trayecto`}
                </span>
                <span>{activeRoute.totalDistanceKm.toLocaleString()} km totales</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Status footer with sync timestamp and optional test tools */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-800/80 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400">
                    Último reporte: <strong className="text-white">{lastApiSync || currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                  </span>
                  {isPreviewMode ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[10px]">
                      <span>⚠️ Vista previa ({previewPercent}%)</span>
                      <button
                        type="button"
                        onClick={() => setPreviewPercent(null)}
                        className="underline hover:text-white cursor-pointer ml-1"
                      >
                        Volver al Vuelo Real
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Tiempo Real Sincronizado</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isBeforeFlight && !isPreviewMode && (
                    <span className="text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Despegue en {diffHours}h {diffMins}m {diffSecs}s</span>
                    </span>
                  )}
                  {isFlightActive && !isPreviewMode && (
                    <span className="text-emerald-300 font-mono font-bold text-[11px] flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5 animate-pulse" />
                      <span>En vuelo hacia {activeRoute.destinationCode}</span>
                    </span>
                  )}
                  {isFlightCompleted && !isPreviewMode && (
                    <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Vuelo concluido</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSimulationTools(!showSimulationTools)}
                    className="text-[10px] text-slate-400 hover:text-sky-300 underline cursor-pointer ml-2"
                    title="Herramienta opcional para verificar animación"
                  >
                    {showSimulationTools ? 'Ocultar prueba' : 'Probar animación'}
                  </button>
                </div>
              </div>

              {/* Panel de prueba opcional */}
              {showSimulationTools && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-2 flex-wrap text-[10px] animate-in fade-in mt-2">
                  <span className="text-slate-300 font-semibold">Probar posición en ruta (Demostración):</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewPercent(null)}
                      className={`px-2 py-1 rounded font-bold cursor-pointer transition ${
                        previewPercent === null ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🟢 Vuelo Real (En Vivo)
                    </button>
                    {[15, 45, 75, 95].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPreviewPercent(pct)}
                        className={`px-2 py-1 rounded font-bold cursor-pointer transition ${
                          previewPercent === pct ? 'bg-sky-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Summary Card */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-extrabold text-sky-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Horarios Programados del Vuelo:
              </p>
              <p className="text-slate-600">
                <span className="font-bold">Salida {activeRoute.originCode}: </span>{activeRoute.departureTimeLocal}
              </p>
              <p className="text-slate-600">
                <span className="font-bold">Llegada {activeRoute.destinationCode}: </span>{activeRoute.arrivalTimeLocal}
              </p>
              {isBeforeFlight && !isPreviewMode && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 font-bold font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-amber-800" />
                    <span>Despegue programado en {diffHours}h {diffMins}m {diffSecs}s</span>
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-sky-200 text-center shrink-0 shadow-2xs self-stretch sm:self-auto">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Duración Estimada</span>
              <span className="text-sm font-black text-sky-950">{activeRoute.flightDurationHours} horas</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: RADAR SATELITAL PROFESIONAL (FLIGHTRADAR24 / FLIGHTAWARE)     */}
      {/* ========================================================================= */}
      {activeTrackerTab === 'satellite_radar' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold shrink-0 shadow-2xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Rastreo Satelital Global en Tiempo Real
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Los familiares pueden abrir directamente el radar satelital de <strong>Flightradar24</strong> o <strong>FlightAware</strong> con el código de vuelo <strong className="text-amber-800">{displayFlightCode}</strong>. Podrán ver la aeronave exacta en 3D, altitud, condiciones del clima sobre el Atlántico y hora de aterrizaje calculada por radar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flightradar24 Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                <Plane className="w-40 h-40 text-amber-400" />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                    Flightradar24
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Radar ADS-B / Satélite</span>
                </div>

                <h4 className="text-base font-black text-white">
                  Rastreador Radar 2D & 3D
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Permite seguir el avión de las chicas sobre el mapa satelital en vivo con vista de cabina 3D, velocidad y retrasos minuto a minuto.
                </p>

                <div className="my-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Código de Vuelo:</span>
                    <span className="font-mono font-bold text-amber-300">{displayFlightCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ruta Directa:</span>
                    <span className="font-bold text-white">{activeRoute.originCode} ➔ {activeRoute.destinationCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aerolínea:</span>
                    <span className="text-white">{activeRoute.airline} (Airbus A350-900 / A330)</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://www.flightradar24.com/${radarFlightCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>Abrir en Flightradar24</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>

            {/* FlightAware Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                <Globe className="w-40 h-40 text-sky-400" />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500 text-slate-950 flex items-center gap-1">
                    FlightAware
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Telemetría Global</span>
                </div>

                <h4 className="text-base font-black text-white">
                  Monitoreo de Terminales & Clima
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Detalles de puertas de embarque, reclamo de equipaje en Madrid Barajas (MAD) y estado del tráfico aéreo sobre Europa.
                </p>

                <div className="my-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vuelo:</span>
                    <span className="font-mono font-bold text-sky-300">{displayFlightCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Terminal Salida:</span>
                    <span className="font-bold text-white">{activeRoute.id === 'outbound-sjo-mad' ? 'SJO Terminal M' : 'MAD Terminal 1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Terminal Llegada:</span>
                    <span className="font-bold text-emerald-400">{activeRoute.id === 'outbound-sjo-mad' ? 'MAD Terminal 1' : 'SJO Terminal M'}</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://www.flightaware.com/live/flight/${radarFlightCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>Abrir en FlightAware</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>

          {/* Quick instructions for family members */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
            <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
              💡 Consejos para los familiares durante el viaje:
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-600">
              <li>El vuelo de ida <strong>E9 858</strong> sale de Costa Rica a las <strong>11:20 PM</strong> del 10 de Septiembre (Terminal M) y aterriza en Madrid a las <strong>5:35 PM</strong> del 11 de Septiembre en la <strong>Terminal 1</strong> (hora de España).</li>
              <li>Al tocar el botón de Flightradar24, pueden ver el avión en 3D en tiempo real mientras cruza el Atlántico.</li>
              <li>Recuerden que en España son <strong>8 horas más</strong> que en Costa Rica (horario de verano europeo CEST).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Popup Modal: Compartir con Familia (WhatsApp y Compartir Nativo) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center relative animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Share2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-stone-900">Compartir con Familia</h3>
            <p className="text-xs text-stone-500 mb-4">
              Comparte el enlace de seguimiento en vivo con tus familiares para que sigan el vuelo y el viaje en tiempo real.
            </p>

            {(() => {
              const shareUrl = 'https://tureuropa.pages.dev/?familia=1';
              const shareText = `✈️ ¡Hola! Les comparto el portal familiar en vivo para seguir nuestro vuelo ${displayFlightCode} (${activeRoute.originCode} ➔ ${activeRoute.destinationCode}) y nuestro viaje a España: ${shareUrl}`;
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

              const handleNativeShare = async () => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  try {
                    await navigator.share({
                      title: `Vuelo ${displayFlightCode} - España 2026`,
                      text: shareText,
                      url: shareUrl,
                    });
                  } catch (e) {
                    // Dialog closed or cancelled
                  }
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(shareText);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }
              };

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-mono break-all text-stone-700 text-left">
                    {shareUrl}
                  </div>

                  {/* Dos botones principales: WhatsApp y Compartir */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Botón WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Botón Compartir (Menú del sistema / Otras apps) */}
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir</span>
                    </button>
                  </div>

                  {/* Botón Copiar Enlace */}
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold text-xs text-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                    <span>{copiedLink ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace'}</span>
                  </button>
                </div>
              );
            })()}

            {/* Botón Cerrar en Rojo */}
            <div className="pt-3 mt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition cursor-pointer shadow-md shadow-red-600/20 flex items-center gap-1.5 border border-red-500 active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
