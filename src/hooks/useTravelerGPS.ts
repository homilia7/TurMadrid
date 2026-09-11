import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveLocationShare } from '../types';
import { sendLocationToCloud } from '../utils/familySync';

interface UseTravelerGPSProps {
  travelerId: string;
  travelerName: string;
  onLocationUpdated?: (loc: LiveLocationShare) => void;
}

// Quick known landmarks lookup in Madrid/Spain to instantly name places even offline
function detectSpanishLandmark(lat: number, lng: number): string {
  const landmarks = [
    { name: 'Aeropuerto Madrid-Barajas (T4)', lat: 40.4918, lng: -3.5933, radius: 0.04 },
    { name: 'Aeropuerto Madrid-Barajas (T1-T2-T3)', lat: 40.4688, lng: -3.5686, radius: 0.03 },
    { name: 'Puerta del Sol (Centro de Madrid)', lat: 40.4169, lng: -3.7036, radius: 0.007 },
    { name: 'Plaza Mayor de Madrid', lat: 40.4155, lng: -3.7074, radius: 0.005 },
    { name: 'Gran Vía (Madrid)', lat: 40.4203, lng: -3.7058, radius: 0.008 },
    { name: 'Palacio Real y Catedral de la Almudena', lat: 40.4179, lng: -3.7143, radius: 0.007 },
    { name: 'Parque del Retiro', lat: 40.4153, lng: -3.6845, radius: 0.012 },
    { name: 'Museo Nacional del Prado', lat: 40.4138, lng: -3.6921, radius: 0.006 },
    { name: 'Templo de Debod / Plaza de España', lat: 40.4240, lng: -3.7178, radius: 0.007 },
    { name: 'Estación de Atocha', lat: 40.4068, lng: -3.6907, radius: 0.008 },
    { name: 'Estadio Santiago Bernabéu', lat: 40.4530, lng: -3.6883, radius: 0.008 },
    { name: 'Toledo (Casco Histórico)', lat: 39.8628, lng: -4.0273, radius: 0.03 },
    { name: 'Segovia (Acueducto y Alcázar)', lat: 40.9481, lng: -4.1184, radius: 0.03 },
  ];

  for (const lm of landmarks) {
    const dLat = Math.abs(lat - lm.lat);
    const dLng = Math.abs(lng - lm.lng);
    if (dLat <= lm.radius && dLng <= lm.radius) {
      return lm.name;
    }
  }

  // General bounding boxes
  if (lat >= 40.35 && lat <= 40.50 && lng >= -3.80 && lng <= -3.55) {
    return 'Madrid, España';
  }
  if (lat >= 39.80 && lat <= 39.90 && lng >= -4.10 && lng <= -3.95) {
    return 'Toledo, España';
  }
  if (lat >= 40.90 && lat <= 41.00 && lng >= -4.15 && lng <= -4.05) {
    return 'Segovia, España';
  }
  if (lat >= 36.0 && lat <= 43.8 && lng >= -9.3 && lng <= 3.3) {
    return 'España';
  }

  return 'En trayecto';
}

