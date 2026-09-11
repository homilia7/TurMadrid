import React, { useState, useEffect } from 'react';
import { Plane, Clock, ArrowRight } from 'lucide-react';

interface FlightCountdownProps {
  departureTimeIso?: string; // default: '2026-09-10T23:20:00-06:00'
  arrivalTimeIso?: string;   // default: '2026-09-11T17:35:00+02:00'
  flightNumber?: string;     // default: 'E9 858'
  airline?: string;          // default: 'Iberojet'
  originName?: string;       // default: 'San José (SJO)'
  destinationName?: string;  // default: 'Madrid (MAD)'
  onViewFlights?: () => void;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  phase: 'countdown' | 'boarding' | 'inflight' | 'arrived';
}

export const FlightCountdown: React.FC<FlightCountdownProps> = ({
  departureTimeIso = '2026-09-10T23:20:00-06:00',
  arrivalTimeIso = '2026-09-11T17:35:00+02:00',
  flightNumber = 'E9 858',
  airline = 'Iberojet',
  originName = 'San José (SJO)',
  destinationName = 'Madrid (MAD)',
  onViewFlights,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => calculateTime());

  function calculateTime(): TimeRemaining {
    const now = new Date().getTime();
    const depTime = new Date(departureTimeIso).getTime();
    const arrTime = new Date(arrivalTimeIso).getTime();

    if (now >= arrTime) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, phase: 'arrived' };
    }

    if (now >= depTime && now < arrTime) {
      const remainingToLand = arrTime - now;
      const h = Math.floor(remainingToLand / (1000 * 60 * 60));
      const m = Math.floor((remainingToLand % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remainingToLand % (1000 * 60)) / 1000);
      return { days: 0, hours: h, minutes: m, seconds: s, totalMs: remainingToLand, phase: 'inflight' };
    }

    const diff = depTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isBoarding = diff <= 60 * 60 * 1000; // Última hora antes de despegue

    return {
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
      totalMs: diff,
      phase: isBoarding ? 'boarding' : 'countdown',
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [departureTimeIso, arrivalTimeIso]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 shadow-2xl border border-amber-500/30 ${className}`}
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                {timeRemaining.phase === 'arrived'
                  ? '🇪🇸 ¡Bienvenidos a España!'
                  : timeRemaining.phase === 'inflight'
                  ? '✈️ Vuelo en Curso (Sobre el Atlántico)'
                  : timeRemaining.phase === 'boarding'
                  ? '🚨 ¡Abordaje en Progreso en SJO!'
                  : '⏳ Cuenta Regresiva para el Vuelo'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {airline} {flightNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              San José (SJO) 🇨🇷 ➔ Madrid-Barajas (MAD) 🇪🇸
            </p>
          </div>
        </div>

        {onViewFlights && (
          <button
            type="button"
            onClick={onViewFlights}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>Ver Boletos</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Countdown Numbers Display */}
      {timeRemaining.phase === 'countdown' || timeRemaining.phase === 'boarding' ? (
        <div className="relative z-10 my-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
            {/* Days */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg relative overflow-hidden group">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {pad(timeRemaining.days)}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                Días
              </span>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40" />
            </div>

            {/* Hours */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg relative overflow-hidden group">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {pad(timeRemaining.hours)}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                Horas
              </span>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-40" />
            </div>

            {/* Minutes */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg relative overflow-hidden group">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {pad(timeRemaining.minutes)}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                Minutos
              </span>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-40" />
            </div>

            {/* Seconds */}
            <div className="bg-gradient-to-b from-amber-500/20 to-slate-900/90 border border-amber-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg relative overflow-hidden ring-1 ring-amber-400/20">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-amber-300 animate-pulse">
                {pad(timeRemaining.seconds)}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300/80 mt-1 block">
                Segundos
              </span>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </div>
          </div>
        </div>
      ) : timeRemaining.phase === 'inflight' ? (
        <div className="relative z-10 my-4 bg-sky-950/40 border border-sky-500/30 rounded-2xl p-4 text-center">
          <p className="text-sm sm:text-base font-bold text-sky-200">
            ✈️ El avión ya despegó de San José rumbo a Madrid.
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Tiempo estimado restante de vuelo hasta aterrizar en Barajas:{' '}
            <span className="font-mono font-bold text-emerald-400">
              {pad(timeRemaining.hours)}h {pad(timeRemaining.minutes)}m {pad(timeRemaining.seconds)}s
            </span>
          </p>
        </div>
      ) : (
        <div className="relative z-10 my-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <p className="text-base sm:text-lg font-black text-emerald-300">
            🇪🇸 ¡Bienvenidos a España! El vuelo ha aterrizado en Madrid Barajas (Terminal 1).
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Que comience la gran aventura por Europa.
          </p>
        </div>
      )}

      {/* Route & Times Context Grid */}
      <div className="relative z-10 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Origin Departure */}
        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-start gap-2.5">
          <div className="text-lg">🇨🇷</div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              Salida San José (SJO)
            </span>
            <span className="font-bold text-amber-300 block text-xs sm:text-sm">
              Jueves 10 Sept • 11:20 PM
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Hora Costa Rica (GMT-6)</span>
          </div>
        </div>

        {/* Airport Recommendation */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">
              Llegar al Aeropuerto SJO
            </span>
            <span className="font-black text-white block text-xs sm:text-sm">
              Jueves 10 Sept • 8:20 PM
            </span>
            <span className="text-[10px] text-amber-300/80">3 horas antes para Check-in y Maletas</span>
          </div>
        </div>

        {/* Destination Arrival */}
        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-start gap-2.5">
          <div className="text-lg">🇪🇸</div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              Llegada Madrid Barajas (MAD)
            </span>
            <span className="font-bold text-emerald-400 block text-xs sm:text-sm">
              Viernes 11 Sept • 5:35 PM
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Hora España (GMT+2) • Terminal 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
