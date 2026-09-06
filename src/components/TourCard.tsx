import React, { useState } from 'react';
import { Tour, Traveler } from '../types';
import {
  Clock,
  MapPin,
  Ticket as TicketIcon,
  Bell,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  Compass,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TourCardProps {
  tour: Tour;
  travelers: Traveler[];
  activeTravelerId: string;
  onToggleVisit: (tourId: string, travelerId: string) => void;
  onOpenTickets: (tour: Tour) => void;
  onEditTour: (tour: Tour) => void;
  onDeleteTour: (tourId: string) => void;
  onQuickChangeAlert: (tourId: string, hours: number) => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  travelers,
  activeTravelerId,
  onToggleVisit,
  onOpenTickets,
  onEditTour,
  onDeleteTour,
  onQuickChangeAlert,
}) => {
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const activeTraveler = travelers.find((t) => t.id === activeTravelerId);
  const isVisitedByActive = tour.visitedByUserIds.includes(activeTravelerId);
  const visitedCount = tour.visitedByUserIds.length;
  const isAllVisited = visitedCount === 5;

  const handleActiveToggle = () => {
    onToggleVisit(tour.id, activeTravelerId);
    if (!isVisitedByActive) {
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // fallback
      }
    }
  };

  const handleTravelerToggle = (travelerId: string) => {
    const wasVisited = tour.visitedByUserIds.includes(travelerId);
    onToggleVisit(tour.id, travelerId);
    if (!wasVisited) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
        });
      } catch {
        // fallback
      }
    }
  };

  return (
    <div
      id={`tour-card-${tour.id}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white ${
        isAllVisited
          ? 'border-emerald-300 bg-emerald-50/15 shadow-xs'
          : isVisitedByActive
          ? 'border-amber-200 shadow-xs'
          : 'border-stone-200 shadow-xs hover:border-stone-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top meta bar: Time, Category, City, Alert, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-900 text-white">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {tour.time}
            </span>

            {/* City */}
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
              {tour.city}
            </span>

            {/* Category tag */}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 capitalize">
              {tour.category}
            </span>
          </div>

          {/* Right: Alert Badge + Tour options */}
          <div className="flex items-center gap-1.5">
            {/* Alert badge with quick hours dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAlertMenu(!showAlertMenu)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  tour.alertEnabled
                    ? 'bg-amber-100/90 text-amber-900 hover:bg-amber-200/80'
                    : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                }`}
                title="Configurar anticipación de alerta para este tour"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>{tour.alertHoursBefore}h antes</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showAlertMenu && (
                <div className="absolute right-0 top-8 z-30 bg-white rounded-xl shadow-xl border border-stone-200 p-2 w-48 text-left">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                    Cambiar alerta previa:
                  </span>
                  {[2, 3, 4, 5, 12].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => {
                        onQuickChangeAlert(tour.id, hours);
                        setShowAlertMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                        tour.alertHoursBefore === hours
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{hours} horas antes</span>
                      {tour.alertHoursBefore === hours && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit / Delete */}
            <button
              type="button"
              onClick={() => onEditTour(tour)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Editar tour"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Deseas eliminar el tour "${tour.title}"?`)) {
                  onDeleteTour(tour.id);
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 transition-colors"
              title="Eliminar tour"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tour Title and Description */}
        <div className="mt-3">
          <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
            {tour.title}
          </h4>

          {tour.description && (
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              {tour.description}
            </p>
          )}

          {/* Location and Meeting Point Highlights */}
          <div className="mt-3 space-y-1.5 text-xs">
            {tour.location && (
              <div className="flex items-start gap-2 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>{tour.location}</span>
              </div>
            )}
            {tour.meetingPoint && (
              <div className="flex items-start gap-2 text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/50">
                <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium">
                  <span className="font-bold">Punto de encuentro: </span>
                  {tour.meetingPoint}
                </span>
              </div>
            )}
            {tour.notes && (
              <div className="flex items-start gap-2 text-stone-500 italic text-[11px]">
                <span className="font-bold not-italic">Nota:</span> {tour.notes}
              </div>
            )}
          </div>
        </div>

        {/* Tickets button & 5 Users Visit Marking Section */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Entradas Button (Subir, Ver en Línea, Descargar) */}
          <button
            type="button"
            onClick={() => onOpenTickets(tour)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center sm:justify-start gap-2 transition-all ${
              tour.tickets.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Ver, subir o descargar entradas de este tour"
          >
            <TicketIcon className="w-4 h-4" />
            <span>
              {tour.tickets.length > 0
                ? `Entradas (${tour.tickets.length}) - Ver / Descargar`
                : 'Subir Entradas del Tour'}
            </span>
          </button>

          {/* Multi-Traveler Checkmarks (5 Users) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200/70">
            <div className="text-[11px] font-bold text-stone-500 pl-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>Visitas:</span>
              <span className={`font-mono text-xs ${isAllVisited ? 'text-emerald-600 font-bold' : 'text-stone-700'}`}>
                {visitedCount}/5
              </span>
            </div>

            {/* 5 User avatar toggles */}
            <div className="flex items-center gap-1">
              {travelers.map((traveler) => {
                const visited = tour.visitedByUserIds.includes(traveler.id);
                return (
                  <button
                    key={traveler.id}
                    type="button"
                    onClick={() => handleTravelerToggle(traveler.id)}
                    className={`relative w-7 h-7 rounded-full text-[10px] font-bold transition-all flex items-center justify-center ${
                      visited
                        ? 'ring-2 ring-emerald-500 text-white shadow-xs scale-105'
                        : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0'
                    }`}
                    style={{ backgroundColor: traveler.avatarColor }}
                    title={`${traveler.name}: ${visited ? 'Visitado (clic para desmarcar)' : 'No visitado (clic para marcar)'}`}
                  >
                    {visited ? '✓' : traveler.name.substring(0, 1).toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Quick 1-click button for current active user */}
            <button
              type="button"
              onClick={handleActiveToggle}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                isVisitedByActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-stone-300 text-stone-700 hover:border-stone-400'
              }`}
              title={`Marcar o desmarcar para ${activeTraveler?.name}`}
            >
              {isVisitedByActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Visitado</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Marcar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
