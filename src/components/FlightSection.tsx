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
  const allFlights = safeDocs.filter((d) => d.category === 'vuelo');

  const defaultTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);

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

      {/* Listado de Pasajes y Billetes de los Viajeros */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
            <span>🎫 Billetes y Pases de Abordar Registrados</span>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
              {allFlights.length} {allFlights.length === 1 ? 'registro' : 'registros'}
            </span>
          </h3>
        </div>

        {allFlights.map((flight) => {
          const assignedTraveler = safeTravelers.find((t) => t.id === flight.travelerId);
          const passengerDisplayName = flight.passengerName || assignedTraveler?.name || 'Grupo Completo (5 Pasajeros)';
          const hasFile = Boolean(flight.dataUrl);

          return (
            <div
              key={flight.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:border-sky-300 hover:shadow-md transition"
            >
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600/30 border border-sky-400/30 text-sky-300 shrink-0">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                        {flight.airline || 'Aerolínea'} {flight.flightNumber && `• ${flight.flightNumber}`}
                      </span>
                      {assignedTraveler ? (
                        <span className="text-xs font-bold text-purple-200 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-700 flex items-center gap-1 shadow-2xs">
                          👤 {assignedTraveler.name}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-200 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-700 flex items-center gap-1 shadow-2xs">
                          <Users className="w-3 h-3" /> Grupo Completo (5 Viajeros)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">{flight.title}</h3>
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
                  <div className="p-3.5 bg-white rounded-xl border-2 border-sky-400 shadow-sm flex flex-col justify-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      Nombre del Pasajero
                    </span>
                    <p className="text-lg sm:text-xl font-black text-slate-900 mt-1 truncate" title={passengerDisplayName}>
                      {passengerDisplayName}
                    </p>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 mt-1 self-start">
                      {flight.seatOrSection && flight.seatOrSection !== 'Por asignar' ? `Asiento: ${flight.seatOrSection}` : (assignedTraveler ? `Viajero: ${assignedTraveler.name}` : '👥 Grupo Completo')}
                    </span>
                  </div>

                  {/* Columna 2: Origen */}
                  <div className="text-left bg-white/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Origen</span>
                    <p className="text-base sm:text-lg font-black text-gray-900">{flight.origin || 'San José (SJO)'}</p>
                    <span className="text-xs text-sky-700 font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Salida: {flight.departureTime ? flight.departureTime.replace('T', ' • ') : '23:20'}
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
                      <Clock className="w-3.5 h-3.5" /> Llegada: {flight.arrivalTime ? flight.arrivalTime.replace('T', ' • ') : '17:35'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-semibold">Terminal</span>
                    <span className="font-bold text-gray-800">{flight.terminal || 'T4S'}</span>
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <QrCode className="w-3.5 h-3.5" /> Pase Digital del Itinerario
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

                    {hasFile && (
                      <>
                        <button
                          onClick={() => setPreviewDoc({
                            url: flight.dataUrl,
                            title: flight.title,
                            type: flight.fileType,
                          })}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-4 h-4 stroke-[2.5]" /> Ver Pase
                        </button>
                        <a
                          href={flight.dataUrl}
                          download={flight.fileName || 'BoardingPass.pdf'}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>
                      </>
                    )}

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

        {allFlights.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No hay pasajes de avión registrados aún</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Sube los boletos de abordar y pasajes de los 5 viajeros con el botón "Agregar Pasaje / Vuelo".
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar Pasaje / Vuelo
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm truncate">{previewDoc.title}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-900/5 min-h-[300px]">
              {previewDoc.type === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[65vh] rounded-xl border border-gray-200"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
