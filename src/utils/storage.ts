import { Traveler, Tour, ItineraryDay, DocumentItem } from '../types';
import { INITIAL_TRAVELERS, INITIAL_TOURS, INITIAL_DAYS } from '../data/initialItinerary';

const STORAGE_KEYS = {
  TRAVELERS: 'app_itinerary_travelers_v2',
  TOURS: 'app_itinerary_tours_v2',
  DAYS: 'app_itinerary_days_v2',
  DOCUMENTS: 'app_itinerary_documents_v2',
  ACTIVE_TRAVELER: 'app_itinerary_active_traveler_v2',
  DEFAULT_ALERT_HOURS: 'app_itinerary_default_alert_hours_v2',
  ALERT_SOUND_ENABLED: 'app_itinerary_alert_sound_v2',
};

// Initial default documents extracted from tours and default travelers
function getInitialDocuments(): DocumentItem[] {
  const docs: DocumentItem[] = [];
  
  // Extract tickets from INITIAL_TOURS
  INITIAL_TOURS.forEach((t) => {
    if (t.tickets && t.tickets.length > 0) {
      t.tickets.forEach((tick) => {
        docs.push({
          ...tick,
          category: t.category === 'vuelo' ? 'vuelo' : 'entrada',
          tourId: t.id,
        });
      });
    }
  });

  return docs;
}

export function loadTravelers(): Traveler[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAVELERS);
    if (!raw) return INITIAL_TRAVELERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TRAVELERS;
  } catch (e) {
    console.error('Error loading travelers from storage', e);
    return INITIAL_TRAVELERS;
  }
}

export function saveTravelers(travelers: Traveler[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRAVELERS, JSON.stringify(travelers));
  } catch (e) {
    console.error('Error saving travelers', e);
  }
}

export function loadTours(): Tour[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOURS);
    if (!raw) return INITIAL_TOURS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TOURS;
  } catch (e) {
    console.error('Error loading tours from storage', e);
    return INITIAL_TOURS;
  }
}

export function saveTours(tours: Tour[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
  } catch (e) {
    console.error('Error saving tours', e);
  }
}

export function loadDays(): ItineraryDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAYS);
    if (!raw) return INITIAL_DAYS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DAYS;
  } catch (e) {
    console.error('Error loading days from storage', e);
    return INITIAL_DAYS;
  }
}

export function saveDays(days: ItineraryDay[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
  } catch (e) {
    console.error('Error saving days', e);
  }
}

export function loadDocuments(): DocumentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!raw) return getInitialDocuments();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return getInitialDocuments();
  } catch (e) {
    console.error('Error loading documents from storage', e);
    return getInitialDocuments();
  }
}

export function saveDocuments(docs: DocumentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving documents', e);
  }
}

export function loadActiveTravelerId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRAVELER);
    return saved || 'u1';
  } catch {
    return 'u1';
  }
}

export function saveActiveTravelerId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRAVELER, id);
  } catch (e) {
    console.error('Error saving active traveler', e);
  }
}

export function loadDefaultAlertHours(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.DEFAULT_ALERT_HOURS);
    return val ? parseInt(val, 10) : 3;
  } catch {
    return 3;
  }
}

export function saveDefaultAlertHours(hours: number) {
  try {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_ALERT_HOURS, hours.toString());
  } catch (e) {
    console.error('Error saving default alert hours', e);
  }
}

export function loadAlertSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ALERT_SOUND_ENABLED);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function saveAlertSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERT_SOUND_ENABLED, String(enabled));
  } catch (e) {
    console.error('Error saving alert sound enabled', e);
  }
}

export function resetToBrochureDefaults(): {
  travelers: Traveler[];
  tours: Tour[];
  days: ItineraryDay[];
  documents: DocumentItem[];
} {
  localStorage.removeItem(STORAGE_KEYS.TRAVELERS);
  localStorage.removeItem(STORAGE_KEYS.TOURS);
  localStorage.removeItem(STORAGE_KEYS.DAYS);
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  return {
    travelers: INITIAL_TRAVELERS,
    tours: INITIAL_TOURS,
    days: INITIAL_DAYS,
    documents: getInitialDocuments(),
  };
}
