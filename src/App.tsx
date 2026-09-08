import React, { useState, useEffect, useCallback } from 'react';
import { Traveler, Tour, ItineraryDay, DocumentItem, CloudSyncState, Ticket } from './types';
import { INITIAL_DAYS } from './data/initialItinerary';
import {
  loadTravelers,
  saveTravelers,
  loadTours,
  saveTours,
  loadDays,
  saveDays,
  loadDocuments,
  saveDocuments,
  loadActiveTravelerId,
  saveActiveTravelerId,
  loadDefaultAlertHours,
  saveDefaultAlertHours,
  loadAlertSoundEnabled,
  saveAlertSoundEnabled,
  resetToBrochureDefaults,
} from './utils/storage';
import {
  fetchCloudData,
  syncToCloud,
  uploadDocumentToCloud,
  deleteDocumentFromCloud,
  saveTravelerToCloud,
} from './utils/cloudSync';
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
import { MobileBottomNav, MainTabType } from './components/MobileBottomNav';
import { PassportSection } from './components/PassportSection';
import { FlightSection } from './components/FlightSection';
import { TicketsHubSection } from './components/TicketsHubSection';
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
  ChevronRight,
  Plane,
  ShieldCheck,
  Users
} from 'lucide-react';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<MainTabType>('itinerary');

  // Core State
  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    const loaded = loadTravelers();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [tours, setTours] = useState<Tour[]>(() => {
    const loaded = loadTours();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [days, setDays] = useState<ItineraryDay[]>(() => {
    const loaded = loadDays();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const loaded = loadDocuments();
    return Array.isArray(loaded) ? loaded : [];
  });
  const [activeTravelerId, setActiveTravelerId] = useState<string>(loadActiveTravelerId);
  const [defaultAlertHours, setDefaultAlertHours] = useState<number>(loadDefaultAlertHours);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(loadAlertSoundEnabled);

  // Cloudflare Sync State
  const [syncState, setSyncState] = useState<CloudSyncState>({
    status: 'synced',
    lastSyncedAt: new Date().toISOString(),
  });

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

  // 1. Initial Cloudflare D1 Data Fetch & Hydration
  useEffect(() => {
    let isMounted = true;
    async function initCloudData() {
      setSyncState((prev) => ({ ...prev, status: 'syncing' }));
      const cloudData = await fetchCloudData();
      if (!isMounted) return;

      if (cloudData) {
        const cloudDocs = Array.isArray(cloudData.documents) ? cloudData.documents : [];
        const localDocs = loadDocuments();
        
        // Merge cloud documents and any local documents by id, preserving latest qrCropUrl
        const docsMap = new Map<string, DocumentItem>();
        cloudDocs.forEach((d) => docsMap.set(d.id, d));
        localDocs.forEach((d) => {
          if (!docsMap.has(d.id)) {
            docsMap.set(d.id, d);
          } else {
            const existing = docsMap.get(d.id)!;
            docsMap.set(d.id, {
              ...existing,
              ...d,
              qrCropUrl: d.qrCropUrl || existing.qrCropUrl,
              qrCodeText: d.qrCodeText || existing.qrCodeText,
              dataUrl: d.dataUrl || existing.dataUrl,
            });
          }
        });
        const mergedDocs = Array.from(docsMap.values());
        setDocuments(mergedDocs);
        saveDocuments(mergedDocs);

        if (Array.isArray(cloudData.tours) && cloudData.tours.length > 0) {
          const localTours = loadTours() || [];
          const hydratedTours = cloudData.tours.map((t) => {
            const tourDocs = mergedDocs.filter(
              (d) => d.tourId === t.id && (d.category === 'entrada' || !d.category)
            );
            const localMatchingTour = localTours.find((lt) => lt.id === t.id);
            const localMatchingTickets = localMatchingTour?.tickets || [];

            const baseTickets = tourDocs.length > 0 ? tourDocs : (t.tickets || []);
            const finalTickets = baseTickets.map((tick) => {
              const localT = localMatchingTickets.find((lt) => lt.id === tick.id);
              const matchingDoc = mergedDocs.find((d) => d.id === tick.id);
              return {
                ...tick,
                qrCropUrl: tick.qrCropUrl || matchingDoc?.qrCropUrl || localT?.qrCropUrl,
                qrCodeText: tick.qrCodeText || matchingDoc?.qrCodeText || localT?.qrCodeText,
                dataUrl: tick.dataUrl || matchingDoc?.dataUrl || localT?.dataUrl,
              };
            });

            return {
              ...t,
              tickets: finalTickets,
            };
          });
          setTours(hydratedTours);
          saveTours(hydratedTours);
        }
        if (Array.isArray(cloudData.travelers) && cloudData.travelers.length > 0) {
          setTravelers(cloudData.travelers);
          saveTravelers(cloudData.travelers);
        }
        if (Array.isArray(cloudData.days) && cloudData.days.length > 0) {
          setDays(cloudData.days);
          saveDays(cloudData.days);
        }
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      } else {
        const initialTours = loadTours();
        const initialTravelers = loadTravelers();
        const initialDays = loadDays();
        const initialDocs = loadDocuments();
        await syncToCloud({
          travelers: initialTravelers,
          tours: initialTours,
          days: initialDays,
          documents: initialDocs,
        });
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      }
    }

    initCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Local Persistence Effects
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
    saveDocuments(documents);
  }, [documents]);

  useEffect(() => {
    saveActiveTravelerId(activeTravelerId);
  }, [activeTravelerId]);

  useEffect(() => {
    saveDefaultAlertHours(defaultAlertHours);
  }, [defaultAlertHours]);

  useEffect(() => {
    saveAlertSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // 3. Debounced Cloudflare Sync on State Change
  const triggerCloudSync = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, status: 'syncing' }));
    const success = await syncToCloud({
      travelers,
      tours,
      days,
      documents,
    });
    if (success) {
      setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } else {
      setSyncState({ status: navigator.onLine ? 'error' : 'offline' });
    }
  }, [travelers, tours, days, documents]);

  // Periodic alert monitor effect
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
    setTours((prevTours) => {
      const updated = prevTours.map((t) => {
        if (t.id !== tourId) return t;
        const currentVisited = Array.isArray(t.visitedByUserIds) ? t.visitedByUserIds : [];
        const exists = currentVisited.includes(travelerId);
        const updatedUserIds = exists
          ? currentVisited.filter((id) => id !== travelerId)
          : [...currentVisited, travelerId];
        return {
          ...t,
          visitedByUserIds: updatedUserIds,
        };
      });
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Quick change alert hours for a specific tour
  const handleQuickChangeAlert = (tourId: string, hours: number) => {
    setTours((prev) => {
      const updated = prev.map((t) => (t.id === tourId ? { ...t, alertHoursBefore: hours } : t));
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Save new or updated tour
  const handleSaveTour = (savedTour: Tour) => {
    setTours((prev) => {
      const exists = prev.some((t) => t.id === savedTour.id);
      const updated = exists
        ? prev.map((t) => (t.id === savedTour.id ? savedTour : t))
        : [...prev, savedTour];
      saveTours(updated);
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Delete tour
  const handleDeleteTour = (tourId: string) => {
    setTours((prev) => {
      const updated = prev.filter((t) => t.id !== tourId);
      saveTours(updated);
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Update tour tickets
  const handleUpdateTourTickets = async (tourId: string, newTickets: Tour['tickets']) => {
    const cleanTickets = (newTickets || []).map((t) => ({
      ...t,
      category: 'entrada' as const,
      tourId,
    }));

    // 1. Calculate updated tours synchronously
    const currentTours = Array.isArray(tours) ? tours : [];
    const updatedTours = currentTours.map((t) =>
      t.id === tourId ? { ...t, tickets: cleanTickets } : t
    );
    setTours(updatedTours);
    saveTours(updatedTours);

    // 2. Calculate updated documents synchronously
    const currentDocs = Array.isArray(documents) ? documents : [];
    const otherDocs = currentDocs.filter(
      (d) => !(d.tourId === tourId && (d.category === 'entrada' || !d.category))
    );
    const updatedDocs = [...cleanTickets, ...otherDocs];
    setDocuments(updatedDocs);
    saveDocuments(updatedDocs);

    if (activeTicketTour?.id === tourId) {
      setActiveTicketTour((prev) => (prev ? { ...prev, tickets: cleanTickets } : null));
    }

    // 3. Persist directly to Cloudflare D1
    setSyncState((prev) => ({ ...prev, status: 'syncing' }));

    try {
      // Direct insertion of each ticket into D1 documents table
      for (const ticket of cleanTickets) {
        await uploadDocumentToCloud(ticket);
      }

      // Sync overall state to Cloudflare D1
      const success = await syncToCloud({
        tours: updatedTours,
        documents: updatedDocs,
      });

      if (success) {
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      } else {
        setSyncState({ status: navigator.onLine ? 'error' : 'offline' });
      }
    } catch (err) {
      console.error('Error syncing tour tickets to D1:', err);
      setSyncState({ status: 'error' });
    }
  };

  // Update Traveler Passport / Profile
  const handleUpdateTraveler = (updatedTraveler: Traveler) => {
    setTravelers((prev) => {
      const updated = prev.map((t) => (t.id === updatedTraveler.id ? updatedTraveler : t));
      saveTravelerToCloud(updatedTraveler);
      return updated;
    });
  };

  // Add or Update Document
  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id);
      const updated = [newDoc, ...filtered];
      saveDocuments(updated);
      uploadDocumentToCloud(newDoc);
      syncToCloud({ documents: updated });
      return updated;
    });
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== docId);
      saveDocuments(updated);
      deleteDocumentFromCloud(docId);
      syncToCloud({ documents: updated });
      return updated;
    });
  };

  // Global default alert hours save
  const handleSaveDefaultAlertHours = (hours: number, applyToAll: boolean) => {
    setDefaultAlertHours(hours);
    if (applyToAll) {
      setTours((prev) => {
        const updated = prev.map((t) => ({ ...t, alertHoursBefore: hours }));
        syncToCloud({ tours: updated });
        return updated;
      });
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
      setDocuments(defaults.documents);
      syncToCloud(defaults);
    }
  };

  // Safe arrays
  const safeTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : [];
  const safeTours = Array.isArray(tours) ? tours : [];
  const safeDays = Array.isArray(days) ? days : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Active traveler
  const activeTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0] || {
    id: 'u1',
    name: 'Viajero 1',
    avatarColor: '#2563eb',
  };

  // Distinct cities for filter
  const uniqueCities = Array.from(new Set(safeTours.map((t) => t.city))).filter(Boolean);

  // Filtered tours and days
  const filteredTours = safeTours.filter((tour) => {
    if (selectedCity !== 'all' && !tour.city?.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

    const visited = Array.isArray(tour.visitedByUserIds) ? tour.visitedByUserIds : [];
    const tickets = Array.isArray(tour.tickets) ? tour.tickets : [];

    if (filterStatus === 'visited' && !visited.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'pending' && visited.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'tickets' && tickets.length === 0) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tour.title?.toLowerCase().includes(q);
      const matchCity = tour.city?.toLowerCase().includes(q);
      const matchLocation = tour.location?.toLowerCase().includes(q);
      const matchMeeting = tour.meetingPoint?.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchLocation && !matchMeeting) {
        return false;
      }
    }

    return true;
  });

  const matchingDayNumbers = new Set(filteredTours.map((t) => t.dayNumber));
  const displayedDays =
    searchQuery.trim() || filterStatus !== 'all' || selectedCity !== 'all'
      ? safeDays.filter((d) => matchingDayNumbers.has(d.dayNumber))
      : safeDays;

  // Open tickets modal with merged tickets from tour and documents state
  const handleOpenTourTickets = (tour: Tour) => {
    const currentTour = tours.find((t) => t.id === tour.id) || tour;
    const currentDocs = Array.isArray(documents) ? documents : [];
    const tourDocs = currentDocs.filter(
      (d) => d.tourId === tour.id && (d.category === 'entrada' || !d.category)
    );
    const combinedMap = new Map<string, Ticket>();
    (currentTour.tickets || []).forEach((t) => combinedMap.set(t.id, t));
    tourDocs.forEach((d) => {
      combinedMap.set(d.id, {
        id: d.id,
        tourId: d.tourId || tour.id,
        category: 'entrada',
        title: d.title,
        fileName: d.fileName || 'ticket.png',
        fileType: d.fileType || 'image',
        dataUrl: d.dataUrl,
        fileSize: d.fileSize || '100 KB',
        uploadedAt: d.uploadedAt || new Date().toISOString(),
        travelerId: d.travelerId,
        seatOrSection: d.seatOrSection,
        referenceNumber: d.referenceNumber,
        qrCodeText: d.qrCodeText,
        qrCropUrl: d.qrCropUrl,
      });
    });
    const mergedTickets = Array.from(combinedMap.values());
    setActiveTicketTour({
      ...currentTour,
      tickets: mergedTickets,
    });
  };

  const passportCount = safeTravelers.filter((t) => Boolean(t.passportDocUrl || t.passportNumber)).length;
  const flightCount = safeDocs.filter((d) => d.category === 'vuelo').length;
  const ticketCount = safeTours.reduce((acc, t) => acc + (t.tickets?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans pb-20 md:pb-12">
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
        syncState={syncState}
        onManualSync={triggerCloudSync}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 w-full mt-3 sm:mt-5 space-y-5">
        {/* PWA Download Banner */}
        <PWAInstallButton variant="banner" />

        {/* TAB 1: ITINERARIO DIARIO */}
        {activeTab === 'itinerary' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Next Tour & Active Alert Banner */}
            <AlertBanner
              tours={tours}
              defaultAlertHours={defaultAlertHours}
              onOpenAlertSettings={() => setIsAlertModalOpen(true)}
              onOpenTickets={handleOpenTourTickets}
            />

            {/* 5 Travelers Group Progress Dashboard */}
            <GroupSummary
              travelers={travelers}
              tours={tours}
              activeTravelerId={activeTravelerId}
              onSelectActiveTraveler={setActiveTravelerId}
            />

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-tours-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar monumento, museo, hora o ciudad..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por ciudad"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 text-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Todas las Ciudades</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Todos ({tours.length})
                  </button>

                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'pending'
                        ? 'bg-white text-amber-700 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Pendientes
                  </button>

                  <button
                    onClick={() => setFilterStatus('visited')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'visited'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Completados
                  </button>
                </div>
              </div>
            </div>

            {/* List of Days & Tours */}
            <div className="space-y-5">
              {displayedDays.length > 0 ? (
                displayedDays.map((day) => {
                  const dayTours = filteredTours.filter((t) => t.dayNumber === day.dayNumber);
                  return (
                    <DaySection
                      key={day.dayNumber}
                      day={day}
                      tours={dayTours}
                      travelers={travelers}
                      activeTravelerId={activeTravelerId}
                      documents={documents}
                      onToggleVisit={handleToggleVisit}
                      onEditTour={(tour) => {
                        setEditingTour(tour);
                        setSelectedDayForNewTour(tour.dayNumber);
                        setIsAddTourModalOpen(true);
                      }}
                      onDeleteTour={handleDeleteTour}
                      onOpenTickets={handleOpenTourTickets}
                      onQuickChangeAlert={handleQuickChangeAlert}
                      onAddNewTourToDay={(dayNumber) => {
                        setEditingTour(null);
                        setSelectedDayForNewTour(dayNumber);
                        setIsAddTourModalOpen(true);
                      }}
                      onUpdateTourTickets={handleUpdateTourTickets}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-stone-800">No se encontraron actividades</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Prueba ajustando los filtros o el término de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                      setSelectedCity('all');
                    }}
                    className="mt-4 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VUELOS & PASAJES DE AVIÓN */}
        {activeTab === 'flights' && (
          <div className="animate-in fade-in duration-200">
            <FlightSection
              travelers={travelers}
              documents={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              activeTravelerId={activeTravelerId}
            />
          </div>
        )}

        {/* TAB 3: PASAPORTES & DOCUMENTACIÓN */}
        {activeTab === 'passports' && (
          <div className="animate-in fade-in duration-200">
            <PassportSection
              travelers={travelers}
              documents={documents}
              onUpdateTraveler={handleUpdateTraveler}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddTraveler={(name, color) => {
                const newT: Traveler = {
                  id: `u-${Date.now()}`,
                  name,
                  avatarColor: color,
                };
                setTravelers((prev) => [...prev, newT]);
                saveTravelerToCloud(newT);
              }}
              activeTravelerId={activeTravelerId}
              onSelectTraveler={setActiveTravelerId}
            />
          </div>
        )}

        {/* TAB 4: ENTRADAS & RESERVAS */}
        {activeTab === 'tickets' && (
          <div className="animate-in fade-in duration-200">
            <TicketsHubSection
              tours={tours}
              travelers={travelers}
              documents={documents}
              onOpenTourTickets={handleOpenTourTickets}
              onUpdateTourTickets={handleUpdateTourTickets}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        )}

        {/* TAB 5: GRUPO / VIAJEROS */}
        {activeTab === 'travelers' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Grupo de Viajeros</h2>
                  <p className="text-xs text-purple-200">
                    5 Pasajeros: Jessica, Mayela, Vilma, Mercedes y Angelica
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTravelersModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-purple-950 bg-purple-200 hover:bg-purple-100 rounded-xl shadow-sm transition"
              >
                Editar Nombres
              </button>
            </div>

            <GroupSummary
              travelers={travelers}
              tours={tours}
              activeTravelerId={activeTravelerId}
              onSelectActiveTraveler={setActiveTravelerId}
            />
          </div>
        )}

        {/* Bottom Actions and Reset */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>TurMadrid • Sistema Online Sincronizado</span>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Itinerario Oficial del Brochure</span>
          </button>
        </div>
      </main>

      {/* Floating Offline Sync Indicator */}
      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        ticketCount={ticketCount}
        flightCount={flightCount}
        passportCount={passportCount}
      />

      {/* Modals */}
      <TravelersModal
        isOpen={isTravelersModalOpen}
        onClose={() => setIsTravelersModalOpen(false)}
        travelers={travelers}
        onSave={(updatedTravelers) => {
          setTravelers(updatedTravelers);
          syncToCloud({ travelers: updatedTravelers });
        }}
        activeTravelerId={activeTravelerId}
        onSelectActiveTraveler={(id) => {
          setActiveTravelerId(id);
          saveActiveTravelerId(id);
        }}
      />

      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        defaultAlertHours={defaultAlertHours}
        soundEnabled={soundEnabled}
        onSaveDefaultAlertHours={handleSaveDefaultAlertHours}
        onToggleSound={setSoundEnabled}
      />

      <AddTourModal
        isOpen={isAddTourModalOpen}
        onClose={() => {
          setIsAddTourModalOpen(false);
          setEditingTour(null);
        }}
        days={days && days.length > 0 ? days : INITIAL_DAYS}
        onSaveTour={handleSaveTour}
        editingTour={editingTour}
        initialDayNumber={selectedDayForNewTour}
        defaultDayNumber={selectedDayForNewTour}
        defaultAlertHours={defaultAlertHours}
      />

      {activeTicketTour && (
        <TicketModal
          isOpen={Boolean(activeTicketTour)}
          onClose={() => setActiveTicketTour(null)}
          tour={activeTicketTour}
          travelers={travelers}
          onUpdateTourTickets={handleUpdateTourTickets}
        />
      )}
    </div>
  );
}
