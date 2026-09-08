import React, { useState } from 'react';
import { ItineraryDay, Tour, Traveler, DocumentItem } from '../types';
import { TourCard } from './TourCard';
import { MapPin, Plus, ChevronDown, ChevronUp, Ticket } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
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

  const activeUserVisitedOnDay = dayTours.filter((t) =>
    (t.visitedByUserIds || []).includes(activeTravelerId)
  ).length;

  const isDayCompleted =
    dayTours.length > 0 && activeUserVisitedOnDay === dayTours.length;

  return (
    <div
      id={`day-section-${day.dayNumber}`}
      className={`rounded-2xl border-2 overflow-hidden shadow-xs transition-all ${
        hasTourTickets
          ? 'bg-yellow-100/90 border-yellow-400 shadow-md ring-1 ring-yellow-400/40'
          : 'bg-stone-50/80 border-stone-200/90'
      }`}
    >
      <div
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
          hasTourTickets
            ? 'bg-yellow-200/60 hover:bg-yellow-200/90'
            : 'hover:bg-stone-100/70'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs ${
              isDayCompleted
                ? 'bg-emerald-600 text-white'
                : hasTourTickets
                ? 'bg-stone-900 text-yellow-400 ring-2 ring-yellow-400 shadow-xs'
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
                  hasTourTickets
                    ? 'text-yellow-950 bg-yellow-300 border border-yellow-400 font-extrabold'
                    : 'text-amber-800 bg-amber-100/80'
                }`}
              >
                {day.dayName}
              </span>
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  hasTourTickets ? 'text-stone-800' : 'text-stone-600'
                }`}
              >
                <MapPin className={`w-3 h-3 ${hasTourTickets ? 'text-yellow-700' : 'text-stone-400'}`} />
                {day.city}
              </span>

              {hasTourTickets && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-yellow-950 border border-yellow-500 shadow-2xs">
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
            <span className={`text-xs font-semibold ${hasTourTickets ? 'text-stone-800' : 'text-stone-500'}`}>
              {dayTours.length} {dayTours.length === 1 ? 'actividad' : 'actividades'}
            </span>
            {dayTours.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  isDayCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : hasTourTickets
                    ? 'bg-yellow-300 text-yellow-950 border border-yellow-400 font-extrabold'
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
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                hasTourTickets
                  ? 'text-yellow-950 bg-yellow-300 hover:bg-yellow-400 border border-yellow-400'
                  : 'text-amber-700 bg-amber-100/80 hover:bg-amber-200'
              }`}
              title="Agregar tour a este día"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            <button
              type="button"
              className={`p-1 rounded-lg ${
                hasTourTickets ? 'text-stone-700 hover:text-stone-950' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`p-4 sm:p-5 pt-0 space-y-3 ${hasTourTickets ? 'bg-yellow-100/90' : ''}`}>
          {dayTours.length === 0 ? (
            <div className={`text-center py-6 px-4 rounded-xl border border-dashed ${
              hasTourTickets
                ? 'bg-white/80 border-yellow-400/80'
                : 'bg-white border-stone-200'
            }`}>
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
            dayTours.map((tour) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
};
