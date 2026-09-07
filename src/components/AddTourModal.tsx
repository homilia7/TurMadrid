import React, { useState, useEffect } from 'react';
import { Tour, ItineraryDay, TourCategory } from '../types';
import { INITIAL_DAYS } from '../data/initialItinerary';
import { Calendar, Clock, MapPin, Tag, Plus, Check, X, Bell } from 'lucide-react';

interface AddTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  days?: ItineraryDay[];
  onSaveTour: (tour: Tour) => void;
  initialDayNumber?: number;
  defaultDayNumber?: number;
  editingTour?: Tour | null;
  defaultAlertHours?: number;
}

const CATEGORIES: { value: TourCategory; label: string; icon: string }[] = [
  { value: 'cultura', label: 'Cultura y Monumentos', icon: '🏛️' },
  { value: 'excursion', label: 'Excursión Guiada', icon: '🚌' },
  { value: 'transporte', label: 'Transporte / Tren / AVE', icon: '🚆' },
  { value: 'gastronomia', label: 'Gastronomía y Tapas', icon: '🍷' },
  { value: 'ocio', label: 'Paseo Libre y Ocio', icon: '🛍️' },
  { value: 'vuelo', label: 'Vuelo Internacional', icon: '✈️' },
];

export const AddTourModal: React.FC<AddTourModalProps> = ({
  isOpen,
  onClose,
  days,
  onSaveTour,
  initialDayNumber,
  defaultDayNumber,
  editingTour = null,
  defaultAlertHours = 3,
}) => {
  const safeDays = Array.isArray(days) && days.length > 0 ? days : INITIAL_DAYS;
  const initialDay = initialDayNumber || defaultDayNumber || 1;

  const [dayNumber, setDayNumber] = useState<number>(
    editingTour ? editingTour.dayNumber : initialDay
  );

  const [title, setTitle] = useState<string>(editingTour?.title || '');
  const [date, setDate] = useState<string>(editingTour?.date || '2026-09-13');
  const [time, setTime] = useState<string>(editingTour?.time || '10:00');
  const [city, setCity] = useState<string>(editingTour?.city || 'Madrid');
  const [category, setCategory] = useState<TourCategory>(editingTour?.category || 'cultura');
  const [location, setLocation] = useState<string>(editingTour?.location || '');
  const [meetingPoint, setMeetingPoint] = useState<string>(editingTour?.meetingPoint || '');
  const [description, setDescription] = useState<string>(editingTour?.description || '');
  const [durationHours, setDurationHours] = useState<number>(editingTour?.durationHours || 2.5);
  const [alertHoursBefore, setAlertHoursBefore] = useState<number>(
    editingTour ? editingTour.alertHoursBefore : defaultAlertHours
  );
  const [alertEnabled, setAlertEnabled] = useState<boolean>(
    editingTour ? editingTour.alertEnabled : true
  );
  const [notes, setNotes] = useState<string>(editingTour?.notes || '');

  useEffect(() => {
    if (!isOpen) return;

    if (editingTour) {
      setDayNumber(editingTour.dayNumber);
      setTitle(editingTour.title || '');
      setDate(editingTour.date || '');
      setTime(editingTour.time || '10:00');
      setCity(editingTour.city || 'Madrid');
      setCategory(editingTour.category || 'cultura');
      setLocation(editingTour.location || '');
      setMeetingPoint(editingTour.meetingPoint || '');
      setDescription(editingTour.description || '');
      setDurationHours(editingTour.durationHours || 2.5);
      setAlertHoursBefore(editingTour.alertHoursBefore || defaultAlertHours);
      setAlertEnabled(editingTour.alertEnabled ?? true);
      setNotes(editingTour.notes || '');
    } else {
      const chosenDay = safeDays.find((d) => d.dayNumber === initialDay) || safeDays[0];
      setDayNumber(chosenDay ? chosenDay.dayNumber : initialDay);
      setTitle('');
      setDate(chosenDay ? chosenDay.date : '2026-09-13');
      setTime('10:00');
      setCity(chosenDay ? chosenDay.city : 'Madrid');
      setCategory('cultura');
      setLocation('');
      setMeetingPoint('');
      setDescription('');
      setDurationHours(2.5);
      setAlertHoursBefore(defaultAlertHours);
      setAlertEnabled(true);
      setNotes('');
    }
  }, [isOpen, editingTour, initialDay, defaultAlertHours]);

  if (!isOpen) return null;

  const handleDaySelect = (selectedDayNum: number) => {
    setDayNumber(selectedDayNum);
    const matched = safeDays.find((d) => d.dayNumber === selectedDayNum);
    if (matched) {
      setDate(matched.date);
      setCity(matched.city);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newOrUpdatedTour: Tour = {
      id: editingTour ? editingTour.id : `tour-${Date.now()}`,
      dayNumber,
      date,
      time,
      title: title.trim(),
      city: city.trim() || 'Madrid',
      category,
      location: location.trim() || title.trim(),
      meetingPoint: meetingPoint.trim() || undefined,
      description: description.trim(),
      durationHours: Number(durationHours) || 2,
      alertHoursBefore: Number(alertHoursBefore) || defaultAlertHours,
      alertEnabled,
      visitedByUserIds: editingTour ? editingTour.visitedByUserIds : [],
      tickets: editingTour ? editingTour.tickets : [],
      notes: notes.trim() || undefined,
    };

    onSaveTour(newOrUpdatedTour);
    onClose();
  };

  return (
    <div id="add-tour-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div id="add-tour-modal-card" className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {editingTour ? 'Editar Tour / Actividad' : 'Agregar Nuevo Tour al Itinerario'}
              </h3>
              <p className="text-xs text-stone-500">
                Registra los detalles, horarios, punto de encuentro y alerta previa
              </p>
            </div>
          </div>
          <button
            id="close-add-tour-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left">
          {/* Day selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Día del Itinerario:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
              {safeDays.map((d) => (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => handleDaySelect(d.dayNumber)}
                  className={`px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                    dayNumber === d.dayNumber
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-100'
                  }`}
                >
                  <div className="font-bold">Día {d.dayNumber}</div>
                  <div className="text-[10px] opacity-85 truncate">{d.city}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Nombre del Tour o Visita <span className="text-red-500">*</span>
            </label>
            <input
              id="input-tour-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita Guiada a la Sagrada Familia"
              className="w-full text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Fecha
              </label>
              <input
                id="input-tour-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Hora de Inicio
              </label>
              <div className="relative">
                <input
                  id="input-tour-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Ciudad / Destino
              </label>
              <input
                id="input-tour-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Madrid"
                className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Tipo / Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-2 rounded-xl text-left border flex items-center gap-2 text-xs transition-colors ${
                    category === cat.value
                      ? 'border-amber-500 bg-amber-50/70 font-bold text-amber-900'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location and Meeting Point */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Lugar / Monumento
              </label>
              <input
                id="input-tour-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Carrer de Mallorca 401"
                className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Punto de Encuentro
              </label>
              <input
                id="input-tour-meeting-point"
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="Ej: Calle San Bernardo 5 (Yellow Tours)"
                className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Alert configuration: 3h o 4h antes */}
          <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-stone-900">Alerta de Anticipación</span>
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                  className="rounded text-amber-500"
                />
                Activar aviso
              </label>
            </div>

            {alertEnabled && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-600">Avisar:</span>
                {[2, 3, 4, 5].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAlertHoursBefore(h)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      alertHoursBefore === h
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {h} horas antes
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Descripción o Instrucciones
            </label>
            <textarea
              id="input-tour-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del recorrido, duración estimada, traslados..."
              className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Notas Importantes / Recordatorios
            </label>
            <input
              id="input-tour-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Estar 15 minutos antes, llevar pasaporte y agua"
              className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-tour-btn"
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingTour ? 'Guardar Cambios' : 'Agregar Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
