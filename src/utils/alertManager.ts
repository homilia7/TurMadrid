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

// Generate self-contained, offline WAV chime for 100% reliable mobile playback
let cachedChimeWavUrl = '';

function getChimeWavUrl(): string {
  if (cachedChimeWavUrl) return cachedChimeWavUrl;
  try {
    if (typeof window === 'undefined') return '';
    const sampleRate = 22050;
    const duration = 1.0;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // WAVE
    view.setUint32(12, 0x666d7420, false); // fmt
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // data
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      if (t >= 0 && t < 0.6) {
        const env1 = Math.exp(-6 * t);
        sample += Math.sin(2 * Math.PI * 880 * t) * env1 * 0.4;
      }
      if (t >= 0.1 && t < 0.75) {
        const t2 = t - 0.1;
        const env2 = Math.exp(-6 * t2);
        sample += Math.sin(2 * Math.PI * 1108.73 * t2) * env2 * 0.45;
      }
      if (t >= 0.22 && t < 1.0) {
        const t3 = t - 0.22;
        const env3 = Math.exp(-5 * t3);
        sample += Math.sin(2 * Math.PI * 1318.51 * t3) * env3 * 0.5;
      }
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(44 + i * 2, int16, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedChimeWavUrl = URL.createObjectURL(blob);
    return cachedChimeWavUrl;
  } catch (e) {
    console.warn('WAV creation failed:', e);
    return '';
  }
}

// Audio Context singleton for mobile audio unlocking
let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn('AudioContext initialization error:', e);
    return null;
  }
}

// User gesture unlocker for mobile Safari and Android Chrome
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Pre-create the WAV URL
    getChimeWavUrl();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('pointerdown', unlockAudio, { once: true });
}

// Play notification sound using dual Web Audio + HTML5 Audio fallback for 100% mobile compatibility
export function playChimeSound() {
  // 1. Mobile Vibration
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 300]);
    }
  } catch {}

  // 2. HTML5 Audio Playback (Most robust across mobile browsers)
  try {
    const wavUrl = getChimeWavUrl();
    if (wavUrl) {
      const audio = new Audio(wavUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {});
    }
  } catch (audioErr) {
    console.warn('HTML5 Audio play failed:', audioErr);
  }

  // 3. Web Audio Oscillator Synthesis
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First note (A5 - 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second note (C#6 - 1108.73 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.73, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.55, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Third note (E6 - 1318.51 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.24);
    gain3.gain.setValueAtTime(0, now + 0.24);
    gain3.gain.linearRampToValueAtTime(0.6, now + 0.28);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 1.0);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

// Browser native notification with full Mobile Android / iOS PWA Service Worker support
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') {
    return 'denied';
  }

  // Pre-unlock audio context on user gesture
  getAudioContext();

  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser window.');
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const res = Notification.requestPermission();
    if (res && typeof (res as any).then === 'function') {
      const perm = await res;
      return perm;
    }
    // Fallback for older callback-style browsers
    return new Promise((resolve) => {
      Notification.requestPermission((perm) => {
        resolve(perm);
      });
    });
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return Notification.permission || 'denied';
  }
}

// In-memory cache to prevent duplicate notifications from firing within 4 seconds
const recentlySentNotifications = new Map<string, number>();

export async function sendBrowserNotification(
  title: string,
  body: string,
  icon?: string,
  tag?: string,
  url?: string
) {
  if (typeof window === 'undefined') return;

  const dedupeKey = tag || `${title}:::${body}`;
  const now = Date.now();
  const lastSent = recentlySentNotifications.get(dedupeKey) || 0;
  if (now - lastSent < 4000) {
    // Duplicate detected within 4 seconds, discard
    return;
  }
  recentlySentNotifications.set(dedupeKey, now);

  // Clean old entries
  if (recentlySentNotifications.size > 50) {
    recentlySentNotifications.forEach((time, key) => {
      if (now - time > 30000) {
        recentlySentNotifications.delete(key);
      }
    });
  }

  // Auto trigger vibration on supported mobile devices
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 250]);
    }
  } catch {
    // ignore
  }

  if (!('Notification' in window)) {
    console.warn('Notifications API not supported in this browser');
    return;
  }

  // If permission has not been requested yet, request it
  if (Notification.permission === 'default') {
    try {
      const p = await requestNotificationPermission();
      if (p !== 'granted') return;
    } catch {
      return;
    }
  }

  if (Notification.permission !== 'granted') return;

  const notifOptions: any = {
    body,
    icon: icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: tag || `tur-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [300, 150, 300, 150, 300],
    data: {
      url: url || window.location.href,
      dateOfArrival: Date.now(),
    },
  };

  // 1. Mandatory for Mobile Android Chrome & iOS PWA: Service Worker Registration showNotification
  if ('serviceWorker' in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | null>((resolve) => setTimeout(() => resolve(null), 800)),
      ]);
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notifOptions);
        return;
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification failed, trying getRegistrations fallback:', swErr);
    }
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notifOptions);
          return;
        }
      }
    } catch {}
  }

  // 2. Desktop Browser fallback
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.warn('Direct Notification constructor blocked on this device:', err);
  }
}

// VAPID Public Key for WebPush
export const VAPID_PUBLIC_KEY = 'BDTrT23VmAC6bRaBJB4wDnw-QrxMKojaGESm8a79B_h_h9SVcT8QbYgzXwuDBTjBJCwo606Q2X8Y5Xrr60hQjLg';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToWebPush(travelerId?: string, travelerName?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    let resolvedName = travelerName || '';
    let resolvedId = travelerId || '';

    if (!resolvedName && typeof window !== 'undefined') {
      resolvedName = localStorage.getItem('tur_family_name') || '';
      if (!resolvedName) {
        const sessId = localStorage.getItem('tur_traveler_session');
        if (sessId) {
          resolvedId = sessId;
          try {
            const raw = localStorage.getItem('travelers');
            if (raw) {
              const list = JSON.parse(raw);
              const found = Array.isArray(list) ? list.find((t: any) => t && t.id === sessId) : null;
              if (found && found.name) resolvedName = found.name;
            }
          } catch {}
        }
      }
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    if (subscription) {
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          travelerId: resolvedId || '',
          travelerName: resolvedName || '',
        }),
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('WebPush subscription error:', err);
    return false;
  }
}

export async function triggerServerPushTest(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    if (subscription) {
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          action: 'test',
        }),
      });
      return res.ok;
    }
    return false;
  } catch (err) {
    console.warn('Server push test error:', err);
    return false;
  }
}
