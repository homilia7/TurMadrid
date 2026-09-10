import React, { useState, useRef } from 'react';
import { Traveler, DocumentItem } from '../types';
import { 
  Plane, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Plus, 
  Clock, 
  QrCode, 
  Check, 
  X, 
  Users,
  Pencil,
  User
} from 'lucide-react';

import { formatDateWithDay } from '../utils/dateUtils';
import { optimizeImageForUpload } from '../utils/imageUtils';
import { FlightLiveTracker } from './FlightLiveTracker';
import { ImageLightboxModal } from './ImageLightboxModal';

// Generador de pase de abordar oficial de Iberojet E9 858 en formato vectorial SVG
function generateFlightBoardingPassSvg({
  airline = 'Iberojet',
  flightNumber = 'E9 858',
  passengerName = 'Jessica',
  origin = 'San José (SJO)',
  destination = 'Madrid Barajas (MAD)',
  departureTime = '10 Sept • 23:20',
  arrivalTime = '11 Sept • 17:35',
  seat = '12A (Ventana)',
  terminal = 'Terminal M (SJO) / Terminal 1 (MAD)',
  gate = 'Por asignar',
  referenceNumber = 'E9-858-SJO',
}: {
  airline?: string;
  flightNumber?: string;
  passengerName?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  seat?: string;
  terminal?: string;
  gate?: string;
  referenceNumber?: string;
}): string {
  const cleanRef = referenceNumber || 'E9-858-' + Math.floor(1000 + Math.random() * 9000);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 440" width="920" height="440">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#111827" />
      </linearGradient>
      <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
    </defs>
    <!-- Background Card -->
    <rect x="0" y="0" width="920" height="440" rx="24" fill="url(#cardBg)" stroke="#334155" stroke-width="2"/>
    <rect x="0" y="0" width="920" height="12" rx="6" fill="url(#goldBar)"/>

    <!-- Header info -->
    <text x="50" y="55" fill="#f59e0b" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" letter-spacing="2">PASE DE ABORDAR OFICIAL • BOARDING PASS</text>
    <text x="870" y="55" fill="#94a3b8" font-family="system-ui, monospace" font-size="13" font-weight="700" text-anchor="end">PNR / REF: ${cleanRef}</text>

    <!-- Main Boarding Pass Section -->
    <g transform="translate(50, 75)">
      <rect x="0" y="0" width="580" height="315" rx="16" fill="#1e293b" opacity="0.8"/>
      
      <!-- Airline & Flight -->
      <text x="35" y="42" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="900">${airline} • VUELO ${flightNumber}</text>
      <text x="545" y="42" fill="#10b981" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="end">CLASE TURISTA</text>

      <!-- Route Codes SJO -> MAD -->
      <text x="35" y="98" fill="#ffffff" font-family="system-ui, sans-serif" font-size="34" font-weight="900">SJO ✈ MAD</text>
      <text x="35" y="128" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">${origin} ➔ ${destination}</text>
      
      <!-- Passenger Name Highlighted -->
      <text x="35" y="175" fill="#a855f7" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">PASAJERO / PASSENGER:</text>
      <text x="35" y="215" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="28" font-weight="900">${passengerName}</text>
      
      <!-- Times, Seat & Terminal Grid -->
      <g transform="translate(35, 255)">
        <text x="0" y="0" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" font-weight="800">SALIDA</text>
        <text x="0" y="20" fill="#ffffff" font-family="system-ui, monospace" font-size="14" font-weight="800">${departureTime}</text>
        
        <text x="175" y="0" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" font-weight="800">LLEGADA</text>
        <text x="175" y="20" fill="#10b981" font-family="system-ui, monospace" font-size="14" font-weight="800">${arrivalTime}</text>
        
        <text x="350" y="0" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" font-weight="800">ASIENTO</text>
        <text x="350" y="20" fill="#f59e0b" font-family="system-ui, monospace" font-size="16" font-weight="900">${seat}</text>
      </g>
    </g>

    <!-- Stub / Right Section with Barcode -->
    <g transform="translate(660, 75)">
      <line x1="-15" y1="0" x2="-15" y2="315" stroke="#475569" stroke-width="2" stroke-dasharray="6,6"/>
      <rect x="0" y="0" width="210" height="315" rx="16" fill="#0b0f19" stroke="#1e293b"/>
      <text x="105" y="35" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="middle">CONTROL DE ACCESO</text>
      <text x="105" y="62" fill="#ffffff" font-family="system-ui, monospace" font-size="18" font-weight="900" text-anchor="middle">${flightNumber}</text>
      <text x="105" y="90" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">${passengerName}</text>
      <text x="105" y="112" fill="#fbbf24" font-family="system-ui, monospace" font-size="13" font-weight="700" text-anchor="middle">${seat}</text>
      
      <!-- Simulated Barcode -->
      <g transform="translate(25, 130)">
        <rect x="0" y="0" width="160" height="120" fill="#ffffff" rx="8"/>
        ${Array.from({ length: 27 }).map((_, i) => `<line x1="${12 + i * 5}" y1="15" x2="${12 + i * 5}" y2="105" stroke="#000000" stroke-width="${(i % 4 === 0 ? 3.5 : (i % 2 === 0 ? 2 : 1))}" />`).join('')}
      </g>
      <text x="105" y="285" fill="#94a3b8" font-family="system-ui, monospace" font-size="11" font-weight="700" text-anchor="middle">${cleanRef}</text>
    </g>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface FlightSectionProps {
  travelers: Traveler[];
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onUpdateDocument?: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  activeTravelerId: string;
}

export const FlightSection: React.FC<FlightSectionProps> = ({
  travelers,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  activeTravelerId,
}) => {
  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  const defaultTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0];
  const activeTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0];

  const [selectedTravelerFilter, setSelectedTravelerFilter] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    type: 'image' | 'pdf' | 'digital';
    fileName?: string;
  } | null>(null);

  const [flightTitle, setFlightTitle] = useState<string>('Vuelo San José ✈ Madrid (E9 858)');
  const [flightAirline, setFlightAirline] = useState<string>('Iberojet');
  const [flightNumber, setFlightNumber] = useState<string>('E9 858');
  const [flightOrigin, setFlightOrigin] = useState<string>('San José (SJO)');
  const [flightDestination, setFlightDestination] = useState<string>('Madrid (MAD)');
  const [flightDeparture, setFlightDeparture] = useState<string>('2026-09-10T23:20');
  const [flightArrival, setFlightArrival] = useState<string>('2026-09-11T17:35');
  const [flightTerminal, setFlightTerminal] = useState<string>('Terminal M (SJO) / Terminal 1 (MAD)');
  const [flightGate, setFlightGate] = useState<string>('Por asignar');
  const [flightSeat, setFlightSeat] = useState<string>('Por asignar');
  const [flightReference, setFlightReference] = useState<string>('E9-858-SJO');
  const [flightTravelerId, setFlightTravelerId] = useState<string>(defaultTraveler?.id || '');
  const [flightPassengerName, setFlightPassengerName] = useState<string>(defaultTraveler?.name || 'Jessica');
  const [flightNotes, setFlightNotes] = useState<string>('Vuelo directo nocturno San José (SJO) a Madrid Barajas (MAD) Terminal 1.');
  const [uploadedFileData, setUploadedFileData] = useState<{ name: string; url: string; type: 'pdf' | 'image' | 'digital' } | null>(null);

  const resetFormToDefaults = () => {
    const curTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0];
    setEditingFlightId(null);
    setFlightTitle('Vuelo San José ✈ Madrid (E9 858)');
    setFlightAirline('Iberojet');
    setFlightNumber('E9 858');
    setFlightOrigin('San José (SJO)');
    setFlightDestination('Madrid (MAD)');
    setFlightDeparture('2026-09-10T23:20');
    setFlightArrival('2026-09-11T17:35');
    setFlightTerminal('Terminal M (SJO) / Terminal 1 (MAD)');
    setFlightGate('Por asignar');
    setFlightSeat('Por asignar');
    setFlightReference('E9-858-SJO');
    setFlightTravelerId(curTraveler?.id || '');
    setFlightPassengerName(curTraveler?.name || 'Jessica');
    setFlightNotes('Vuelo directo nocturno San José (SJO) a Madrid Barajas (MAD) Terminal 1.');
    setUploadedFileData(null);
  };

  const handleOpenAddModal = () => {
    resetFormToDefaults();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (flight: DocumentItem) => {
    const assignedT = safeTravelers.find((t) => t.id === flight.travelerId);
    setEditingFlightId(flight.id);
    setFlightTitle(flight.title || 'Vuelo San José ✈ Madrid (E9 858)');
    setFlightAirline(flight.airline || 'Iberojet');
    setFlightNumber(flight.flightNumber || 'E9 858');
    setFlightOrigin(flight.origin || 'San José (SJO)');
    setFlightDestination(flight.destination || 'Madrid (MAD)');
    setFlightDeparture(flight.departureTime || '2026-09-10T23:20');
    setFlightArrival(flight.arrivalTime || '2026-09-11T17:35');
    setFlightTerminal(flight.terminal || 'Terminal M (SJO) / Terminal 1 (MAD)');
    setFlightGate(flight.gate || 'Por asignar');
    setFlightSeat(flight.seatOrSection || 'Por asignar');
    setFlightReference(flight.referenceNumber || 'E9-858-SJO');
    setFlightTravelerId(flight.travelerId || '');
    setFlightPassengerName(flight.passengerName || assignedT?.name || 'Grupo Completo (5 Pasajeros)');
    setFlightNotes(flight.notes || 'Vuelo directo nocturno San José (SJO) a Madrid Barajas (MAD) Terminal 1.');
    setUploadedFileData(
      flight.dataUrl
        ? {
            name: flight.fileName || 'Pase_Digital.pdf',
            url: flight.dataUrl,
            type: flight.fileType || 'digital',
          }
        : null
    );
    setIsAddModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = async () => {
      let result = reader.result as string;
      if (!isPdf && result.startsWith('data:image')) {
        const optimized = await optimizeImageForUpload(result);
        result = optimized.dataUrl;
      }
      setUploadedFileData({
        name: file.name,
        url: result,
        type: isPdf ? 'pdf' : 'image',
      });
    };

    reader.readAsDataURL(file);
  };

  const handleSaveFlight = () => {
    if (!flightTitle.trim()) return;

    const selectedTraveler = safeTravelers.find((t) => t.id === flightTravelerId);
    const finalPassengerName = flightPassengerName.trim() || selectedTraveler?.name || (flightTravelerId ? undefined : 'Grupo Completo (5 Pasajeros)');

    if (editingFlightId) {
      const existing = safeDocs.find((d) => d.id === editingFlightId);
      const updatedFlight: DocumentItem = {
        ...(existing || {}),
        id: editingFlightId,
        category: 'vuelo',
        title: flightTitle.trim(),
        airline: flightAirline.trim(),
        flightNumber: flightNumber.trim(),
        origin: flightOrigin.trim(),
        destination: flightDestination.trim(),
        departureTime: flightDeparture,
        arrivalTime: flightArrival,
        terminal: flightTerminal.trim(),
        gate: flightGate.trim(),
        seatOrSection: flightSeat.trim(),
        referenceNumber: flightReference.trim(),
        travelerId: flightTravelerId || undefined,
        passengerName: finalPassengerName,
        notes: flightNotes.trim(),
        fileName: uploadedFileData?.name || existing?.fileName || 'Pase_Digital.pdf',
        fileType: uploadedFileData?.type || existing?.fileType || 'digital',
        dataUrl: uploadedFileData?.url || existing?.dataUrl || '',
        uploadedAt: existing?.uploadedAt || new Date().toISOString().split('T')[0],
      };

      if (onUpdateDocument) {
        onUpdateDocument(updatedFlight);
      } else {
        onAddDocument(updatedFlight);
      }
    } else {
      const newFlight: DocumentItem = {
        id: `flight-${Date.now()}`,
        category: 'vuelo',
        title: flightTitle.trim(),
        airline: flightAirline.trim(),
        flightNumber: flightNumber.trim(),
        origin: flightOrigin.trim(),
        destination: flightDestination.trim(),
        departureTime: flightDeparture,
        arrivalTime: flightArrival,
        terminal: flightTerminal.trim(),
        gate: flightGate.trim(),
        seatOrSection: flightSeat.trim(),
        referenceNumber: flightReference.trim(),
        travelerId: flightTravelerId || undefined,
        passengerName: finalPassengerName,
        notes: flightNotes.trim(),
        fileName: uploadedFileData?.name || 'Pase_Digital.pdf',
        fileType: uploadedFileData?.type || 'digital',
        dataUrl: uploadedFileData?.url || '',
        uploadedAt: new Date().toISOString().split('T')[0],
      };

      onAddDocument(newFlight);
    }

    setIsAddModalOpen(false);
    resetFormToDefaults();
  };

  // Helper para verificar si un vuelo pertenece al viajero en sesión activa
  const isMyFlight = (flight: DocumentItem): boolean => {
    if (!activeTraveler) return false;
    if (flight.travelerId && flight.travelerId === activeTraveler.id) return true;
    const activeName = (activeTraveler.name || '').trim().toLowerCase();
    const passName = (flight.passengerName || '').trim().toLowerCase();
    if (activeName && passName) {
      if (passName === activeName) return true;
      if (passName.includes(activeName) || activeName.includes(passName)) return true;
    }
    const titleLower = (flight.title || '').toLowerCase();
    if (activeName && titleLower.includes(activeName)) return true;
    return false;
  };

  // Helper para vincular vuelo con su viajero
  const getFlightTraveler = (flight: DocumentItem): Traveler | undefined => {
    if (flight.travelerId) {
      const byId = safeTravelers.find((t) => t.id === flight.travelerId);
      if (byId) return byId;
    }
    const passName = (flight.passengerName || '').trim().toLowerCase();
    if (passName) {
      const byName = safeTravelers.find((t) => (t.name || '').trim().toLowerCase() === passName);
      if (byName) return byName;
      const byInclude = safeTravelers.find((t) => passName.includes((t.name || '').trim().toLowerCase()));
      if (byInclude) return byInclude;
    }
    return undefined;
  };

  // Vuelos existentes en documents
  const existingFlightDocs = safeDocs.filter((d) => d.category === 'vuelo');

  // Asientos y códigos PNR oficiales para los 5 viajeros en Iberojet E9 858
  const defaultSeats = ['12A (Ventana)', '12B (Medio)', '12C (Pasillo)', '12D (Pasillo)', '12E (Ventana)'];
  const defaultCodes = ['JESS', 'MAYE', 'VILM', 'MERC', 'ANGE'];

  const allResolvedFlights: DocumentItem[] = [...existingFlightDocs];

  safeTravelers.forEach((traveler, index) => {
    const hasFlight = allResolvedFlights.some(
      (f) =>
        f.travelerId === traveler.id ||
        (f.passengerName && f.passengerName.trim().toLowerCase() === traveler.name.trim().toLowerCase())
    );
    if (!hasFlight) {
      allResolvedFlights.push({
        id: `flight-default-${traveler.id}`,
        category: 'vuelo',
        tourId: 't-1-flight',
        title: `Vuelo San José ✈ Madrid (E9 858) • ${traveler.name}`,
        airline: 'Iberojet',
        flightNumber: 'E9 858',
        origin: 'San José (SJO)',
        destination: 'Madrid (MAD)',
        departureTime: '2026-09-10T23:20',
        arrivalTime: '2026-09-11T17:35',
        terminal: 'Terminal M (SJO) / Terminal 1 (MAD)',
        gate: 'Por asignar',
        seatOrSection: defaultSeats[index % defaultSeats.length],
        referenceNumber: `E9-858-${defaultCodes[index % defaultCodes.length] || traveler.name.substring(0, 4).toUpperCase()}`,
        travelerId: traveler.id,
        passengerName: traveler.name,
        notes: 'Vuelo directo nocturno San José (SJO) a Madrid Barajas (MAD) Terminal 1. Equipaje: 1 maleta 23kg en bodega + 10kg mano.',
        fileName: `Pase_Abordar_${traveler.name}_E9858.pdf`,
        fileType: 'digital',
        dataUrl: '',
        uploadedAt: '2026-09-10',
      });
    }
  });

  // ORDENAR INCONDICIONALMENTE: El tiquete del viajero en sesión APARECE DE PRIMERO
  const sortedFlights = [...allResolvedFlights].sort((a, b) => {
    const aMine = isMyFlight(a);
    const bMine = isMyFlight(b);
    if (aMine && !bMine) return -1;
    if (!aMine && bMine) return 1;
    return 0;
  });

  // Filtrar según píldora seleccionada
  const displayedFlights = sortedFlights.filter((flight) => {
    if (selectedTravelerFilter === 'all') return true;
    if (selectedTravelerFilter === 'mine') return isMyFlight(flight);
    return (
      flight.travelerId === selectedTravelerFilter ||
      (flight.passengerName &&
        flight.passengerName.toLowerCase().includes(
          (safeTravelers.find((t) => t.id === selectedTravelerFilter)?.name || '').toLowerCase()
        ))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-2xl">
            ✈️
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Pasajes de Avión & Vuelos</h2>
            <p className="text-xs text-sky-200">
              Gestiona pases de abordar, números de vuelo, terminales y asientos de los 5 viajeros
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Agregar Pasaje / Vuelo
        </button>
      </div>

      {/* Rastreador de Vuelo en Tiempo Real (Dos Secciones: Mapa GPS & Radar Satelital) */}
      <FlightLiveTracker documents={safeDocs} />

      {/* Barra de Filtro y Estado de Sesión Activa */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span className="text-base">👤</span>
            <span>Viajero en Sesión:</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white bg-amber-500/25 px-3 py-1 rounded-xl border border-amber-400/50 shadow-xs flex items-center gap-1.5">
            <span>{activeTraveler?.name || 'Viajero'}</span>
            <span className="text-[10px] text-amber-300 font-normal">(Tu tiquete aparece de primero ⭐)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedTravelerFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTravelerFilter === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            Todos ({sortedFlights.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTravelerFilter('mine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              selectedTravelerFilter === 'mine'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30'
            }`}
          >
            <span>⭐ Solo Mi Tiquete</span>
          </button>
        </div>
      </div>

      {/* Listado de Pasajes y Billetes de los Viajeros */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
            <span>🎫 Billetes y Pases de Abordar Registrados</span>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
              {displayedFlights.length} {displayedFlights.length === 1 ? 'registro' : 'registros'}
            </span>
          </h3>
        </div>

        {displayedFlights.map((flight) => {
          const assignedTraveler = getFlightTraveler(flight);
          const passengerDisplayName = flight.passengerName || assignedTraveler?.name || 'Grupo Completo (5 Pasajeros)';
          const isMine = isMyFlight(flight);
          const hasFile = Boolean(flight.dataUrl);

          // URL del pase para previsualizar: Usa archivo adjunto o genera el pase digital SVG oficial
          const flightPreviewUrl = flight.dataUrl || generateFlightBoardingPassSvg({
            airline: flight.airline || 'Iberojet',
            flightNumber: flight.flightNumber || 'E9 858',
            passengerName: passengerDisplayName,
            origin: flight.origin || 'San José (SJO)',
            destination: flight.destination || 'Madrid (MAD)',
            departureTime: flight.departureTime ? flight.departureTime.replace('T', ' • ') : '10 Sept • 23:20',
            arrivalTime: flight.arrivalTime ? flight.arrivalTime.replace('T', ' • ') : '11 Sept • 17:35',
            seat: flight.seatOrSection || 'Por asignar',
            terminal: flight.terminal || 'Terminal M (SJO) / Terminal 1 (MAD)',
            gate: flight.gate || 'Por asignar',
            referenceNumber: flight.referenceNumber || 'E9-858-SJO',
          });

          return (
            <div
              key={flight.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                isMine
                  ? 'border-2 border-amber-400 shadow-xl ring-4 ring-amber-400/30'
                  : 'border-gray-200/80 shadow-sm hover:border-sky-300 hover:shadow-md'
              }`}
            >
              {/* Banner Destacado Superior si es el tiquete del viajero en sesión */}
              {isMine && (
                <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-4 py-2 font-black text-xs sm:text-sm flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">⭐</span>
                    <span className="uppercase tracking-wider">¡ESTE ES TU TIQUETE DE VUELO! ({passengerDisplayName})</span>
                  </div>
                  <span className="text-[11px] font-bold bg-stone-950 text-amber-400 px-2.5 py-0.5 rounded-full shadow-2xs">
                    Tu Pase Personal #1
                  </span>
                </div>
              )}

              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600/30 border border-sky-400/30 text-sky-300 shrink-0">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-950 px-2.5 py-1 rounded-lg border border-sky-700 shadow-2xs">
                        {flight.airline || 'Aerolínea'} {flight.flightNumber && `• ${flight.flightNumber}`}
                      </span>

                      {/* Nombre del Pasajero destacado en grande y de alta visibilidad */}
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm sm:text-base font-black text-white shadow-md ${
                          isMine
                            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 border-2 border-amber-300 ring-2 ring-amber-400/50'
                            : 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 border-2 border-purple-300 ring-2 ring-purple-400/50'
                        }`}
                      >
                        <span className="text-base sm:text-lg">👤</span>
                        <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">
                          {isMine ? 'PASAJERO (TÚ):' : 'PASAJERO:'}
                        </span>
                        <span className="text-white drop-shadow-xs">{passengerDisplayName}</span>
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">{flight.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(flight)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 transition shadow-xs cursor-pointer border border-sky-300"
                    title="Editar información de este vuelo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar Vuelo</span>
                  </button>

                  <div className="text-right pl-2 border-l border-slate-700">
                    <span className="text-[10px] uppercase font-mono text-gray-400 block">Ref / PNR</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{flight.referenceNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Cuadrícula Principal: COLUMNA DE NOMBRE DEL PASAJERO AFUERA EN GRANDE + TRAMO */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-center bg-gradient-to-r from-sky-50/90 via-indigo-50/40 to-slate-50 p-4 rounded-2xl border border-sky-200/80 shadow-2xs">
                  {/* Columna 1: Nombre del Pasajero afuera en grande */}
                  <div
                    className={`p-4 bg-white rounded-2xl shadow-sm flex flex-col justify-center ${
                      isMine ? 'border-2 border-amber-500 ring-2 ring-amber-300/50' : 'border-2 border-purple-500'
                    }`}
                  >
                    <span
                      className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isMine ? 'text-amber-900' : 'text-purple-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      {isMine ? 'Tu Pase de Abordar / Titular' : 'Nombre del Pasajero / Titular'}
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 truncate" title={passengerDisplayName}>
                      {passengerDisplayName} {isMine && <span className="text-amber-600 text-sm font-bold">(Tú)</span>}
                    </p>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border mt-1.5 self-start ${
                        isMine
                          ? 'text-amber-900 bg-amber-100 border-amber-300'
                          : 'text-purple-800 bg-purple-100 border-purple-300'
                      }`}
                    >
                      {flight.seatOrSection && flight.seatOrSection !== 'Por asignar'
                        ? `Asiento: ${flight.seatOrSection}`
                        : `Viajero Asignado: ${passengerDisplayName}`}
                    </span>
                  </div>

                  {/* Columna 2: Origen */}
                  <div className="text-left bg-white/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Origen</span>
                    <p className="text-base sm:text-lg font-black text-gray-900">{flight.origin || 'San José (SJO)'}</p>
                    <span className="text-xs text-sky-700 font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Salida:{' '}
                      {flight.departureTime ? flight.departureTime.replace('T', ' • ') : '23:20'}
                    </span>
                  </div>

                  {/* Columna 3: Tramo / Vuelo */}
                  <div className="flex flex-col items-center justify-center my-1 md:my-0 text-center">
                    <div className="flex items-center gap-2 text-sky-600">
                      <span className="h-0.5 w-8 sm:w-12 bg-sky-300"></span>
                      <Plane className="w-4 h-4 rotate-90 md:rotate-0 text-sky-600" />
                      <span className="h-0.5 w-8 sm:w-12 bg-sky-300"></span>
                    </div>
                    <span className="text-xs font-black text-sky-950 mt-1">
                      {flight.flightNumber || 'E9 858'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {flight.airline || 'Iberojet'}
                    </span>
                  </div>

                  {/* Columna 4: Destino */}
                  <div className="text-left md:text-right bg-white/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Destino</span>
                    <p className="text-base sm:text-lg font-black text-gray-900">{flight.destination || 'Madrid (MAD)'}</p>
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 md:justify-end mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Llegada:{' '}
                      {flight.arrivalTime ? flight.arrivalTime.replace('T', ' • ') : '17:35'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-semibold">Terminal</span>
                    <span className="font-bold text-gray-800">{flight.terminal || 'Terminal 1 (MAD)'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-semibold">Puerta</span>
                    <span className="font-bold text-gray-800">{flight.gate || 'Ver pantallas'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-semibold">Asientos</span>
                    <span className="font-bold text-gray-800">{flight.seatOrSection || '5 Pasajeros'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-semibold">Equipaje</span>
                    <span className="font-bold text-emerald-700">Mano + 23kg Bodega</span>
                  </div>
                </div>

                {flight.notes && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                    <span className="font-bold block mb-0.5">⚠️ Indicaciones Importantes:</span>
                    {flight.notes}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {hasFile ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check className="w-3.5 h-3.5" /> Archivo PDF/Foto adjunto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                        <QrCode className="w-3.5 h-3.5" /> Pase Digital Oficial E9 858
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(flight)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 active:bg-sky-300 rounded-lg transition border border-sky-300 cursor-pointer shadow-2xs"
                      title="Editar información de este vuelo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Vuelo</span>
                    </button>

                    {/* BOTÓN GRANDE VER TIQUETE DE VUELO CON ZOOM PELLIZCO */}
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: flightPreviewUrl,
                          title: `Tiquete de Vuelo • ${passengerDisplayName} (${flight.flightNumber || 'E9 858'})`,
                          type: (flight.dataUrl
                            ? flight.fileType ||
                              (flight.dataUrl.startsWith('data:application/pdf') ||
                              flight.fileName?.toLowerCase().endsWith('.pdf')
                                ? 'pdf'
                                : 'image')
                            : 'image') as any,
                          fileName: flight.fileName || `Pase_Abordar_${passengerDisplayName}.svg`,
                        })
                      }
                      className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
                      title="Ver y ampliar tiquete de vuelo con zoom táctil"
                    >
                      <Eye className="w-5 h-5 stroke-[2.5]" />
                      <span>Ver tiquete de Vuelo</span>
                    </button>

                    <a
                      href={flightPreviewUrl}
                      download={flight.fileName || `Pase_Abordar_${passengerDisplayName}.svg`}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition shadow-2xs"
                    >
                      <Download className="w-4 h-4" /> Descargar
                    </a>

                    <button
                      onClick={() => {
                        if (window.confirm(`¿Deseas eliminar este registro de vuelo?`)) {
                          onDeleteDocument(flight.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {displayedFlights.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No hay pasajes para este filtro</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Presiona "Ver Todos" para ver los pases de abordar de todos los viajeros.
            </p>
            <button
              onClick={() => setSelectedTravelerFilter('all')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl transition cursor-pointer"
            >
              Ver Todos los Tiquetes
            </button>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-sky-950 text-white">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">
                  {editingFlightId ? '✏️ Editar Información del Vuelo' : '✈️ Registrar Nuevo Vuelo / Pase'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetFormToDefaults();
                }}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm">
              {/* SECCIÓN DESTACADA: NOMBRE DEL PASAJERO / VIAJERO */}
              <div className="bg-sky-50/90 border-2 border-sky-400 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-sky-600" />
                    Nombre del Pasajero (Se muestra en grande afuera en la tarjeta)
                  </label>
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-200/80 px-2.5 py-0.5 rounded-full border border-sky-300 shadow-2xs">
                    ⭐ Destacado en Tarjeta
                  </span>
                </div>

                <input
                  type="text"
                  value={flightPassengerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFlightPassengerName(val);
                    const matched = safeTravelers.find((t) => t.name.toLowerCase() === val.toLowerCase());
                    setFlightTravelerId(matched ? matched.id : '');
                  }}
                  className="w-full px-3.5 py-2.5 text-base font-black text-slate-900 bg-white border-2 border-sky-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-xs"
                  placeholder="Ej: Jessica, Mayela, Vilma, Mercedes, Angelica..."
                />

                {/* Botones de Selección Rápida de Viajeros */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Selección rápida del pasajero con un clic:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {safeTravelers.map((t) => {
                      const isSelected = flightTravelerId === t.id || flightPassengerName.toLowerCase() === t.name.toLowerCase();
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setFlightPassengerName(t.name);
                            setFlightTravelerId(t.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-300'
                              : 'bg-white text-slate-700 hover:bg-sky-100/80 border-slate-300 shadow-2xs'
                          }`}
                        >
                          <span>👤</span>
                          <span>{t.name}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setFlightPassengerName('Grupo Completo (5 Pasajeros)');
                        setFlightTravelerId('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        !flightTravelerId && flightPassengerName.includes('Grupo')
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-300 shadow-2xs'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Grupo Completo (5)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Título del Vuelo / Tramo</label>
                <input
                  type="text"
                  value={flightTitle}
                  onChange={(e) => setFlightTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Ej. Vuelo San José a Madrid (E9 858)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Aerolínea</label>
                  <input
                    type="text"
                    value={flightAirline}
                    onChange={(e) => setFlightAirline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="Iberojet"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nº de Vuelo</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                    placeholder="E9 858"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Origen (Aeropuerto)</label>
                  <input
                    type="text"
                    value={flightOrigin}
                    onChange={(e) => setFlightOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="San José (SJO)"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Destino (Aeropuerto)</label>
                  <input
                    type="text"
                    value={flightDestination}
                    onChange={(e) => setFlightDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="Madrid (MAD)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Fecha & Hora Salida (Costa Rica)</label>
                  <input
                    type="datetime-local"
                    value={flightDeparture}
                    onChange={(e) => setFlightDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Fecha & Hora Llegada (Madrid)</label>
                  <input
                    type="datetime-local"
                    value={flightArrival}
                    onChange={(e) => setFlightArrival(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Terminal</label>
                  <input
                    type="text"
                    value={flightTerminal}
                    onChange={(e) => setFlightTerminal(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs"
                    placeholder="Terminal M / Terminal 1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Puerta</label>
                  <input
                    type="text"
                    value={flightGate}
                    onChange={(e) => setFlightGate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs"
                    placeholder="Por asignar"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Asientos</label>
                  <input
                    type="text"
                    value={flightSeat}
                    onChange={(e) => setFlightSeat(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs"
                    placeholder="Por asignar"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Código de Reserva (PNR / Localizador)</label>
                <input
                  type="text"
                  value={flightReference}
                  onChange={(e) => setFlightReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl uppercase font-mono"
                  placeholder="E9-858-SJO"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Adjuntar Pase de Abordar (PDF o Foto)
                </label>
                {uploadedFileData ? (
                  <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                    <span className="truncate max-w-[250px] font-semibold">{uploadedFileData.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFileData(null)}
                      className="text-rose-600 font-bold ml-2 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Seleccionar Archivo del Celular
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notas / Recordatorios</label>
                <textarea
                  rows={2}
                  value={flightNotes}
                  onChange={(e) => setFlightNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  placeholder="Recordar llevar pasaportes físicos y peso de maletas..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetFormToDefaults();
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFlight}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingFlightId ? 'Guardar Cambios' : 'Guardar Vuelo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <ImageLightboxModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          imageUrl={previewDoc.url}
          title={previewDoc.title}
          fileType={previewDoc.type}
          fileName={previewDoc.fileName}
        />
      )}
    </div>
  );
};
