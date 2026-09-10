import React, { useState, useEffect } from 'react';
import { ItineraryDay, Tour, Traveler, DocumentItem } from '../types';
import { TourCard } from './TourCard';
import { MapPin, Plus, ChevronDown, ChevronUp, Ticket, CheckCircle2 } from 'lucide-react';
import { isDayCompletedAt10pm } from '../utils/dateUtils';

interface DaySectionProps {
  day: ItineraryDay;
  tours: Tour[];
  travelers: Traveler[];
  activeTravelerId: string;
  documents?: DocumentItem[];
  onToggleVisit: (tourId: string, travelerId: string) => void;
  onOpenTickets: (tour: Tour) => void;
  onEditTour: (tour: Tour) => void;
  onDeleteTour: (tourId: string) => void;
  onQuickChangeAlert: (tourId: string, hours: number) => void;
  onAddNewTourToDay: (dayNumber: number) => void;
  onUpdateTourTickets?: (tourId: string, tickets: any[]) => void;
}

export const DaySection: React.FC<DaySectionProps> = ({
  day,
  tours,
  travelers,
  activeTravelerId,
  documents,
  onToggleVisit,
  onOpenTickets,
  onEditTour,
  onDeleteTour,
  onQuickChangeAlert,
  onAddNewTourToDay,
  onUpdateTourTickets,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(day.dayNumber === 1);

  // Live timer every 30s to re-evaluate when 10:00 PM arrives in Spain / phone
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const safeTours = Array.isArray(tours) ? tours : [];

  const dayTours = safeTours
    .filter((t) => t.dayNumber === day.dayNumber)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Calculate if this day has any tours with admission tickets / entradas
  const safeDocs = Array.isArray(documents) ? documents : [];
  const dayTicketIds = new Set<string>();
  let toursWithTicketsCount = 0;

  dayTours.forEach((tour) => {
    const directTickets = Array.isArray(tour.tickets) ? tour.tickets : [];
    const docTickets = safeDocs.filter(
      (d) => d.tourId === tour.id && (d.category === 'entrada' || !d.category)
    );
    const tourTicketIds = new Set<string>();
    directTickets.forEach((t) => t.id && tourTicketIds.add(t.id));
    docTickets.forEach((d) => d.id && tourTicketIds.add(d.id));

    if (tourTicketIds.size > 0) {
      toursWithTicketsCount += 1;
      tourTicketIds.forEach((id) => dayTicketIds.add(id));
    }
  });

  const dayTicketsCount = dayTicketIds.size;
  const hasTourTickets = toursWithTicketsCount > 0 || dayTicketsCount > 0;

  // Check if this day has a real tour or excursion scheduled
  const hasScheduledTour = dayTours.some((tour) => {
    // Explicitly exclude flights, general transport/airport transfer, leisure/shopping, and food/tapas
    if (
      tour.category === 'vuelo' ||
      tour.category === 'transporte' ||
      tour.category === 'ocio' ||
      tour.category === 'gastronomia'
    ) {
      return false;
    }
    if (tour.category === 'excursion') return true;
    const title = (tour.title || '').toLowerCase();
    return (
      title.includes('tour') ||
      title.includes('excursión') ||
      title.includes('excursion') ||
      title.includes('visita oficial') ||
      title.includes('visita guiada') ||
      title.includes('palacio real') ||
      title.includes('sagrada familia') ||
      title.includes('parque güell') ||
      title.includes('parque guell')
    );
  });

  const isTourDay = hasTourTickets || hasScheduledTour;

  // Check if 10:00 PM in Spain has arrived or passed for this day
  const isPast10pmInSpain = isDayCompletedAt10pm(day.date, now);

  const activeUserVisitedOnDay = dayTours.filter((t) =>
    (t.visitedByUserIds || []).includes(activeTravelerId)
  ).length;

  const isDayCompletedByUser =
    dayTours.length > 0 && activeUserVisitedOnDay === dayTours.length;

  // Tour Fulfilled Rule: A tour day turns GREEN if 10 PM has arrived in Spain OR if marked visited
  const isFulfilledTourDay = isTourDay && (isPast10pmInSpain || isDayCompletedByUser);

  // Day turns GREEN if fulfilled tour or user marked complete
  const isGreenDay = isTourDay ? isFulfilledTourDay : (dayTours.length > 0 && isDayCompletedByUser);

  // Day turns YELLOW only if it is a tour day and has NOT yet reached 10 PM (pending)
  const isYellowDay = isTourDay && !isGreenDay;

  return (
    <div
      id={`day-section-${day.dayNumber}`}
      className={`rounded-2xl border-2 overflow-hidden shadow-xs transition-all ${
        isGreenDay && isTourDay
          ? 'bg-emerald-100/90 border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
          : isYellowDay
          ? 'bg-yellow-100/90 border-yellow-400 shadow-md ring-1 ring-yellow-400/40'
          : isGreenDay
          ? 'bg-emerald-50/80 border-emerald-300'
          : 'bg-stone-50/80 border-stone-200/90'
      }`}
    >
      <div
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
          isGreenDay && isTourDay
            ? 'bg-emerald-200/60 hover:bg-emerald-200/90'
            : isYellowDay
            ? 'bg-yellow-200/60 hover:bg-yellow-200/90'
            : isGreenDay
            ? 'bg-emerald-100/60 hover:bg-emerald-100/90'
            : 'hover:bg-stone-100/70'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs ${
              isGreenDay && isTourDay
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-xs'
                : isYellowDay
                ? 'bg-stone-900 text-yellow-400 ring-2 ring-yellow-400 shadow-xs'
                : isGreenDay
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 text-white'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-85 font-extrabold">DÍA</span>
            <span className="text-lg leading-none font-black">{day.dayNumber}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isGreenDay && isTourDay
                    ? 'text-emerald-950 bg-emerald-300 border border-emerald-400 font-extrabold'
                    : isYellowDay
                    ? 'text-yellow-950 bg-yellow-300 border border-yellow-400 font-extrabold'
                    : isGreenDay
                    ? 'text-emerald-900 bg-emerald-100'
                    : 'text-amber-800 bg-amber-100/80'
                }`}
              >
                {day.dayName}
              </span>
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  isGreenDay && isTourDay
                    ? 'text-emerald-900'
                    : isYellowDay
                    ? 'text-stone-800'
                    : 'text-stone-600'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isGreenDay && isTourDay ? 'text-emerald-700' : isYellowDay ? 'text-yellow-700' : 'text-stone-400'}`} />
                {day.city}
              </span>

              {isGreenDay && isTourDay && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Paseo Cumplido</span>
                </span>
              )}

              {hasTourTickets && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs ${
                    isGreenDay
                      ? 'bg-emerald-300 text-emerald-950 border border-emerald-400'
                      : 'bg-yellow-400 text-yellow-950 border border-yellow-500'
                  }`}
                >
                  <Ticket className="w-3 h-3" />
                  <span>{dayTicketsCount} {dayTicketsCount === 1 ? 'Entrada' : 'Entradas'}</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
              {day.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pl-15 sm:pl-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                isGreenDay && isTourDay
                  ? 'text-emerald-900'
                  : isYellowDay
                  ? 'text-stone-800'
                  : 'text-stone-500'
              }`}
            >
              {dayTours.length} {dayTours.length === 1 ? 'actividad' : 'actividades'}
            </span>
            {dayTours.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  isGreenDay && isTourDay
                    ? 'bg-emerald-300 text-emerald-950 border border-emerald-400 font-extrabold'
                    : isYellowDay
                    ? 'bg-yellow-300 text-yellow-950 border border-yellow-400 font-extrabold'
                    : isDayCompletedByUser
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200/80 text-stone-700'
                }`}
              >
                {activeUserVisitedOnDay}/{dayTours.length} visitados
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddNewTourToDay(day.dayNumber);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isGreenDay && isTourDay
                  ? 'text-emerald-950 bg-emerald-300 hover:bg-emerald-400 border border-emerald-400'
                  : isYellowDay
                  ? 'text-yellow-950 bg-yellow-300 hover:bg-yellow-400 border border-yellow-400'
                  : 'text-amber-700 bg-amber-100/80 hover:bg-amber-200'
              }`}
              title="Agregar tour a este día"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Tour</span>
            </button>

            <button
              type="button"
              className={`p-1 rounded-lg ${
                isGreenDay && isTourDay
                  ? 'text-emerald-800 hover:text-emerald-950'
                  : isYellowDay
                  ? 'text-stone-700 hover:text-stone-950'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          className={`p-4 sm:p-5 pt-0 space-y-3 ${
            isGreenDay && isTourDay
              ? 'bg-emerald-100/90'
              : isYellowDay
              ? 'bg-yellow-100/90'
              : ''
          }`}
        >
          {dayTours.length === 0 ? (
            <div
              className={`text-center py-6 px-4 rounded-xl border border-dashed ${
                isGreenDay
                  ? 'bg-white/80 border-emerald-400/80'
                  : isYellowDay
                  ? 'bg-white/80 border-yellow-400/80'
                  : 'bg-white border-stone-200'
              }`}
            >
              <p className="text-xs text-stone-500">No hay tours programados para este día aún.</p>
              <button
                type="button"
                onClick={() => onAddNewTourToDay(day.dayNumber)}
                className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar la primera actividad de este día
              </button>
            </div>
          ) : (
            <>
              {dayTours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  travelers={travelers}
                  activeTravelerId={activeTravelerId}
                  onToggleVisit={onToggleVisit}
                  onOpenTickets={onOpenTickets}
                  onEditTour={onEditTour}
                  onDeleteTour={onDeleteTour}
                  onQuickChangeAlert={onQuickChangeAlert}
                  onUpdateTourTickets={onUpdateTourTickets}
                />
              ))}

              <div className="pt-2 flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => onAddNewTourToDay(day.dayNumber)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="Agregar nueva actividad o tour a este día"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo Tour</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
