export interface Traveler {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon?: string;
}

export interface Ticket {
  id: string;
  tourId: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'digital';
  dataUrl: string; // Base64 data or SVG/image URL
  fileSize?: string;
  uploadedAt: string;
  travelerId?: string; // Optional: specific traveler or group ticket
  qrCodeText?: string;
  referenceNumber?: string;
  seatOrSection?: string;
}

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
  tickets: Ticket[];
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
