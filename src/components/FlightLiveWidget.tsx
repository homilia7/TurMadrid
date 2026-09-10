import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, ArrowRight, Sparkles, Navigation, Globe } from 'lucide-react';
import { getDualTimezoneStrings, getDualClocks } from '../utils/timeUtils';
import { RealisticAirplane } from './RealisticAirplane';

interface FlightLiveWidgetProps {
  flightNumber?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  terminal?: string;
  gate?: string;
}

export const FlightLiveWidget: React.FC<FlightLiveWidgetProps> = ({
  flightNumber = 'E9 858',
  airline = 'Iberojet',
  origin = 'San José (SJO)',
  destination = 'Madrid-Barajas (MAD)',
  departureTime = '2026-09-10T23:20:00-06:00',
  arrivalTime = '2026-09-11T17:35:00+02:00',
  terminal = 'Terminal 1',
  gate = 'Por asignar',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clocks = getDualClocks(currentTime);

  const depDate = new Date(departureTime);
  const arrDate = new Date(arrivalTime);

  const totalDurationMs = arrDate.getTime() - depDate.getTime();
  const elapsedMs = currentTime.getTime() - depDate.getTime();

  const isBeforeFlight = currentTime < depDate;
  const isFlightActive = currentTime >= depDate && currentTime <= arrDate;
  const isFlightCompleted = currentTime > arrDate;

  let progressPercent = 0;
  let statusText = 'Programado a tiempo';
  let statusColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';

  const diffMs = depDate.getTime() - currentTime.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diffHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const diffMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
  const diffSecs = Math.max(0, Math.floor((diffMs % (1000 * 60)) / 1000));

  if (isBeforeFlight) {
    // ANTES DEL JUEVES 11:20 PM: ANIMACIÓN INACTIVA, PROGRESO EN 0% Y AVIÓN EN TIERRA (SJO)
    progressPercent = 0;
    statusText = `Salida en ${diffDays}d ${diffHours}h ${diffMins}m ${diffSecs}s`;
    statusColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  } else if (isFlightActive) {
    // A PARTIR DEL JUEVES 11:20 PM: ANIMACIÓN Y TRAYECTO ACTIVO EN VIVO
    progressPercent = Math.min(98, Math.max(2, Math.round((elapsedMs / totalDurationMs) * 100)));
    if (progressPercent < 30) {
      statusText = '🛫 Despegado - Ascenso inicial sobre el Caribe';
      statusColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    } else if (progressPercent < 80) {
      statusText = '✈️ En ruta transatlántica (Océano Atlántico)';
      statusColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30';
    } else {
      statusText = '🛬 Descenso y aproximación a Madrid';
      statusColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    }
  } else {
    // DESPUÉS DEL ATERRIZAJE
    progressPercent = 100;
    statusText = '✅ Vuelo completado - Aterrizado en Madrid Terminal 1';
    statusColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800">
      {/* Background World Map Graphic Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">{airline} • {flightNumber}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                {statusText}
              </span>
            </div>
            <p className="text-xs text-slate-400">Trayecto Transatlántico en Tiempo Real</p>
          </div>
        </div>

        {/* Dual Clocks (Relojes en vivo de hora actual) */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">🇨🇷 Hora Actual en Costa Rica</span>
            <span className="font-mono font-bold text-amber-300">{clocks.costaRicaTime}</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">🇪🇸 Hora Actual en Madrid (+8h)</span>
            <span className="font-mono font-bold text-emerald-400">{clocks.spainTime}</span>
          </div>
        </div>
      </div>

      {/* Route Info: Origin & Destination Cards */}
      <div className="relative z-10 my-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
          {/* Origin */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-2xl sm:text-3xl shrink-0">🇨🇷</span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">SJO</span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Origen</span>
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">San José</p>
              <p className="text-[11px] text-amber-300 font-mono font-bold">23:20 (GMT-6)</p>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 text-right">
            <div className="min-w-0">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Destino</span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">MAD</span>
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">Madrid Barajas</p>
              <p className="text-[11px] text-emerald-400 font-mono font-bold truncate">17:35 (GMT+2) • {terminal}</p>
            </div>
            <span className="text-2xl sm:text-3xl shrink-0">🇪🇸</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN ESPECIAL INDEPENDIENTE: LÍNEA DE TIEMPO Y TRAYECTORIA EN VIVO */}
      <div className="relative z-10 my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-700/60 shadow-xl overflow-hidden">
        {/* Cabecera de la sección de línea de tiempo */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Línea de Tiempo del Vuelo (Trayecto Transatlántico)
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono font-bold text-slate-300">
              {isBeforeFlight ? 'En Espera (0%)' : isFlightActive ? `${progressPercent}% en vuelo` : '100% Completado'}
            </span>
          </div>
        </div>

        {/* Contenedor del riel / pista horizontal completa */}
        <div className="relative pt-6 pb-6 px-4 sm:px-8">
          {/* Riel base */}
          <div className="relative w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
            {/* Progreso recorrido */}
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                isFlightActive
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : isFlightCompleted
                  ? 'bg-emerald-500'
                  : 'bg-transparent'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Puntos de referencia / waypoints sobre el riel */}
          <div className="absolute top-6 left-4 right-4 sm:left-8 sm:right-8 pointer-events-none flex justify-between h-2.5 items-center">
            {/* Hito 0: SJO */}
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" title="San José (SJO)"></div>
            {/* Hito 1: Caribe (~25%) */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 ring-2 ring-slate-900" title="Caribe"></div>
            {/* Hito 2: Océano Atlántico (~50%) */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 ring-2 ring-slate-900" title="Océano Atlántico"></div>
            {/* Hito 3: Península Ibérica (~75%) */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 ring-2 ring-slate-900" title="Península Ibérica"></div>
            {/* Hito 4: MAD */}
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" title="Madrid (MAD)"></div>
          </div>

          {/* EL AVIÓN (SIN BORDE, TAL COMO PIDIÓ EL USUARIO) */}
          <div
            className="absolute top-6 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 pointer-events-none z-20 flex items-center justify-center"
            style={{
              left: isBeforeFlight
                ? '16px'
                : isFlightCompleted
                ? 'calc(100% - 16px)'
                : `${Math.max(4, Math.min(96, progressPercent))}%`,
            }}
          >
            <RealisticAirplane
              direction="right"
              className={`w-8 h-8 sm:w-10 sm:h-10 text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.95)] ${
                isFlightActive ? 'animate-pulse' : ''
              }`}
            />
          </div>

          {/* Etiquetas de Waypoints distribuidas debajo del riel */}
          <div className="flex justify-between items-start text-[10px] sm:text-xs font-bold text-slate-400 mt-4 px-0">
            <div className="text-left">
              <span className="block text-white font-black">SJO</span>
              <span className="text-[9px] text-amber-300">Costa Rica</span>
            </div>
            <div className="text-center">
              <span className={isFlightActive && progressPercent >= 15 && progressPercent < 40 ? 'text-amber-300 font-black' : ''}>
                Caribe
              </span>
            </div>
            <div className="text-center">
              <span className={isFlightActive && progressPercent >= 40 && progressPercent < 75 ? 'text-sky-300 font-black' : ''}>
                Océano Atlántico
              </span>
            </div>
            <div className="text-center">
              <span className={isFlightActive && progressPercent >= 75 && progressPercent < 95 ? 'text-emerald-300 font-black' : ''}>
                Península Ibérica
              </span>
            </div>
            <div className="text-right">
              <span className="block text-white font-black">MAD</span>
              <span className="text-[9px] text-emerald-400">España</span>
            </div>
          </div>
        </div>

        {/* Banner de Estado / Notificación cuando el vuelo aún no sale */}
        {isBeforeFlight && (
          <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-center gap-2 text-center">
            <Plane className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 font-medium">
              La animación del vuelo se activará en tiempo real el <strong>Jueves 10 Sept a las 11:20 PM</strong> al despegar de San José.
            </p>
          </div>
        )}

        {isFlightActive && (
          <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center gap-2 text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <p className="text-xs text-emerald-300 font-bold">
              {statusText}
            </p>
          </div>
        )}
      </div>

      {/* Real-time Countdown Box (Before Departure) */}
      {currentTime < depDate && (
        <div className="relative z-10 my-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-indigo-500/10 border border-amber-400/30 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ⏳ Cuenta Regresiva para el Vuelo
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              Salida: Jueves 10 Sept • <strong className="text-amber-300">11:20 PM</strong> (Hora Costa Rica)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center max-w-md mx-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(diffDays).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Días</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(diffHours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Horas</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(diffMins).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minutos</span>
            </div>
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-2 ring-1 ring-amber-400/20">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 animate-pulse block">
                {String(diffSecs).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-amber-300/90 uppercase tracking-wider">Segundos</span>
            </div>
          </div>

          <div className="mt-2.5 text-center">
            <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-block">
              🕒 Recomendación: Llegar al Aeropuerto SJO a las <strong>8:20 PM</strong> (3 horas antes)
            </span>
          </div>
        </div>
      )}

      {/* Footer Info Details */}
      <div className="relative z-10 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-400 block">Duración Estimada</span>
          <span className="font-bold font-mono">11h 10m (Directo)</span>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-400 block">Terminal & Puerta</span>
          <span className="font-bold text-amber-300">{terminal} • {gate}</span>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-400 block">Diferencia Horaria</span>
          <span className="font-bold text-sky-300">+8 Horas (España)</span>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-400 block">Clima Estimado</span>
          <span className="font-bold text-emerald-300">Madrid 24°C ☀️</span>
        </div>
      </div>
    </div>
  );
};
