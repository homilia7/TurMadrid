import React, { useState } from 'react';
import { Tour, Traveler } from '../types';
import {
  Clock,
  MapPin,
  Ticket as TicketIcon,
  Bell,
  CheckCircle2,
  Circle,
  Compass,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  Calendar,
  QrCode,
  Lock,
  AlertTriangle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDateShortWithDay } from '../utils/dateUtils';
import { LargeQRModal } from './LargeQRModal';

interface TourCardProps {
  tour: Tour;
  travelers: Traveler[];
  activeTravelerId: string;
  onToggleVisit: (tourId: string, travelerId: string) => void;
  onOpenTickets: (tour: Tour) => void;
  onEditTour: (tour: Tour) => void;
  onDeleteTour: (tourId: string) => void;
  onQuickChangeAlert: (tourId: string, hours: number) => void;
  onUpdateTourTickets?: (tourId: string, tickets: any[]) => void;
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
  onUpdateTourTickets,
}) => {
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [pinError, setPinError] = useState(false);

  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const activeTraveler = safeTravelers.find((t) => t.id === activeTravelerId);
  const visitedList = Array.isArray(tour.visitedByUserIds) ? tour.visitedByUserIds : [];
  const ticketList = Array.isArray(tour.tickets) ? tour.tickets : [];

  const isVisitedByActive = visitedList.includes(activeTravelerId);
  const visitedCount = visitedList.length;
  const isAllVisited = visitedCount === 5;
  const primaryTicket = ticketList.length > 0 ? ticketList[0] : null;

  const handleActiveToggle = () => {
    onToggleVisit(tour.id, activeTravelerId);
    if (!isVisitedByActive) {
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
    const wasVisited = visitedList.includes(travelerId);
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
        {/* Top meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-stone-950" />
              {formatDateShortWithDay(tour.date)}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-900 text-white">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {tour.time}
            </span>

            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
              {tour.city}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 capitalize">
              {tour.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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
                <span>{tour.alertHoursBefore || 3}h antes</span>
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
                setDeletePin('');
                setPinError(false);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Eliminar tour (requiere código de 4 dígitos)"
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenTickets(tour)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center sm:justify-start gap-2 transition-all ${
                ticketList.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="Ver, subir o descargar entradas de este tour"
            >
              <TicketIcon className="w-4 h-4" />
              <span>
                {ticketList.length > 0
                  ? `Entradas (${ticketList.length})`
                  : 'Subir Entradas'}
              </span>
            </button>

            {ticketList.length > 0 && (
              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 transition-all shadow-xs border border-stone-700 cursor-pointer"
                title="Abrir Código QR en grande para escaneo en acceso"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Entrada QR</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200/70">
            <div className="text-[11px] font-bold text-stone-500 pl-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>Visitas:</span>
              <span className={`font-mono text-xs ${isAllVisited ? 'text-emerald-600 font-bold' : 'text-stone-700'}`}>
                {visitedCount}/5
              </span>
            </div>

            <div className="flex items-center gap-1">
              {safeTravelers.map((traveler) => {
                const visited = visitedList.includes(traveler.id);
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

      {/* Large QR Modal when accessed directly from TourCard */}
      {ticketList.length > 0 && (
        <LargeQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          title={tour.title}
          tickets={ticketList}
          travelers={safeTravelers}
          initialTicketId={primaryTicket?.id}
          date={tour.date}
          time={tour.time}
          location={tour.location}
          onSaveCrop={
            onUpdateTourTickets
              ? async (croppedDataUrl, detectedQR, targetTicketId) => {
                  const targetId = targetTicketId || primaryTicket?.id;
                  const updatedTickets = ticketList.map((t) =>
                    t.id === targetId
                      ? {
                          ...t,
                          qrCropUrl: croppedDataUrl,
                          qrCodeText: detectedQR || t.qrCodeText,
                          referenceNumber: t.referenceNumber || (detectedQR && detectedQR.length <= 20 && !detectedQR.includes('://') ? detectedQR : 'ESP-GRUPO-5'),
                        }
                      : t
                  );
                  const updatedDoc = updatedTickets.find((t) => t.id === targetId);
                  if (updatedDoc) {
                    await uploadDocumentToCloud(updatedDoc);
                  }
                  onUpdateTourTickets(tour.id, updatedTickets);
                }
              : undefined
          }
        />
      )}

      {/* 4-Digit PIN Confirmation Modal for Deleting Tour (Security Code: 8888) */}
      {isDeleteModalOpen && (
        <div
          id="delete-tour-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            id="delete-tour-modal-card"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-200 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-stone-900">
              Confirmar Borrado de Tour
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Para eliminar <strong className="text-stone-900">"{tour.title}"</strong>, introduce el código de seguridad de 4 dígitos:
            </p>

            <div className="my-4">
              <input
                id="input-delete-tour-pin"
                type="password"
                maxLength={4}
                autoFocus
                value={deletePin}
                onChange={(e) => {
                  setDeletePin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (deletePin.trim() === '8888') {
                      setIsDeleteModalOpen(false);
                      onDeleteTour(tour.id);
                    } else {
                      setPinError(true);
                    }
                  }
                }}
                placeholder="••••"
                className={`w-36 text-center text-2xl font-mono font-black tracking-widest py-2 px-3 rounded-xl border ${
                  pinError
                    ? 'border-red-500 bg-red-50 text-red-600 ring-2 ring-red-300'
                    : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200'
                } focus:outline-none transition-all`}
              />

              {pinError && (
                <p className="text-xs text-red-600 font-bold mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Código incorrecto.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-delete-tour"
                type="button"
                onClick={() => {
                  if (deletePin.trim() === '8888') {
                    setIsDeleteModalOpen(false);
                    onDeleteTour(tour.id);
                  } else {
                    setPinError(true);
                  }
                }}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
