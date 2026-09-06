import { Tour } from '../types';

export function getTourDateTime(tour: Tour): Date {
  // Combine tour.date and tour.time
  // e.g. "2026-09-13" and "11:15"
  return new Date(`${tour.date}T${tour.time}:00`);
}

export function getAlertDateTime(tour: Tour): Date {
  const tourDate = getTourDateTime(tour);
  const alertDate = new Date(tourDate.getTime() - tour.alertHoursBefore * 60 * 60 * 1000);
  return alertDate;
}

export interface TourAlertStatus {
  tour: Tour;
  tourDateTime: Date;
  alertDateTime: Date;
  hoursUntilTour: number;
  minutesUntilTour: number;
  isPast: boolean;
  isInAlertWindow: boolean; // Between alert time and tour time
  isApproachingAlert: boolean; // Less than 1 hour before alert triggers
  timeUntilTourText: string;
}

export function calculateTourAlertStatus(tour: Tour, now: Date = new Date()): TourAlertStatus {
  const tourDateTime = getTourDateTime(tour);
  const alertDateTime = getAlertDateTime(tour);
  
  const diffMs = tourDateTime.getTime() - now.getTime();
  const alertDiffMs = alertDateTime.getTime() - now.getTime();

  const isPast = diffMs < 0;
  // isInAlertWindow means current time is after alertDateTime but before tourDateTime
  const isInAlertWindow = alertDiffMs <= 0 && diffMs > 0 && tour.alertEnabled;
  const isApproachingAlert = alertDiffMs > 0 && alertDiffMs <= 60 * 60 * 1000 && tour.alertEnabled;

  const totalMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);

  let timeUntilTourText = '';
  if (isPast) {
    timeUntilTourText = 'Finalizado';
  } else if (days > 0) {
    timeUntilTourText = `En ${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    timeUntilTourText = `En ${hours}h ${minutes}m`;
  } else {
    timeUntilTourText = `En ${minutes} minutos`;
  }

  return {
    tour,
    tourDateTime,
    alertDateTime,
    hoursUntilTour: hours,
    minutesUntilTour: minutes,
    isPast,
    isInAlertWindow,
    isApproachingAlert,
    timeUntilTourText,
  };
}

// Play notification sound using browser Web Audio API
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

// Browser native notification
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        silent: false,
      });
    } catch (e) {
      console.warn('Could not display notification', e);
    }
  }
}
