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

// Play notification sound using browser Web Audio API with mobile user-gesture unlocking
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First note (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second note (C#6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.73, now + 0.12); // C#6
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Third resonant note (E6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.24); // E6
    gain3.gain.setValueAtTime(0, now + 0.24);
    gain3.gain.linearRampToValueAtTime(0.45, now + 0.28);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 1.0);
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
