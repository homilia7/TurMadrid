import { Traveler, Tour, ItineraryDay } from '../types';
import { INITIAL_TRAVELERS, INITIAL_TOURS, INITIAL_DAYS } from '../data/initialItinerary';

const STORAGE_KEYS = {
  TRAVELERS: 'app_itinerary_travelers_v1',
  TOURS: 'app_itinerary_tours_v1',
  DAYS: 'app_itinerary_days_v1',
  ACTIVE_TRAVELER: 'app_itinerary_active_traveler_v1',
  DEFAULT_ALERT_HOURS: 'app_itinerary_default_alert_hours_v1',
  ALERT_SOUND_ENABLED: 'app_itinerary_alert_sound_v1',
};

export function loadTravelers(): Traveler[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAVELERS);
    if (!raw) return INITIAL_TRAVELERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 5) {
      const hasGenericNames = parsed.some((t: Traveler) => t.name.startsWith('Viajero '));
      const hasOldSwap = parsed[1]?.name === 'Vilma' && parsed[2]?.name === 'Mayela';
      if (hasGenericNames || hasOldSwap) {
        return parsed.map((t: Traveler, idx: number) => ({
          ...t,
          name: INITIAL_TRAVELERS[idx] ? INITIAL_TRAVELERS[idx].name : t.name,
        }));
      }
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

export function resetToBrochureDefaults(): { travelers: Traveler[]; tours: Tour[]; days: ItineraryDay[] } {
  localStorage.removeItem(STORAGE_KEYS.TRAVELERS);
  localStorage.removeItem(STORAGE_KEYS.TOURS);
  localStorage.removeItem(STORAGE_KEYS.DAYS);
  return {
    travelers: INITIAL_TRAVELERS,
    tours: INITIAL_TOURS,
    days: INITIAL_DAYS,
  };
}