export function useTravelerGPS({
  travelerId,
  travelerName,
  onLocationUpdated,
}: UseTravelerGPSProps) {
  const [isTracking, setIsTracking] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tur_gps_tracking_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [currentLocation, setCurrentLocation] = useState<LiveLocationShare | null>(() => {
    try {
      const saved = localStorage.getItem(`tur_last_gps_${travelerId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const lastUploadedCoordsRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // Get battery level if browser supports Battery API
  const getBatteryPercentage = async (): Promise<number | null> => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Process and upload a position fix
  const processPosition = useCallback(
    async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy;
      const speed = pos.coords.speed;
      const heading = pos.coords.heading;
      const altitude = pos.coords.altitude;

      setAccuracy(Math.round(acc));
      setError(null);

      const placeName = detectSpanishLandmark(lat, lng);
      const batteryLevel = await getBatteryPercentage();

      const newLoc: LiveLocationShare = {
        travelerId,
        travelerName,
        lat,
        lng,
        accuracy: Math.round(acc),
        placeName,
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)} (${placeName})`,
        speed: speed !== null && !isNaN(speed) ? Math.round(speed * 3.6) : null, // convert m/s to km/h
        heading: heading !== null && !isNaN(heading) ? Math.round(heading) : null,
        altitude: altitude !== null && !isNaN(altitude) ? Math.round(altitude) : null,
        batteryLevel,
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      setCurrentLocation(newLoc);
      try {
        localStorage.setItem(`tur_last_gps_${travelerId}`, JSON.stringify(newLoc));
      } catch {}

      // Debounce upload: only send if moved > 10m or if 15 seconds have passed
      const now = Date.now();
      const last = lastUploadedCoordsRef.current;
      const timeDiff = last ? now - last.time : 999999;
      const distDiff = last ? Math.abs(lat - last.lat) + Math.abs(lng - last.lng) : 999999;

      if (timeDiff >= 15000 || distDiff > 0.00015) {
        lastUploadedCoordsRef.current = { lat, lng, time: now };
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        await sendLocationToCloud(newLoc);
        onLocationUpdated?.(newLoc);
      }
    },
    [travelerId, travelerName, onLocationUpdated]
  );

  const handleGeoError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Error obteniendo señal GPS';
    if (err.code === err.PERMISSION_DENIED) {
      msg = 'Permiso de ubicación denegado en tu navegador.';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = 'Señal GPS no disponible temporalmente.';
    } else if (err.code === err.TIMEOUT) {
      msg = 'Tiempo de espera agotado buscando señal GPS.';
    }
    setError(msg);
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('La geolocalización no está soportada en este dispositivo.');
      return;
    }

    setError(null);
    setIsTracking(true);
    try {
      localStorage.setItem('tur_gps_tracking_enabled', 'true');
    } catch {}

    // 1. Immediate position fix
    navigator.geolocation.getCurrentPosition(
      (pos) => processPosition(pos),
      (err) => handleGeoError(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    // 2. Continuous watchPosition
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => processPosition(pos),
      (err) => handleGeoError(err),
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 10000 }
    );

    // 3. Heartbeat timer every 20 seconds to keep timestamp fresh
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    heartbeatTimerRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => processPosition(pos),
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 15000 }
      );
    }, 20000);
  }, [processPosition, handleGeoError]);

  // Stop GPS tracking
  const stopTracking = useCallback(async () => {
    setIsTracking(false);
    try {
      localStorage.setItem('tur_gps_tracking_enabled', 'false');
    } catch {}

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    const inactiveLoc: LiveLocationShare = {
      travelerId,
      travelerName,
      lat: currentLocation?.lat || 0,
      lng: currentLocation?.lng || 0,
      accuracy: accuracy || undefined,
      placeName: currentLocation?.placeName || 'Ubicación pausada',
      updatedAt: new Date().toISOString(),
      isActive: false,
    };

    setCurrentLocation(inactiveLoc);
    await sendLocationToCloud(inactiveLoc);
    onLocationUpdated?.(inactiveLoc);
  }, [travelerId, travelerName, currentLocation, accuracy, onLocationUpdated]);

  const toggleTracking = useCallback(
    async (forceState?: boolean): Promise<boolean> => {
      const nextState = forceState !== undefined ? forceState : !isTracking;
      if (nextState) {
        startTracking();
        return true;
      } else {
        await stopTracking();
        return false;
      }
    },
    [isTracking, startTracking, stopTracking]
  );

  const refreshLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => processPosition(pos),
      (err) => handleGeoError(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [processPosition, handleGeoError]);

  // Handle auto-start if previously enabled
  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    currentLocation,
    error,
    accuracy,
    lastSyncTime,
    toggleTracking,
    refreshLocation,
  };
}
