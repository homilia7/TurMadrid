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
  passengerName?: string;
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
  dayOfWeek?: string;
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

export interface WallPost {
  id: string;
  authorName: string;
  authorType: 'traveler' | 'family';
  authorColor?: string;
  text: string;
  photoUrl?: string;
  photoName?: string;
  locationName?: string;
  likesCount?: number;
  likedBy?: string[];
  createdAt: string;
  timezoneSpain: string;
  timezoneCostaRica: string;
}

export interface FamilyMessage {
  id: string;
  chatRoomId: string;
  travelerName: string;
  familyMemberName: string;
  senderName: string;
  senderType: 'traveler' | 'family';
  text?: string;
  photoUrl?: string;
  photoName?: string;
  audioUrl?: string;
  audioDuration?: number;
  isQuickStatus?: boolean;
  quickStatusType?: 'airport' | 'hotel' | 'home' | 'location' | 'custom';
  locationCoordinates?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: string;
  timezoneSpain: string;
  timezoneCostaRica: string;
  isReadByTraveler?: boolean;
  isReadByFamily?: boolean;
}

export interface PresenceUser {
  id: string;
  name: string;
  role: 'traveler' | 'family';
  avatarColor: string;
  lastActive: string;
  isOnline: boolean;
  associatedTraveler?: string;
}

export interface LiveLocationShare {
  travelerId: string;
  travelerName: string;
  lat: number;
  lng: number;
  accuracy?: number;
  placeName?: string;
  address?: string;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  batteryLevel?: number | null;
  updatedAt: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  travelerId?: string;
  travelerName?: string;
  category?: 'comida' | 'transporte' | 'entradas' | 'compras' | 'alojamiento' | 'otro';
  notes?: string;
  createdAt: string;
}

