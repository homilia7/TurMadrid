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
import { ImageLightboxModal } from './ImageLightboxModal';

interface TicketsHubSectionProps {
  tours: Tour[];
  travelers: Traveler[];
  documents?: DocumentItem[];
  onOpenTourTickets: (tour: Tour) => void;
  onUpdateTourTickets: (tourId: string, tickets: DocumentItem[]) => void;
}

export const TicketsHubSection: React.FC<TicketsHubSectionProps> = ({
  tours,
  travelers,
  documents,
  onOpenTourTickets,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [isSelectTourModalOpen, setIsSelectTourModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    qrPayload?: string;
    ticketImage?: string;
    qrCropUrl?: string;
    travelerName?: string;
    date?: string;
    time?: string;
    location?: string;
    referenceNumber?: string;
    seatOrSection?: string;
  }>({
    isOpen: false,
    title: '',
    qrPayload: undefined,
  });

  const safeTours = Array.isArray(tours) ? tours : [];
  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Aggregate tickets from tours and documents
  const allTicketsWithTour: { ticket: DocumentItem; tour: Tour }[] = [];
  const addedTicketIds = new Set<string>();

  safeTours.forEach((tour) => {
    if (tour.tickets && tour.tickets.length > 0) {
      tour.tickets.forEach((ticket) => {
        if (!addedTicketIds.has(ticket.id)) {
          addedTicketIds.add(ticket.id);
          allTicketsWithTour.push({ ticket, tour });
        }
      });
    }
  });

  safeDocs
    .filter((doc) => doc.category === 'entrada')
    .forEach((doc) => {
      if (!addedTicketIds.has(doc.id)) {
        addedTicketIds.add(doc.id);
        const matchingTour = safeTours.find((t) => t.id === doc.tourId) || {
          id: doc.tourId || 'tour-general',
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          title: doc.title,
          city: 'Madrid',
          category: 'cultura',
          location: 'Madrid',
          description: '',
          alertHoursBefore: 3,
          alertEnabled: false,
          visitedByUserIds: [],
          tickets: [doc],
        };
        allTicketsWithTour.push({ ticket: doc, tour: matchingTour });
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Centro de Entradas y Reservas</h2>
              <span className="text-xs bg-amber-400/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                {allTicketsWithTour.length} {allTicketsWithTour.length === 1 ? 'entrada' : 'entradas'}
              </span>
            </div>
            <p className="text-xs text-amber-200">
              Accede a todas las entradas de museos, palacios y espectáculos organizadas por día
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSelectTourModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕ Subir Nueva Entrada</span>
        </button>
      </div>

      {/* Select Tour Modal to upload a ticket */}
      {isSelectTourModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Seleccionar Tour para Subir Entrada</h3>
                <p className="text-xs text-stone-500">¿A qué actividad del itinerario pertenece esta entrada?</p>
              </div>
              <button
                onClick={() => setIsSelectTourModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {safeTours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => {
                    setIsSelectTourModalOpen(false);
                    onOpenTourTickets(tour);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                      Día {tour.dayNumber} ({getDayOfWeek(tour.date)}) • {tour.city}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-950">{tour.title}</h4>
                    <span className="text-[11px] text-stone-500 block">
                      {tour.time} hrs • {tour.location}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                    Subir ➜
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setIsSelectTourModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
                {/* Tour Name Banner */}
                <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                    🏛️ Tour / Actividad:
                  </span>
                  <span className="text-xs font-extrabold text-stone-900 block leading-snug">
                    {tour.title}
                  </span>
                </div>

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
                      qrPayload: ticket.qrCodeText || undefined,
                      ticketImage: ticket.dataUrl,
                      qrCropUrl: ticket.qrCropUrl,
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

      {/* Image Zoom & Lightbox Fullscreen Modal */}
      {previewDoc && (
        <ImageLightboxModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          imageUrl={previewDoc.url}
          title={previewDoc.title}
          fileType={previewDoc.type as any}
        />
      )}

      {/* Large QR Scanner Modal */}
      <LargeQRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        qrPayload={qrModalData.qrPayload}
        ticketImage={qrModalData.ticketImage}
        qrCropUrl={qrModalData.qrCropUrl}
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
