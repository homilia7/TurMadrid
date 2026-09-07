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
  Users
} from 'lucide-react';

import { formatDateWithDay } from '../utils/dateUtils';

interface FlightSectionProps {
  travelers: Traveler[];
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  activeTravelerId: string;
}

export const FlightSection: React.FC<FlightSectionProps> = ({
  travelers,
  documents,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);

  const [flightTitle, setFlightTitle] = useState<string>('Vuelo San José ✈ Madrid');
  const [flightAirline, setFlightAirline] = useState<string>('Iberia');
  const [flightNumber, setFlightNumber] = useState<string>('IB-6310');
  const [flightOrigin, setFlightOrigin] = useState<string>('San José (SJO)');
  const [flightDestination, setFlightDestination] = useState<string>('Madrid (MAD)');
  const [flightDeparture, setFlightDeparture] = useState<string>('2026-09-10T23:20');
  const [flightArrival, setFlightArrival] = useState<string>('2026-09-11T16:30');
  const [flightTerminal, setFlightTerminal] = useState<string>('T4S');
  const [flightGate, setFlightGate] = useState<string>('Puerta 5');
  const [flightSeat, setFlightSeat] = useState<string>('Asientos Grupo');
  const [flightReference, setFlightReference] = useState<string>('PNR-77894');
  const [flightTravelerId, setFlightTravelerId] = useState<string>('');
  const [flightNotes, setFlightNotes] = useState<string>('');
  const [uploadedFileData, setUploadedFileData] = useState<{ name: string; url: string; type: 'pdf' | 'image' | 'digital' } | null>(null);

  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];
  const allFlights = safeDocs.filter((d) => d.category === 'vuelo');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = () => {
      setUploadedFileData({
        name: file.name,
        url: reader.result as string,
        type: isPdf ? 'pdf' : 'image',
      });
    };

    reader.readAsDataURL(file);
  };

  const handleSaveFlight = () => {
    if (!flightTitle.trim()) return;

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
      notes: flightNotes.trim(),
      fileName: uploadedFileData?.name || 'Pase_Digital.pdf',
      fileType: uploadedFileData?.type || 'digital',
      dataUrl: uploadedFileData?.url || '',
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    onAddDocument(newFlight);
    setIsAddModalOpen(false);
    setUploadedFileData(null);
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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Agregar Pasaje / Vuelo
        </button>
      </div>

      <div className="space-y-4">
        {allFlights.map((flight) => {
          const assignedTraveler = safeTravelers.find((t) => t.id === flight.travelerId);
          const hasFile = Boolean(flight.dataUrl);

          return (
            <div
              key={flight.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:border-sky-300 hover:shadow-md transition"
            >
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600/30 border border-sky-400/30 text-sky-300">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                        {flight.airline || 'Aerolínea'} {flight.flightNumber && `• ${flight.flightNumber}`}
                      </span>
                      {assignedTraveler ? (
                        <span className="text-xs font-medium text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 flex items-center gap-1">
                          👤 {assignedTraveler.name}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Grupo Completo (5 Viajeros)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{flight.title}</h3>
                  </div>
                </div>

                <div className="text-right self-end sm:self-center">
                  <span className="text-xs font-mono text-gray-400 block">Ref / PNR</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{flight.referenceNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-gray-400 block">Origen</span>
                    <p className="text-base font-black text-gray-900">{flight.origin || 'San José (SJO)'}</p>
                    <span className="text-xs text-sky-700 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Salida: {flight.departureTime || '23:20'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-2 sm:my-0">
                    <div className="flex items-center gap-2 text-sky-600">
                      <span className="h-0.5 w-12 bg-sky-300"></span>
                      <Plane className="w-4 h-4 rotate-90 sm:rotate-0" />
                      <span className="h-0.5 w-12 bg-sky-300"></span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold mt-1">Vuelo Directo / Conexión</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-gray-400 block">Destino</span>
                    <p className="text-base font-black text-gray-900">{flight.destination || 'Madrid (MAD)'}</p>
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 sm:justify-end mt-0.5">
                      <Clock className="w-3 h-3" /> Llegada: {flight.arrivalTime || '16:30'}
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
                    {hasFile && (
                      <>
                        <button
                          onClick={() => setPreviewDoc({
                            url: flight.dataUrl,
                            title: flight.title,
                            type: flight.fileType,
                          })}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Pase
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
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
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
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl transition"
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
                <h3 className="font-bold text-base">Registrar Nuevo Vuelo / Pase</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Título del Vuelo / Tramo</label>
                <input
                  type="text"
                  value={flightTitle}
                  onChange={(e) => setFlightTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Ej. Vuelo San José a Madrid (Iberia)"
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
                    placeholder="Iberia / Avianca"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nº de Vuelo</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="IB-6310"
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
                  <label className="text-xs font-bold text-gray-700 block mb-1">Fecha & Hora Salida</label>
                  <input
                    type="datetime-local"
                    value={flightDeparture}
                    onChange={(e) => setFlightDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Fecha & Hora Llegada</label>
                  <input
                    type="datetime-local"
                    value={flightArrival}
                    onChange={(e) => setFlightArrival(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    placeholder="T4S"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Puerta</label>
                  <input
                    type="text"
                    value={flightGate}
                    onChange={(e) => setFlightGate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs"
                    placeholder="Puerta 5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Asientos</label>
                  <input
                    type="text"
                    value={flightSeat}
                    onChange={(e) => setFlightSeat(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs"
                    placeholder="24A-E"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Código de Reserva (PNR)</label>
                  <input
                    type="text"
                    value={flightReference}
                    onChange={(e) => setFlightReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl uppercase font-mono"
                    placeholder="PNR-77894"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Viajero Asignado</label>
                  <select
                    value={flightTravelerId}
                    onChange={(e) => setFlightTravelerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="">Grupo Completo (5 Pasajeros)</option>
                    {travelers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                      className="text-rose-600 font-bold ml-2"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
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
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFlight}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Guardar Vuelo
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
