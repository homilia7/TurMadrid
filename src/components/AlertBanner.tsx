import React from 'react';
import { Tour } from '../types';
import { Bell, Compass, Ticket, ChevronRight } from 'lucide-react';
import { calculateTourAlertStatus } from '../utils/alertManager';

interface AlertBannerProps {
  tours: Tour[];
  defaultAlertHours: number;
  onOpenAlertSettings: () => void;
  onOpenTickets: (tour: Tour) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  tours,
  defaultAlertHours,
  onOpenAlertSettings,
  onOpenTickets,
}) => {
  const now = new Date();
  const safeTours = Array.isArray(tours) ? tours : [];

  const sortedUpcoming = safeTours
    .map((t) => calculateTourAlertStatus(t, now))
    .filter((status) => !status.isPast)
    .sort((a, b) => a.tourDateTime.getTime() - b.tourDateTime.getTime());

  const activeAlertStatus = Array.isArray(sortedUpcoming)
    ? sortedUpcoming.find((s) => s && s.isInAlertWindow)
    : null;
  const nextUpcoming = Array.isArray(sortedUpcoming) ? sortedUpcoming[0] : null;

  const featured = activeAlertStatus || nextUpcoming;

  if (!featured) {
    return null;
  }

  const isAlertTriggered = featured.isInAlertWindow;
  const ticketCount = Array.isArray(featured.tour.tickets) ? featured.tour.tickets.length : 0;

  return (
    <div
      id="tour-alert-banner"
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
        isAlertTriggered
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg border-amber-400 animate-pulse'
          : 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white shadow-md border-stone-800'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isAlertTriggered
                ? 'bg-white text-amber-600 shadow-md font-bold'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Bell className={`w-5 h-5 ${isAlertTriggered ? 'animate-bounce' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAlertTriggered
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}
              >
                {isAlertTriggered
                  ? `¡Alerta Activa! (${featured.tour.alertHoursBefore}h antes)`
                  : `Próximo Tour • ${featured.timeUntilTourText}`}
              </span>

              <span className="text-xs text-stone-300">
                {featured.tour.date} a las {featured.tour.time}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold mt-1 text-white leading-tight">
              {featured.tour.title} ({featured.tour.city})
            </h3>

            {featured.tour.meetingPoint && (
              <p className="text-xs text-stone-200 mt-1 flex items-center gap-1.5 opacity-90">
                <Compass className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Punto de encuentro: <strong>{featured.tour.meetingPoint}</strong></span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {ticketCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenTickets(featured.tour)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5" />
              Ver Entradas ({ticketCount})
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAlertSettings}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Configurar Alerta ({defaultAlertHours}h)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
