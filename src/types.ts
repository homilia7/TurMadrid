export interface Traveler {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  emergencyContact?: string;
  notes?: string;
  passportDocUrl?: string;
  passportDocName?: string;
  passportDocType?: 'pdf' | 'image' | 'digital';
}

export type DocumentCategory = 'entrada' | 'vuelo' | 'pasaporte' | 'reserva' | 'hotel' | 'teleferico' | 'metro' | 'seguro' | 'otro';

export interface DocumentItem {
  id: string;
  travelerId?: string;
  tourId?: string;
  category: DocumentCategory;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'digital';
  dataUrl: string;
  fileSize?: string;
  referenceNumber?: string;
  seatOrSection?: string;
  airline?: string;
  flightNumber?: string;
  terminal?: string;
  gate?: string;
  departureTime?: string;
  arrivalTime?: string;
  origin?: string;
  destination?: string;
  qrCodeText?: string;
  qrCropUrl?: string;
  notes?: string;
  uploadedAt: string;
}

// Backward compatibility alias for Ticket
export type Ticket = DocumentItem;

export type TourCategory = 'cultura' | 'excursion' | 'transporte' | 'gastronomia' | 'ocio' | 'vuelo';

export interface Tour {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  city: string;
  category: TourCategory;
  location: string;
  meetingPoint?: string;
  description: string;
  durationHours?: number;
  alertHoursBefore: number; // e.g. 3, 4, etc.
  alertEnabled: boolean;
  visitedByUserIds: string[]; // List of traveler IDs who have checked this place
  tickets: DocumentItem[];
  notes?: string;
  imageThumbnail?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Jueves 10 Sept"
  city: string;
  title: string;
  subtitle?: string;
}

export interface AppNotification {
  id: string;
  tourId: string;
  tourTitle: string;
  tourTime: string;
  tourDate: string;
  alertHoursBefore: number;
  scheduledTime: string;
  isTriggered: boolean;
  meetingPoint?: string;
}

export interface CloudSyncState {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
  error?: string;
}
