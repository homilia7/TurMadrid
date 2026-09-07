import React, { useState } from 'react';
import { Tour, Traveler, DocumentItem } from '../types';
import { 
  Ticket as TicketIcon, 
  Eye, 
  Download, 
  Calendar, 
  MapPin, 
  Search, 
  X, 
  Users,
  QrCode
} from 'lucide-react';
import { formatDateWithDay, getDayOfWeek } from '../utils/dateUtils';
import { LargeQRModal } from './LargeQRModal';

interface TicketsHubSectionProps {
  tours: Tour[];
  travelers: Traveler[];
  onOpenTourTickets: (tour: Tour) => void;
  onUpdateTourTickets: (tourId: string, tickets: DocumentItem[]) => void;
}

export const TicketsHubSection: React.FC<TicketsHubSectionProps> = ({
  tours,
  travelers,
  onOpenTourTickets,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    qrPayload: string;
    travelerName?: string;
    date?: string;
    time?: string;
    location?: string;
    referenceNumber?: string;
    seatOrSection?: string;
  }>({
    isOpen: false,
    title: '',
    qrPayload: '',
  });

  const safeTours = Array.isArray(tours) ? tours : [];
  const safeTravelers = Array.isArray(travelers) ? travelers : [];

  const allTicketsWithTour: { ticket: DocumentItem; tour: Tour }[] = [];
  safeTours.forEach((tour) => {
    if (tour.tickets && tour.tickets.length > 0) {
      tour.tickets.forEach((ticket) => {
        allTicketsWithTour.push({ ticket, tour });
      });
    }
  });

  const filtered = allTicketsWithTour.filter(({ ticket, tour }) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.referenceNumber && ticket.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = selectedCity === 'all' || tour.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(safeTours.map((t) => t.city))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-red-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl">
            🎟️
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Centro de Entradas y Reservas</h2>
            <p className="text-xs text-amber-200">
              Accede a todas las entradas de museos, palacios y espectáculos organizadas por día
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar entrada, museo o código..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white font-medium text-gray-700"
        >
          <option value="all">Todas las Ciudades</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(({ ticket, tour }) => {
          const assignedTraveler = safeTravelers.find((t) => t.id === ticket.travelerId);

          return (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:border-amber-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                    <TicketIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Día {tour.dayNumber} ({getDayOfWeek(tour.date)}) • {tour.city}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{ticket.title}</h3>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {ticket.referenceNumber || 'CONFIRMADA'}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1">
                <div className="text-xs text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {formatDateWithDay(tour.date)}
                    </span>
                    <span className="font-semibold text-gray-700">• {tour.time} hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{tour.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {assignedTraveler ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        👤 {assignedTraveler.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Users className="w-3 h-3" /> 5 Viajeros (Grupo)
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 font-medium">
                    {ticket.seatOrSection || 'Entrada General'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenTourTickets(tour)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Ver en Tour ➜
                </button>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => setQrModalData({
                      isOpen: true,
                      title: ticket.title,
                      qrPayload: ticket.qrCodeText || ticket.referenceNumber || `TICKET-${ticket.id}`,
                      travelerName: assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Viajeros)',
                      date: tour.date,
                      time: tour.time,
                      location: tour.location,
                      referenceNumber: ticket.referenceNumber,
                      seatOrSection: ticket.seatOrSection,
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Entrada QR
                  </button>

                  <button
                    onClick={() => setPreviewDoc({
                      url: ticket.dataUrl,
                      title: ticket.title,
                      type: ticket.fileType,
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Ticket
                  </button>

                  <a
                    href={ticket.dataUrl}
                    download={ticket.fileName || `${ticket.title}.svg`}
                    className="p-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition shadow-xs"
                    title="Descargar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
          <TicketIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No se encontraron entradas con ese filtro</p>
          <p className="text-xs text-gray-400 mt-1">Puedes buscar por nombre de museo, ciudad o código</p>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm truncate">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.title}
                  className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

      {/* Large QR Scanner Modal */}
      <LargeQRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        qrPayload={qrModalData.qrPayload}
        travelerName={qrModalData.travelerName}
        date={qrModalData.date}
        time={qrModalData.time}
        location={qrModalData.location}
        referenceNumber={qrModalData.referenceNumber}
        seatOrSection={qrModalData.seatOrSection}
      />
    </div>
  );
};
