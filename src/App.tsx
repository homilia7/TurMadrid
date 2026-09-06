import React, { useState, useEffect } from 'react';
import { Traveler, Tour, ItineraryDay } from './types';
import {
  loadTravelers,
  saveTravelers,
  loadTours,
  saveTours,
  loadDays,
  saveDays,
  loadActiveTravelerId,
  saveActiveTravelerId,
  loadDefaultAlertHours,
  saveDefaultAlertHours,
  loadAlertSoundEnabled,
  saveAlertSoundEnabled,
  resetToBrochureDefaults,
} from './utils/storage';
import {
  calculateTourAlertStatus,
  playChimeSound,
  sendBrowserNotification,
} from './utils/alertManager';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { DaySection } from './components/DaySection';
import { GroupSummary } from './components/GroupSummary';
import { TravelersModal } from './components/TravelersModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AddTourModal } from './components/AddTourModal';
import { TicketModal } from './components/TicketModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ticket as TicketIcon,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Core State
  const [travelers, setTravelers] = useState<Traveler[]>(loadTravelers);
  const [tours, setTours] = useState<Tour[]>(loadTours);
  const [days, setDays] = useState<ItineraryDay[]>(loadDays);
  const [activeTravelerId, setActiveTravelerId] = useState<string>(loadActiveTravelerId);
  const [defaultAlertHours, setDefaultAlertHours] = useState<number>(loadDefaultAlertHours);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(loadAlertSoundEnabled);

  // Modals state
  const [isTravelersModalOpen, setIsTravelersModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isAddTourModalOpen, setIsAddTourModalOpen] = useState<boolean>(false);
  const [selectedDayForNewTour, setSelectedDayForNewTour] = useState<number>(1);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [activeTicketTour, setActiveTicketTour] = useState<Tour | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'visited' | 'tickets'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Persistence effects
  useEffect(() => {
    saveTravelers(travelers);
  }, [travelers]);

  useEffect(() => {
    saveTours(tours);
  }, [tours]);

  useEffect(() => {
    saveDays(days);
  }, [days]);

  useEffect(() => {
    saveActiveTravelerId(activeTravelerId);
  }, [activeTravelerId]);

  useEffect(() => {
    saveDefaultAlertHours(defaultAlertHours);
  }, [defaultAlertHours]);

  useEffect(() => {
    saveAlertSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Periodic alert monitor effect (checks every 30 seconds for approaching tours)
  useEffect(() => {
    const checkedAlertsKey = 'checked_alerts_set_v1';
    let alertedIds: string[] = [];
    try {
      alertedIds = JSON.parse(sessionStorage.getItem(checkedAlertsKey) || '[]');
    } catch {
      alertedIds = [];
    }

    const checkAlerts = () => {
      const now = new Date();
      tours.forEach((tour) => {
        if (!tour.alertEnabled || alertedIds.includes(tour.id)) return;
        const status = calculateTourAlertStatus(tour, now);

        if (status.isInAlertWindow) {
          alertedIds.push(tour.id);
          sessionStorage.setItem(checkedAlertsKey, JSON.stringify(alertedIds));

          if (soundEnabled) {
            playChimeSound();
          }

          sendBrowserNotification(
            `🔔 ¡Alerta de Tour! ${tour.title}`,
            `Tu tour en ${tour.city} comienza a las ${tour.time} (${tour.alertHoursBefore}h de aviso). Punto: ${
              tour.meetingPoint || tour.location
            }`
          );
        }
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [tours, soundEnabled]);

  // Toggle visit mark for a traveler
  const handleToggleVisit = (tourId: string, travelerId: string) => {
    setTours((prevTours) =>
      prevTours.map((t) => {
        if (t.id !== tourId) return t;
        const exists = t.visitedByUserIds.includes(travelerId);
        const updatedUserIds = exists
          ? t.visitedByUserIds.filter((id) => id !== travelerId)
          : [...t.visitedByUserIds, travelerId];
        return {
          ...t,
          visitedByUserIds: updatedUserIds,
        };
      })
    );
  };

  // Quick change alert hours for a specific tour
  const handleQuickChangeAlert = (tourId: string, hours: number) => {
    setTours((prev) =>
      prev.map((t) => (t.id === tourId ? { ...t, alertHoursBefore: hours } : t))
    );
  };

  // Save new or updated tour
  const handleSaveTour = (savedTour: Tour) => {
    setTours((prev) => {
      const exists = prev.some((t) => t.id === savedTour.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTour.id ? savedTour : t));
      } else {
        return [...prev, savedTour];
      }
    });
  };

  // Delete tour
  const handleDeleteTour = (tourId: string) => {
    setTours((prev) => prev.filter((t) => t.id !== tourId));
  };

  // Update tour tickets
  const handleUpdateTourTickets = (tourId: string, newTickets: Tour['tickets']) => {
    setTours((prev) =>
      prev.map((t) => (t.id === tourId ? { ...t, tickets: newTickets } : t))
    );
    if (activeTicketTour?.id === tourId) {
      setActiveTicketTour((prev) => (prev ? { ...prev, tickets: newTickets } : null));
    }
  };

  // Global default alert hours save
  const handleSaveDefaultAlertHours = (hours: number, applyToAll: boolean) => {
    setDefaultAlertHours(hours);
    if (applyToAll) {
      setTours((prev) => prev.map((t) => ({ ...t, alertHoursBefore: hours })));
    }
  };

  // Reset to original brochure
  const handleResetDefaults = () => {
    if (
      window.confirm(
        '¿Deseas restaurar el itinerario original de 13 días del brochure (Madrid, Toledo, Segovia, Ávila y Barcelona)?'
      )
    ) {
      const defaults = resetToBrochureDefaults();
      setTravelers(defaults.travelers);
      setTours(defaults.tours);
      setDays(defaults.days);
    }
  };

  // Active traveler
  const activeTraveler = travelers.find((t) => t.id === activeTravelerId) || travelers[0];

  // Distinct cities for filter
  const uniqueCities = Array.from(new Set(tours.map((t) => t.city))).filter(Boolean);

  // Filtered tours and days
  const filteredTours = tours.filter((tour) => {
    // City filter
    if (selectedCity !== 'all' && !tour.city.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterStatus === 'visited' && !tour.visitedByUserIds.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'pending' && tour.visitedByUserIds.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'tickets' && tour.tickets.length === 0) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tour.title.toLowerCase().includes(q);
      const matchCity = tour.city.toLowerCase().includes(q);
      const matchLocation = tour.location.toLowerCase().includes(q);
      const matchMeeting = tour.meetingPoint?.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchLocation && !matchMeeting) {
        return false;
      }
    }

    return true;
  });

  // Days that have matching tours (or show all days if no filter applied)
  const matchingDayNumbers = new Set(filteredTours.map((t) => t.dayNumber));
  const displayedDays =
    searchQuery.trim() || filterStatus !== 'all' || selectedCity !== 'all'
      ? days.filter((d) => matchingDayNumbers.has(d.dayNumber))
      : days;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans pb-16">
      {/* Top sticky navigation */}
      <Navbar
        travelers={travelers}
        activeTravelerId={activeTravelerId}
        onSelectActiveTraveler={setActiveTravelerId}
        onOpenTravelersModal={() => setIsTravelersModalOpen(true)}
        onOpenAlertSettings={() => setIsAlertModalOpen(true)}
        onOpenAddTourModal={() => {
          setEditingTour(null);
          setSelectedDayForNewTour(1);
          setIsAddTourModalOpen(true);
        }}
        tours={tours}
        defaultAlertHours={defaultAlertHours}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 w-full mt-4 sm:mt-6 space-y-6">
        {/* PWA Download Banner (Automatically hides once installed) */}
        <PWAInstallButton variant="banner" />

        {/* Next Tour & Active Alert Banner */}
        <AlertBanner
          tours={tours}
          defaultAlertHours={defaultAlertHours}
          onOpenAlertSettings={() => setIsAlertModalOpen(true)}
          onOpenTickets={(tour) => setActiveTicketTour(tour)}
        />

        {/* 5 Travelers Group Progress Dashboard */}
        <GroupSummary
          travelers={travelers}
          tours={tours}
          activeTravelerId={activeTravelerId}
          onSelectActiveTraveler={setActiveTravelerId}
        />

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-tours-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tour, monumento, ciudad o punto de encuentro..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todos ({tours.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Por Visitar
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('visited')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterStatus === 'visited'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Visitados ({tours.filter((t) => t.visitedByUserIds.includes(activeTravelerId)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('tickets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterStatus === 'tickets'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <TicketIcon className="w-3.5 h-3.5" />
              Con Entradas
            </button>
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-stone-400 uppercase tracking-wider shrink-0 text-[11px]">
            Destinos:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCity('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
              selectedCity === 'all'
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Todos
          </button>
          {uniqueCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                selectedCity === city
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Itinerary Day-by-Day List */}
        <div className="space-y-4">
          {displayedDays.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
              <Search className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No se encontraron tours con ese filtro</h4>
              <p className="text-xs text-stone-500 mt-1">Prueba a buscar con otra palabra o restablece los filtros</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setSelectedCity('all');
                }}
                className="mt-3 text-xs font-bold px-4 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            displayedDays.map((day) => (
              <DaySection
                key={day.dayNumber}
                day={day}
                tours={filteredTours}
                travelers={travelers}
                activeTravelerId={activeTravelerId}
                onToggleVisit={handleToggleVisit}
                onOpenTickets={(tour) => setActiveTicketTour(tour)}
                onEditTour={(tour) => {
                  setEditingTour(tour);
                  setIsAddTourModalOpen(true);
                }}
                onDeleteTour={handleDeleteTour}
                onQuickChangeAlert={handleQuickChangeAlert}
                onAddTourToDay={(dayNum) => {
                  setEditingTour(null);
                  setSelectedDayForNewTour(dayNum);
                  setIsAddTourModalOpen(true);
                }}
              />
            ))
          )}
        </div>

        {/* Bottom Utility Bar */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            Itinerario España 2026 • 13 Días • 5 Viajeros con marcado individual de visitas
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
            title="Restablecer los datos originales del folleto PDF de España"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Itinerario Original del Brochure</span>
          </button>
        </div>
      </main>

      {/* Modals */}
      {/* 1. Travelers Modal (Edit the 5 users names & colors) */}
      <TravelersModal
        isOpen={isTravelersModalOpen}
        onClose={() => setIsTravelersModalOpen(false)}
        travelers={travelers}
        onSave={(updated) => setTravelers(updated)}
        activeTravelerId={activeTravelerId}
        onSelectActiveTraveler={(id) => setActiveTravelerId(id)}
      />

      {/* 2. Alert Settings Modal (3h or 4h before tour, modify alerts, test notifications) */}
      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        defaultAlertHours={defaultAlertHours}
        onSaveDefaultAlertHours={handleSaveDefaultAlertHours}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
      />

      {/* 3. Add or Edit Tour Modal */}
      <AddTourModal
        isOpen={isAddTourModalOpen}
        onClose={() => {
          setIsAddTourModalOpen(false);
          setEditingTour(null);
        }}
        days={days}
        onSaveTour={handleSaveTour}
        initialDayNumber={selectedDayForNewTour}
        editingTour={editingTour}
        defaultAlertHours={defaultAlertHours}
      />

      {/* 4. Ticket Modal (Upload, View online, Download tickets) */}
      {activeTicketTour && (
        <TicketModal
          isOpen={Boolean(activeTicketTour)}
          onClose={() => setActiveTicketTour(null)}
          tour={activeTicketTour}
          travelers={travelers}
          onUpdateTourTickets={handleUpdateTourTickets}
        />
      )}

      {/* Offline Connectivity Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
