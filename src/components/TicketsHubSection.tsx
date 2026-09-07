import React, { useState, useRef } from 'react';
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
  QrCode, 
  FileText, 
  Maximize2, 
  Trash2, 
  Lock, 
  AlertTriangle,
  Hotel,
  TramFront,
  Train,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  Camera,
  FileImage,
  Upload
} from 'lucide-react';
import { formatDateWithDay, getDayOfWeek } from '../utils/dateUtils';
import { deleteDocumentFromCloud, uploadDocumentToCloud } from '../utils/cloudSync';
import { formatCleanReference } from '../utils/ticketGenerator';
import { optimizeImageForUpload } from '../utils/imageUtils';
import { LargeQRModal } from './LargeQRModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface TicketsHubSectionProps {
  tours: Tour[];
  travelers: Traveler[];
  documents?: DocumentItem[];
  onOpenTourTickets: (tour: Tour) => void;
  onUpdateTourTickets: (tourId: string, tickets: DocumentItem[]) => void;
  onAddDocument?: (doc: DocumentItem) => void;
  onDeleteDocument?: (id: string) => void;
}

type HubCategory = 'tours' | 'hotel' | 'teleferico' | 'metro';

export const TicketsHubSection: React.FC<TicketsHubSectionProps> = ({
  tours,
  travelers,
  documents = [],
  onOpenTourTickets,
  onUpdateTourTickets,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [activeCategory, setActiveCategory] = useState<HubCategory>('tours');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  const [expandedTourIds, setExpandedTourIds] = useState<Set<string>>(new Set());
  const [expandedMetroTravelerIds, setExpandedMetroTravelerIds] = useState<Set<string>>(new Set());

  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    type: string;
    ticket?: DocumentItem;
    tour?: Tour;
  } | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; type: 'tourTicket' | 'genericDoc'; tourId?: string } | null>(null);
  const [activeTicketItem, setActiveTicketItem] = useState<{ ticket: DocumentItem; tour: Tour } | null>(null);
  const [deletePin, setDeletePin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

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

  const [isSelectTourModalOpen, setIsSelectTourModalOpen] = useState<boolean>(false);
  const [isAddGenericDocModalOpen, setIsAddGenericDocModalOpen] = useState<boolean>(false);
  const [genericModalCategory, setGenericModalCategory] = useState<'hotel' | 'teleferico' | 'metro'>('hotel');
  const [genericDocTripType, setGenericDocTripType] = useState<'ida' | 'regreso' | 'general'>('ida');
  const [genericDocTitle, setGenericDocTitle] = useState<string>('');
  const [genericDocReference, setGenericDocReference] = useState<string>('');
  const [genericDocTravelerId, setGenericDocTravelerId] = useState<string>('group');
  const [genericDocDateStart, setGenericDocDateStart] = useState<string>('');
  const [genericDocDateEnd, setGenericDocDateEnd] = useState<string>('');
  const [genericDocLocation, setGenericDocLocation] = useState<string>('');
  const [genericDocNotes, setGenericDocNotes] = useState<string>('');
  const [genericUploadedFile, setGenericUploadedFile] = useState<{
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'digital';
    fileSize: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const genericFileInputRef = useRef<HTMLInputElement>(null);

  const safeTours = Array.isArray(tours) ? tours : [];
  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  const hotelDocs = safeDocs.filter((d) => d.category === 'hotel' || d.category === 'reserva');
  const telefericoDocs = safeDocs.filter((d) => d.category === 'teleferico');
  const metroDocs = safeDocs.filter((d) => d.category === 'metro');

  interface TourWithTicketsGroup {
    tour: Tour;
    tickets: DocumentItem[];
  }

  const tourGroups: TourWithTicketsGroup[] = safeTours.map((tour) => {
    const directTickets = Array.isArray(tour.tickets) ? tour.tickets : [];
    const docTickets = safeDocs.filter((d) => d.tourId === tour.id && (d.category === 'entrada' || !d.category));
    
    const combined = new Map<string, DocumentItem>();
    directTickets.forEach((t) => combined.set(t.id, t));
    docTickets.forEach((d) => {
      if (!combined.has(d.id)) {
        combined.set(d.id, d);
      } else {
        const exist = combined.get(d.id)!;
        combined.set(d.id, {
          ...exist,
          ...d,
          qrCropUrl: d.qrCropUrl || exist.qrCropUrl,
          qrCodeText: d.qrCodeText || exist.qrCodeText,
          dataUrl: d.dataUrl || exist.dataUrl,
        });
      }
    });

    return {
      tour,
      tickets: Array.from(combined.values()),
    };
  });

  const totalTourTicketsCount = tourGroups.reduce((acc, g) => acc + g.tickets.length, 0);

  const filteredTourGroups = tourGroups.filter(({ tour, tickets }) => {
    const matchesSearch =
      !searchQuery.trim() ||
      tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tickets.some(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesCity = selectedCity === 'all' || tour.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(safeTours.map((t) => t.city))).filter(Boolean);

  const toggleTourAccordion = (tourId: string) => {
    setExpandedTourIds((prev) => {
      const next = new Set(prev);
      if (next.has(tourId)) {
        next.delete(tourId);
      } else {
        next.add(tourId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set(filteredTourGroups.map((g) => g.tour.id));
    setExpandedTourIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedTourIds(new Set());
  };

  const toggleMetroAccordion = (travelerId: string) => {
    setExpandedMetroTravelerIds((prev) => {
      const next = new Set(prev);
      if (next.has(travelerId)) {
        next.delete(travelerId);
      } else {
        next.add(travelerId);
      }
      return next;
    });
  };

  const handleExpandAllMetro = () => {
    const allIds = new Set(safeTravelers.map((t) => t.id));
    allIds.add('group');
    setExpandedMetroTravelerIds(allIds);
  };

  const handleCollapseAllMetro = () => {
    setExpandedMetroTravelerIds(new Set());
  };

  const handleOpenAddGenericDoc = (
    category: 'hotel' | 'teleferico' | 'metro',
    travelerId?: string,
    tripType: 'ida' | 'regreso' | 'general' = 'ida'
  ) => {
    setGenericModalCategory(category);
    setGenericUploadedFile(null);
    setGenericDocTravelerId(travelerId || 'group');
    setGenericDocTripType(tripType);
    setGenericDocNotes('');

    if (category === 'hotel') {
      setGenericDocTitle('Reserva Hotel Riu Plaza España');
      setGenericDocLocation('Calle Gran Vía 84, Madrid');
      setGenericDocReference('HTL-MAD-' + Math.floor(100000 + Math.random() * 900000));
      setGenericDocDateStart('2026-09-11');
      setGenericDocDateEnd('2026-09-18');
      setGenericDocNotes('Habitaciones para el grupo (5 personas). Desayuno incluido.');
    } else if (category === 'teleferico') {
      setGenericDocTitle('Entrada Teleférico de Madrid');
      setGenericDocLocation('Paseo del Pintor Rosales s/n');
      setGenericDocReference('TLF-' + Math.floor(100000 + Math.random() * 900000));
      setGenericDocDateStart('2026-09-12');
      setGenericDocDateEnd('');
      setGenericDocNotes('Pase de Ida y Vuelta - Cabina panorámica hacia Casa de Campo.');
    } else {
      const trav = travelerId && travelerId !== 'group' ? safeTravelers.find((t) => t.id === travelerId) : null;
      const travName = trav ? trav.name : '';
      if (tripType === 'ida') {
        setGenericDocTitle(travName ? `Ticket Metro Ida - ${travName}` : 'Ticket Metro Ida');
      } else if (tripType === 'regreso') {
        setGenericDocTitle(travName ? `Ticket Metro Regreso - ${travName}` : 'Ticket Metro Regreso');
      } else {
        setGenericDocTitle(travName ? `Tarjeta Metro - ${travName}` : 'Tarjeta Multi Transporte Metro');
      }
      setGenericDocLocation('Red de Metro y Autobuses EMT Madrid');
      setGenericDocReference('MTR-' + Math.floor(100000 + Math.random() * 900000));
      setGenericDocDateStart('');
      setGenericDocDateEnd('');
      setGenericDocNotes(tripType === 'ida' ? 'Boleto / Trayecto de Ida' : tripType === 'regreso' ? 'Boleto / Trayecto de Regreso' : 'Tarjeta de 10 viajes / Abono turístico');
    }

    setIsAddGenericDocModalOpen(true);
  };

  const handleGenericFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        let result = reader.result as string;
        let finalSize = `${(file.size / 1024).toFixed(1)} KB`;
        if (!isPdf && result.startsWith('data:image')) {
          const optimized = await optimizeImageForUpload(result);
          result = optimized.dataUrl;
          finalSize = optimized.fileSize;
        }
        setGenericUploadedFile({
          name: file.name,
          url: result,
          type: isPdf ? 'pdf' : 'image',
          fileSize: finalSize,
        });
      } catch (err) {
        console.warn('Error reading document file:', err);
      } finally {
        setIsUploadingFile(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSaveGenericDoc = () => {
    if (!genericDocTitle.trim()) return;

    const newDoc: DocumentItem = {
      id: `${genericModalCategory}-${Date.now()}`,
      category: genericModalCategory,
      title: genericDocTitle.trim(),
      fileName: genericUploadedFile?.name || `${genericDocTitle.trim()}.png`,
      fileType: genericUploadedFile?.type || 'digital',
      dataUrl: genericUploadedFile?.url || '',
      fileSize: genericUploadedFile?.fileSize || 'Digital',
      referenceNumber: genericDocReference.trim(),
      travelerId: genericDocTravelerId === 'group' ? undefined : genericDocTravelerId,
      seatOrSection: genericModalCategory === 'metro' ? genericDocTripType : undefined,
      departureTime: genericDocDateStart || undefined,
      arrivalTime: genericDocDateEnd || undefined,
      origin: genericDocLocation.trim() || undefined,
      notes: genericDocNotes.trim() || undefined,
      uploadedAt: new Date().toISOString(),
    };

    if (onAddDocument) {
      onAddDocument(newDoc);
    }

    setIsAddGenericDocModalOpen(false);
    setGenericUploadedFile(null);
  };

  const handleConfirmDelete = async () => {
    if (deletePin.trim() !== '8888') {
      setPinError(true);
      return;
    }

    if (!itemToDelete) return;

    if (itemToDelete.type === 'tourTicket' && itemToDelete.tourId) {
      const tour = safeTours.find((t) => t.id === itemToDelete.tourId);
      if (tour) {
        const currentTickets = Array.isArray(tour.tickets) ? tour.tickets : [];
        const updated = currentTickets.filter((t) => t.id !== itemToDelete.id);
        try {
          await deleteDocumentFromCloud(itemToDelete.id);
        } catch (err) {
          console.warn('Could not delete from cloud:', err);
        }
        if (onUpdateTourTickets) {
          onUpdateTourTickets(tour.id, updated);
        }
      }
    } else {
      if (onDeleteDocument) {
        onDeleteDocument(itemToDelete.id);
      }
    }

    setItemToDelete(null);
    setDeletePin('');
    setPinError(false);
  };

  const handleSaveCrop = async (croppedDataUrl: string, detectedQR?: string, targetTicketId?: string) => {
    if (!activeTicketItem) return;
    const { tour } = activeTicketItem;
    const currentTourTickets = Array.isArray(tour.tickets) && tour.tickets.length > 0
      ? tour.tickets
      : [activeTicketItem.ticket];
    const targetId = targetTicketId || activeTicketItem.ticket.id;
    const updatedTickets = currentTourTickets.map((t) => {
      if (t.id === targetId) {
        return {
          ...t,
          qrCropUrl: croppedDataUrl,
          qrCodeText: detectedQR || t.qrCodeText,
          referenceNumber: detectedQR || t.referenceNumber,
        };
      }
      return t;
    });
    const updatedTicket = updatedTickets.find((t) => t.id === targetId) || updatedTickets[0];
    try {
      await uploadDocumentToCloud(updatedTicket);
    } catch (err) {
      console.warn('Could not sync document directly to D1:', err);
    }
    if (onUpdateTourTickets) {
      await onUpdateTourTickets(tour.id, updatedTickets);
    }
    setActiveTicketItem({ ticket: updatedTicket, tour: { ...tour, tickets: updatedTickets } });
    setQrModalData((prev) => ({
      ...prev,
      qrCropUrl: croppedDataUrl,
      qrPayload: detectedQR || prev.qrPayload,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-red-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner">
            🎟️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">Centro de Entradas y Reservas</h2>
              <span className="text-xs bg-amber-400/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                {totalTourTicketsCount + hotelDocs.length + telefericoDocs.length + metroDocs.length} Pases
              </span>
            </div>
            <p className="text-xs text-amber-200">
              Accede a todas las entradas de museos, palacios, hoteles, teleférico y metro organizados
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSelectTourModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Subir Entrada a Tour</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-200/80 p-1.5 rounded-2xl border border-stone-300 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveCategory('tours')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'tours'
              ? 'bg-white text-amber-950 shadow-sm border border-amber-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <TicketIcon className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">Tours ({totalTourTicketsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('hotel')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'hotel'
              ? 'bg-white text-amber-900 shadow-sm border border-amber-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Hotel className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">Hotel ({hotelDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('teleferico')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'teleferico'
              ? 'bg-white text-emerald-900 shadow-sm border border-emerald-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <TramFront className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Teleférico ({telefericoDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('metro')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'metro'
              ? 'bg-white text-rose-900 shadow-sm border border-rose-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Train className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="truncate">Metro ({metroDocs.length})</span>
        </button>
      </div>

      {activeCategory === 'tours' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tour, actividad, museo o código..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filtrar por ciudad"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 text-stone-700 focus:bg-white focus:outline-none"
              >
                <option value="all">Todas las Ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={expandedTourIds.size === filteredTourGroups.length ? handleCollapseAll : handleExpandAll}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition cursor-pointer shrink-0"
              >
                {expandedTourIds.size === filteredTourGroups.length ? 'Cerrar Todos' : 'Abrir Todos'}
              </button>
            </div>
          </div>

          {filteredTourGroups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <TicketIcon className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800">No se encontraron actividades</h3>
              <p className="text-xs text-stone-500 mt-1">Prueba ajustando el término de búsqueda o la ciudad.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTourGroups.map(({ tour, tickets }) => {
                const isExpanded = expandedTourIds.has(tour.id);
                const hasTickets = tickets.length > 0;
                const hasCroppedQR = tickets.some((t) => t.qrCropUrl);

                return (
                  <div
                    key={tour.id}
                    className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden transition-all hover:border-amber-400/80"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTourAccordion(tour.id)}
                      className="w-full text-left p-4 bg-stone-50/70 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-xs ${
                            hasTickets ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-white'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider opacity-80 leading-none">DÍA</span>
                          <span className="text-base font-black leading-none mt-0.5">{tour.dayNumber}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.2 rounded-md">
                              {getDayOfWeek(tour.date)} • {tour.city}
                            </span>
                            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {tour.time} hrs
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug truncate" title={tour.title}>
                            {tour.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasTickets ? (
                          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300/80 flex items-center gap-1">
                            <TicketIcon className="w-3.5 h-3.5 text-amber-700" />
                            <span>{tickets.length} {tickets.length === 1 ? 'pase' : 'pases'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-lg hidden sm:inline">
                            Sin boletos
                          </span>
                        )}

                        {hasCroppedQR && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 hidden md:inline-flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-600" /> QR
                          </span>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-stone-200/70 flex items-center justify-center text-stone-600 ml-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-stone-100 space-y-4 bg-white animate-in fade-in duration-150">
                        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 font-bold text-stone-800">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>{formatDateWithDay(tour.date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-600">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span>{tour.location}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenTourTickets(tour)}
                            className="px-3 py-1 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <span>Subir / Ver Entradas</span>
                            <span>➜</span>
                          </button>
                        </div>

                        {tickets.length === 0 ? (
                          <div className="text-center py-6 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                            <p className="text-xs text-stone-500">Aún no se han subido entradas para esta actividad.</p>
                            <button
                              type="button"
                              onClick={() => onOpenTourTickets(tour)}
                              className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar la primera entrada</span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {tickets.map((ticket) => {
                              const assignedTraveler = ticket.travelerId
                                ? safeTravelers.find((t) => t.id === ticket.travelerId)
                                : null;

                              return (
                                <div
                                  key={ticket.id}
                                  className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between gap-3 relative"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-xs"
                                          style={{ backgroundColor: assignedTraveler?.avatarColor || '#d97706' }}
                                        >
                                          {(assignedTraveler?.name || 'G').substring(0, 1)}
                                        </div>
                                        <span className="text-xs font-bold text-stone-900 truncate max-w-[150px]">
                                          {assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Pax)'}
                                        </span>
                                      </div>

                                      <span
                                        className="text-[10px] font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 truncate max-w-[130px]"
                                        title={ticket.referenceNumber || ticket.qrCodeText || 'CONFIRMADA'}
                                      >
                                        Ref: {formatCleanReference(ticket.referenceNumber || ticket.qrCodeText)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2.5">
                                      <div
                                        onClick={() =>
                                          setPreviewDoc({
                                            url: ticket.dataUrl,
                                            title: ticket.title,
                                            type: ticket.fileType,
                                          })
                                        }
                                        className="w-14 h-14 rounded-lg bg-stone-950 border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer shadow-2xs"
                                      >
                                        {ticket.fileType === 'pdf' ? (
                                          <FileText className="w-6 h-6 text-red-400" />
                                        ) : (
                                          <img
                                            src={ticket.qrCropUrl || ticket.dataUrl}
                                            alt={ticket.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                          />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                                        </div>
                                      </div>

                                      <div className="min-w-0 flex-1 space-y-1">
                                        <h4 className="text-xs font-bold text-stone-900 truncate" title={ticket.title}>
                                          {ticket.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded uppercase">
                                            {ticket.fileType}
                                          </span>
                                          {ticket.qrCropUrl ? (
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                              ✓ QR Guardado
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded">
                                              ✂ QR Pendiente
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTicketItem({ ticket, tour });
                                        setQrModalData({
                                          isOpen: true,
                                          title: tour.title,
                                          qrPayload: ticket.qrCodeText || undefined,
                                          ticketImage: ticket.dataUrl,
                                          qrCropUrl: ticket.qrCropUrl,
                                          travelerName: assignedTraveler?.name || 'Pase Grupal (5 Pax)',
                                          date: tour.date,
                                          time: tour.time,
                                          location: tour.location,
                                          referenceNumber: ticket.referenceNumber,
                                          seatOrSection: ticket.seatOrSection,
                                        });
                                      }}
                                      className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>Entrada QR</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc({ url: ticket.dataUrl, title: ticket.title, type: ticket.fileType })}
                                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={ticket.dataUrl}
                                        download={ticket.fileName || `${ticket.title}.png`}
                                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setItemToDelete({ id: ticket.id, title: ticket.title, type: 'tourTicket', tourId: tour.id })}
                                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOTEL RESERVATIONS */}
      {/* ========================================================================= */}
      {activeCategory === 'hotel' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-amber-600" /> Reservas de Hotel
              </h3>
              <p className="text-xs text-stone-500">
                Comprobantes de alojamiento y vouchers de hotel
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddGenericDoc('hotel')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Subir Reserva
            </button>
          </div>

          {hotelDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-amber-200 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                🏨
              </div>
              <h4 className="text-base font-bold text-stone-800">Aún no hay reservas de hotel subidas</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Guarda los comprobantes de reserva para tenerlos disponibles offline.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddGenericDoc('hotel')}
                className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition cursor-pointer"
              >
                ➕ Subir Reserva de Hotel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotelDocs.map((doc) => {
                const assignedTraveler = doc.travelerId ? safeTravelers.find((t) => t.id === doc.travelerId) : null;
                return (
                  <div key={doc.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <Hotel className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Reserva de Hotel
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 mt-0.5">{doc.title}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'genericDoc' })}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                        {doc.origin && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{doc.origin}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold break-all">
                            Nº Ref / Localizador: {doc.referenceNumber || 'HTL-RES'}
                          </span>
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-600" />
                            {assignedTraveler ? assignedTraveler.name : 'Reserva Grupal (5 Pax)'}
                          </span>
                        </div>
                        {doc.notes && <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100 mt-1 leading-relaxed"><strong className="text-stone-700">Descripción: </strong>{doc.notes}</p>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium truncate">{doc.fileName || 'Comprobante digital'}</span>
                      <div className="flex items-center gap-1.5">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ url: doc.dataUrl, title: doc.title, type: doc.fileType })}
                            className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                        )}
                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.title}.png`}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELEFÉRICO */}
      {/* ========================================================================= */}
      {activeCategory === 'teleferico' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <TramFront className="w-5 h-5 text-emerald-600" /> Entradas Teleférico
              </h3>
              <p className="text-xs text-stone-500">
                Pases de acceso al Teleférico de Madrid
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddGenericDoc('teleferico')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Subir Entrada
            </button>
          </div>

          {telefericoDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-emerald-200 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl">
                🚡
              </div>
              <h4 className="text-base font-bold text-stone-800">Aún no hay entradas de teleférico</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Sube los tickets o códigos QR para subir al Teleférico de Madrid.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddGenericDoc('teleferico')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                ➕ Subir Pase Teleférico
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {telefericoDocs.map((doc) => {
                const assignedTraveler = doc.travelerId ? safeTravelers.find((t) => t.id === doc.travelerId) : null;
                return (
                  <div key={doc.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <TramFront className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Pase Teleférico
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 mt-0.5">{doc.title}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'genericDoc' })}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                        {doc.origin && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{doc.origin}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold break-all">
                            Nº Ref / Localizador: {doc.referenceNumber || 'TLF-PASE'}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Pax)'}
                          </span>
                        </div>
                        {doc.notes && <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100 mt-1 leading-relaxed"><strong className="text-stone-700">Descripción: </strong>{doc.notes}</p>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium truncate">{doc.fileName || 'Entrada digital'}</span>
                      <div className="flex items-center gap-1.5">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ url: doc.dataUrl, title: doc.title, type: doc.fileType })}
                            className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                        )}
                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.title}.png`}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* METRO TICKETS - ORGANIZED BY TRAVELER (IDA / REGRESO) */}
      {/* ========================================================================= */}
      {activeCategory === 'metro' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Train className="w-5 h-5 text-rose-600" /> Tickets del Metro por Viajero
              </h3>
              <p className="text-xs text-stone-500">
                Billetes asignados por persona: <strong>Ticket de Ida</strong> y <strong>Ticket de Regreso</strong> para cada integrante.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExpandAllMetro}
                className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
              >
                Expandir Todos
              </button>
              <button
                type="button"
                onClick={handleCollapseAllMetro}
                className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
              >
                Colapsar Todos
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddGenericDoc('metro')}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Subir Ticket Metro
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {safeTravelers.map((traveler) => {
              const travelerDocs = metroDocs.filter((d) => d.travelerId === traveler.id);
              const idaDoc = travelerDocs.find((d) => d.seatOrSection === 'ida' || d.title.toLowerCase().includes('ida'));
              const regresoDoc = travelerDocs.find((d) => d.seatOrSection === 'regreso' || d.title.toLowerCase().includes('regreso'));
              const otherDocs = travelerDocs.filter((d) => d.id !== idaDoc?.id && d.id !== regresoDoc?.id);
              const isExpanded = expandedMetroTravelerIds.has(traveler.id);

              return (
                <div
                  key={traveler.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden transition-all hover:border-rose-300/80"
                >
                  {/* Traveler Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleMetroAccordion(traveler.id)}
                    className="w-full text-left p-4 bg-stone-50/70 hover:bg-rose-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-xs shrink-0"
                        style={{ backgroundColor: traveler.avatarColor }}
                      >
                        {traveler.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-stone-900">{traveler.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            Viajero
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {travelerDocs.length === 0
                            ? 'Sin tickets asignados'
                            : `${travelerDocs.length} ${travelerDocs.length === 1 ? 'ticket asignado' : 'tickets asignados'}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border hidden sm:inline-flex items-center gap-1 ${
                          idaDoc
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-stone-100 text-stone-400 border-stone-200'
                        }`}
                      >
                        <span>🟢 Ida:</span>
                        <span>{idaDoc ? 'Listo' : 'Pendiente'}</span>
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border hidden sm:inline-flex items-center gap-1 ${
                          regresoDoc
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-stone-100 text-stone-400 border-stone-200'
                        }`}
                      >
                        <span>🔵 Regreso:</span>
                        <span>{regresoDoc ? 'Listo' : 'Pendiente'}</span>
                      </span>

                      <div className="w-7 h-7 rounded-lg bg-stone-200/70 flex items-center justify-center text-stone-600 ml-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Traveler Accordion Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-stone-100 space-y-4 bg-white animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                        <span className="text-xs font-bold text-stone-700">
                          Billetes de Metro de {traveler.name} (Ida y Vuelta)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenAddGenericDoc('metro', traveler.id, 'ida')}
                          className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Subir Billete</span>
                        </button>
                      </div>

                      {/* 2 Main Slots: Ticket Ida & Ticket Regreso */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* SLOT 1: TICKET IDA */}
                        {idaDoc ? (
                          <div className="p-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/30 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300/80 flex items-center gap-1">
                                  <span>🟢</span> Ticket de Ida
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete({ id: idaDoc.id, title: idaDoc.title, type: 'genericDoc' })}
                                  className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-stone-900 break-words">{idaDoc.title}</h5>
                              
                              <div className="mt-2 space-y-1 bg-white/90 p-2.5 rounded-xl border border-emerald-200/80 text-xs shadow-2xs">
                                <div className="flex items-start gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-700 text-[11px] shrink-0">Nº Referencia / Localizador:</span>
                                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px] break-all">
                                    {idaDoc.referenceNumber || 'MTR-IDA'}
                                  </span>
                                </div>
                                {idaDoc.notes && (
                                  <p className="text-[11px] text-stone-600 break-words leading-relaxed pt-1 border-t border-emerald-100">
                                    <strong className="text-stone-700">Descripción: </strong>
                                    {idaDoc.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-stone-400 truncate">{idaDoc.fileName || 'Ticket digital'}</span>
                              <div className="flex items-center gap-1.5">
                                {idaDoc.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ url: idaDoc.dataUrl, title: idaDoc.title, type: idaDoc.fileType })}
                                    className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/60 rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> Ver
                                  </button>
                                )}
                                {idaDoc.dataUrl && (
                                  <a
                                    href={idaDoc.dataUrl}
                                    download={idaDoc.fileName || `${idaDoc.title}.png`}
                                    className="p-1 text-stone-500 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 transition"
                                    title="Descargar"
                                  >
                                    <Download className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleOpenAddGenericDoc('metro', traveler.id, 'ida')}
                            className="p-4 rounded-xl border-2 border-dashed border-stone-200 hover:border-emerald-400 bg-stone-50/50 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px] group"
                          >
                            <span className="text-xl mb-1 opacity-70 group-hover:scale-110 transition-transform">🟢</span>
                            <p className="text-xs font-bold text-stone-700">Ticket de Ida</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">Pendiente de subir para {traveler.name}</p>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 group-hover:bg-emerald-200/90 px-2.5 py-1 rounded-lg transition">
                              <Plus className="w-3 h-3" /> Subir Ticket Ida
                            </span>
                          </div>
                        )}

                        {/* SLOT 2: TICKET REGRESO */}
                        {regresoDoc ? (
                          <div className="p-3.5 rounded-xl border border-blue-200/90 bg-blue-50/30 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] uppercase font-black tracking-wider text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-300/80 flex items-center gap-1">
                                  <span>🔵</span> Ticket de Regreso
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete({ id: regresoDoc.id, title: regresoDoc.title, type: 'genericDoc' })}
                                  className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-stone-900 break-words">{regresoDoc.title}</h5>

                              <div className="mt-2 space-y-1 bg-white/90 p-2.5 rounded-xl border border-blue-200/80 text-xs shadow-2xs">
                                <div className="flex items-start gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-700 text-[11px] shrink-0">Nº Referencia / Localizador:</span>
                                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px] break-all">
                                    {regresoDoc.referenceNumber || 'MTR-REGRESO'}
                                  </span>
                                </div>
                                {regresoDoc.notes && (
                                  <p className="text-[11px] text-stone-600 break-words leading-relaxed pt-1 border-t border-blue-100">
                                    <strong className="text-stone-700">Descripción: </strong>
                                    {regresoDoc.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-blue-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-stone-400 truncate">{regresoDoc.fileName || 'Ticket digital'}</span>
                              <div className="flex items-center gap-1.5">
                                {regresoDoc.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ url: regresoDoc.dataUrl, title: regresoDoc.title, type: regresoDoc.fileType })}
                                    className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-white hover:bg-blue-100/60 rounded-lg border border-blue-300 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> Ver
                                  </button>
                                )}
                                {regresoDoc.dataUrl && (
                                  <a
                                    href={regresoDoc.dataUrl}
                                    download={regresoDoc.fileName || `${regresoDoc.title}.png`}
                                    className="p-1 text-stone-500 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 transition"
                                    title="Descargar"
                                  >
                                    <Download className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleOpenAddGenericDoc('metro', traveler.id, 'regreso')}
                            className="p-4 rounded-xl border-2 border-dashed border-stone-200 hover:border-blue-400 bg-stone-50/50 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px] group"
                          >
                            <span className="text-xl mb-1 opacity-70 group-hover:scale-110 transition-transform">🔵</span>
                            <p className="text-xs font-bold text-stone-700">Ticket de Regreso</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">Pendiente de subir para {traveler.name}</p>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-100/80 group-hover:bg-blue-200/90 px-2.5 py-1 rounded-lg transition">
                              <Plus className="w-3 h-3" /> Subir Ticket Regreso
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Other tickets for this traveler */}
                      {otherDocs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                            Otros Billetes / Tarjetas de {traveler.name}:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherDocs.map((doc) => (
                              <div key={doc.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold text-stone-600 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                      {doc.seatOrSection || 'General'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {doc.dataUrl && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewDoc({ url: doc.dataUrl, title: doc.title, type: doc.fileType })}
                                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                          title="Ver documento"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'genericDoc' })}
                                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <h6 className="text-xs font-bold text-stone-800 mt-1">{doc.title}</h6>
                                  
                                  <div className="mt-2 space-y-1 bg-white p-2 rounded-lg border border-stone-200 text-xs">
                                    <div className="flex items-start gap-1 flex-wrap">
                                      <span className="font-bold text-stone-700 text-[11px] shrink-0">Nº Referencia / Localizador:</span>
                                      <span className="font-mono font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[11px] break-all">
                                        {doc.referenceNumber || 'MTR-GENERAL'}
                                      </span>
                                    </div>
                                    {doc.notes && (
                                      <p className="text-[11px] text-stone-600 break-words leading-relaxed pt-1 border-t border-stone-100">
                                        <strong className="text-stone-700">Descripción: </strong>
                                        {doc.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* UNASSIGNED METRO TICKETS ACCORDION */}
            {metroDocs.filter((d) => !d.travelerId || d.travelerId === 'group').length > 0 && (() => {
              const groupDocs = metroDocs.filter((d) => !d.travelerId || d.travelerId === 'group');
              const isGroupExpanded = expandedMetroTravelerIds.has('group');

              return (
                <div className="bg-white rounded-2xl border border-dashed border-rose-200 shadow-xs overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleMetroAccordion('group')}
                    className="w-full text-left p-4 bg-rose-50/40 hover:bg-rose-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                        <Train className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-800">Billetes Grupales / Sin Asignar</h4>
                        <p className="text-xs text-stone-500">{groupDocs.length} {groupDocs.length === 1 ? 'billete' : 'billetes'}</p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-stone-200/70 flex items-center justify-center text-stone-600 ml-1">
                      {isGroupExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isGroupExpanded && (
                    <div className="p-4 sm:p-5 border-t border-rose-100 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-white animate-in fade-in duration-150">
                      {groupDocs.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-xs font-bold text-stone-800">{doc.title}</h5>
                              <div className="flex items-center gap-1 shrink-0">
                                {doc.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ url: doc.dataUrl, title: doc.title, type: doc.fileType })}
                                    className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                    title="Ver documento"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'genericDoc' })}
                                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 space-y-1 bg-white p-2 rounded-lg border border-stone-200 text-xs">
                              <div className="flex items-start gap-1 flex-wrap">
                                <span className="font-bold text-stone-700 text-[11px] shrink-0">Nº Referencia / Localizador:</span>
                                <span className="font-mono font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[11px] break-all">
                                  {doc.referenceNumber || 'MTR-GRUPAL'}
                                </span>
                              </div>
                              {doc.notes && (
                                <p className="text-[11px] text-stone-600 break-words leading-relaxed pt-1 border-t border-stone-100">
                                  <strong className="text-stone-700">Descripción: </strong>
                                  {doc.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: SELECT TOUR */}
      {isSelectTourModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">Seleccionar Tour</h3>
              <button onClick={() => setIsSelectTourModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            {safeTours.map((tour) => (
              <button key={tour.id} onClick={() => { setIsSelectTourModalOpen(false); onOpenTourTickets(tour); }} className="w-full text-left p-3 border rounded-xl hover:bg-amber-50">
                <h4 className="text-xs font-bold">{tour.title}</h4>
                <p className="text-[10px] text-stone-500">{tour.date} - {tour.city}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD GENERIC DOCUMENT (HOTEL / TELEFÉRICO / METRO) */}
      {isAddGenericDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                {genericModalCategory === 'hotel' ? (
                  <Hotel className="w-5 h-5 text-amber-600" />
                ) : genericModalCategory === 'teleferico' ? (
                  <TramFront className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Train className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-base font-extrabold text-stone-900">
                  {genericModalCategory === 'hotel'
                    ? 'Subir Reserva de Hotel'
                    : genericModalCategory === 'teleferico'
                    ? 'Subir Entrada de Teleférico'
                    : 'Subir Ticket de Metro'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGenericDocModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Asignar a Viajero */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Asignar a Viajero:
                </label>
                <select
                  value={genericDocTravelerId}
                  onChange={(e) => {
                    const newTravId = e.target.value;
                    setGenericDocTravelerId(newTravId);
                    if (genericModalCategory === 'metro') {
                      const trav = newTravId !== 'group' ? safeTravelers.find((t) => t.id === newTravId) : null;
                      const travName = trav ? trav.name : '';
                      if (genericDocTripType === 'ida') {
                        setGenericDocTitle(travName ? `Ticket Metro Ida - ${travName}` : 'Ticket Metro Ida');
                      } else if (genericDocTripType === 'regreso') {
                        setGenericDocTitle(travName ? `Ticket Metro Regreso - ${travName}` : 'Ticket Metro Regreso');
                      } else {
                        setGenericDocTitle(travName ? `Tarjeta Metro - ${travName}` : 'Tarjeta Multi Transporte Metro');
                      }
                    }
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="group">Pase Grupal (5 Viajeros)</option>
                  {safeTravelers.map((t) => (
                    <option key={t.id} value={t.id}>
                      Viajero: {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metro Trip Type Selection */}
              {genericModalCategory === 'metro' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Tipo de Trayecto:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGenericDocTripType('ida');
                        const trav = genericDocTravelerId !== 'group' ? safeTravelers.find((t) => t.id === genericDocTravelerId) : null;
                        setGenericDocTitle(trav ? `Ticket Metro Ida - ${trav.name}` : 'Ticket Metro Ida');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${
                        genericDocTripType === 'ida'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🟢</span>
                      <span>Ticket Ida</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGenericDocTripType('regreso');
                        const trav = genericDocTravelerId !== 'group' ? safeTravelers.find((t) => t.id === genericDocTravelerId) : null;
                        setGenericDocTitle(trav ? `Ticket Metro Regreso - ${trav.name}` : 'Ticket Metro Regreso');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${
                        genericDocTripType === 'regreso'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🔵</span>
                      <span>Ticket Regreso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGenericDocTripType('general');
                        const trav = genericDocTravelerId !== 'group' ? safeTravelers.find((t) => t.id === genericDocTravelerId) : null;
                        setGenericDocTitle(trav ? `Tarjeta Metro - ${trav.name}` : 'Tarjeta Multi Metro');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${
                        genericDocTripType === 'general'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🚇</span>
                      <span>General</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Título / Nombre:
                </label>
                <input
                  type="text"
                  value={genericDocTitle}
                  onChange={(e) => setGenericDocTitle(e.target.value)}
                  placeholder="Ej. Ticket Metro Ida - Jessica"
                  className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Nº Referencia / Localizador:
                </label>
                <input
                  type="text"
                  value={genericDocReference}
                  onChange={(e) => setGenericDocReference(e.target.value)}
                  placeholder="Ej. MTR-98214"
                  className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Foto o Archivo del Ticket:
                </label>
                {genericUploadedFile ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileImage className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-950 truncate">{genericUploadedFile.name}</p>
                        <span className="text-[10px] text-emerald-700 font-semibold">{genericUploadedFile.fileSize}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGenericUploadedFile(null)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => genericFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-amber-500 p-4 rounded-xl text-center cursor-pointer transition hover:bg-amber-50/20"
                  >
                    <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-stone-700">Toca para tomar foto o seleccionar archivo</p>
                    <p className="text-[10px] text-stone-400">Formatos: JPG, PNG, PDF</p>
                  </div>
                )}
                <input
                  ref={genericFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleGenericFilePicked}
                  className="hidden"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Notas / Detalles:
                </label>
                <textarea
                  rows={2}
                  value={genericDocNotes}
                  onChange={(e) => setGenericDocNotes(e.target.value)}
                  placeholder="Instrucciones o notas adicionales..."
                  className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddGenericDocModalOpen(false)}
                className="px-4 py-2 bg-stone-100 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUploadingFile || !genericDocTitle.trim()}
                onClick={handleSaveGenericDoc}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Deletion Modal (4-Digit PIN) */}
      {itemToDelete && (
        <div
          id="delete-item-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setItemToDelete(null);
            setDeletePin('');
            setPinError(false);
          }}
        >
          <div
            id="delete-item-modal-card"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-200 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-stone-900">
              Confirmar Eliminación
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Para eliminar <strong className="text-stone-900">"{itemToDelete.title}"</strong>, introduce el código de seguridad de 4 dígitos:
            </p>

            <div className="my-4">
              <input
                id="input-delete-pin"
                type="password"
                maxLength={4}
                autoFocus
                value={deletePin}
                onChange={(e) => {
                  setDeletePin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDelete();
                  }
                }}
                placeholder="••••"
                className={`w-36 text-center text-2xl font-mono font-black tracking-widest py-2 px-3 rounded-xl border ${
                  pinError
                    ? 'border-red-500 bg-red-50 text-red-600 ring-2 ring-red-300'
                    : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200'
                } focus:outline-none transition-all`}
              />

              {pinError && (
                <p className="text-xs text-red-600 font-bold mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Código incorrecto.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(null);
                  setDeletePin('');
                  setPinError(false);
                }}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-delete-item"
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <LargeQRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={activeTicketItem?.tour.title || qrModalData.title}
        tickets={
          activeTicketItem
            ? (tourGroups.find((g) => g.tour.id === activeTicketItem.tour.id)?.tickets ||
               (activeTicketItem.tour.tickets && activeTicketItem.tour.tickets.length > 0
                 ? activeTicketItem.tour.tickets
                 : [activeTicketItem.ticket]))
            : undefined
        }
        travelers={safeTravelers}
        initialTicketId={activeTicketItem?.ticket.id}
        qrPayload={qrModalData.qrPayload}
        ticketImage={qrModalData.ticketImage}
        qrCropUrl={qrModalData.qrCropUrl}
        travelerName={qrModalData.travelerName}
        date={qrModalData.date}
        time={qrModalData.time}
        location={qrModalData.location}
        referenceNumber={qrModalData.referenceNumber}
        seatOrSection={qrModalData.seatOrSection}
        onSaveCrop={handleSaveCrop}
      />

      {previewDoc && (
        <ImageLightboxModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          imageUrl={previewDoc.url}
          title={previewDoc.title}
          fileType={previewDoc.type as any}
        />
      )}
    </div>
  );
};
