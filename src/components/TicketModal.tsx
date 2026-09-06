import React, { useState, useRef } from 'react';
import { Tour, Ticket, Traveler } from '../types';
import {
  Ticket as TicketIcon,
  Download,
  Eye,
  Upload,
  Plus,
  Trash2,
  X,
  FileText,
  FileImage,
  Check,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Users
} from 'lucide-react';
import { generateDigitalTicketSvg, downloadFile } from '../utils/ticketGenerator';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  travelers: Traveler[];
  onUpdateTourTickets: (tourId: string, tickets: Ticket[]) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  tour,
  travelers,
  onUpdateTourTickets,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(
    tour.tickets.length > 0 ? tour.tickets[0] : null
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [ticketTitle, setTicketTitle] = useState<string>('');
  const [travelerId, setTravelerId] = useState<string>('group');
  const [seatOrRef, setSeatOrRef] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        tourId: tour.id,
        title: ticketTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileType: isPdf ? 'pdf' : isImage ? 'image' : 'digital',
        dataUrl,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        travelerId: travelerId === 'group' ? undefined : travelerId,
        seatOrSection: seatOrRef.trim() || undefined,
        referenceNumber: 'REF-' + Math.floor(100000 + Math.random() * 900000),
      };

      const updated = [...tour.tickets, newTicket];
      onUpdateTourTickets(tour.id, updated);
      setSelectedTicket(newTicket);
      setIsUploading(false);
      setTicketTitle('');
      setSeatOrRef('');
    };

    reader.readAsDataURL(file);
  };

  const handleGenerateDigitalTicket = () => {
    const assignedTraveler = travelers.find((t) => t.id === travelerId);
    const travelerLabel = assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Viajeros)';
    const refCode = 'PASS-' + Math.floor(100000 + Math.random() * 900000);

    const svgDataUrl = generateDigitalTicketSvg({
      tourTitle: tour.title,
      travelerName: travelerLabel,
      date: tour.date,
      time: tour.time,
      location: tour.location,
      meetingPoint: tour.meetingPoint,
      referenceNumber: refCode,
    });

    const newTicket: Ticket = {
      id: `ticket-gen-${Date.now()}`,
      tourId: tour.id,
      title: ticketTitle.trim() || `Entrada Oficial - ${travelerLabel}`,
      fileName: `Boleto_${tour.title.substring(0, 15).replace(/\s+/g, '_')}.svg`,
      fileType: 'digital',
      dataUrl: svgDataUrl,
      fileSize: '45 KB',
      uploadedAt: new Date().toISOString().split('T')[0],
      travelerId: travelerId === 'group' ? undefined : travelerId,
      seatOrSection: seatOrRef.trim() || 'Acceso General Prioritario',
      referenceNumber: refCode,
    };

    const updated = [...tour.tickets, newTicket];
    onUpdateTourTickets(tour.id, updated);
    setSelectedTicket(newTicket);
    setIsUploading(false);
    setTicketTitle('');
    setSeatOrRef('');
  };

  const handleDeleteTicket = (ticketId: string) => {
    const updated = tour.tickets.filter((t) => t.id !== ticketId);
    onUpdateTourTickets(tour.id, updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleDownload = (ticket: Ticket) => {
    downloadFile(ticket.dataUrl, ticket.fileName || `Entrada_${ticket.title}.svg`);
  };

  const activeTicket = selectedTicket || tour.tickets[0] || null;

  return (
    <div id="ticket-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div id="ticket-modal-card" className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 truncate max-w-xs sm:max-w-md">
                  Entradas y Boletos: {tour.title}
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {tour.tickets.length} {tour.tickets.length === 1 ? 'entrada' : 'entradas'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {tour.city} • {tour.date} a las {tour.time}
              </p>
            </div>
          </div>
          <button
            id="close-ticket-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: List of Tickets and Upload Button */}
          <div className="w-full md:w-72 border-r border-stone-100 p-4 bg-stone-50/50 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Pases Disponibles
              </span>
              <button
                type="button"
                onClick={() => setIsUploading(!isUploading)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Subir Entrada
              </button>
            </div>

            {/* List */}
            {tour.tickets.length === 0 ? (
              <div className="text-center py-8 px-3 border-2 border-dashed border-stone-200 rounded-xl bg-white">
                <TicketIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600">Aún no hay entradas para este tour</p>
                <p className="text-[11px] text-stone-400 mt-1">Sube un archivo PDF/imagen o genera un boleto digital</p>
                <button
                  type="button"
                  onClick={() => setIsUploading(true)}
                  className="mt-3 text-xs bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Agregar Entrada
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tour.tickets.map((t) => {
                  const isSelected = activeTicket?.id === t.id;
                  const assigned = travelers.find((tr) => tr.id === t.travelerId);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setIsUploading(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer border transition-all text-left relative group ${
                        isSelected
                          ? 'border-amber-500 bg-white shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {t.fileType === 'pdf' ? (
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                          ) : t.fileType === 'image' ? (
                            <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <QrCode className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-stone-800 truncate">
                            {t.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTicket(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 p-1 transition-opacity"
                          title="Eliminar entrada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                        <span>{assigned ? assigned.name : 'Pase Grupal (5 Pax)'}</span>
                        <span>{t.fileSize || 'SVG'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Tips */}
            <div className="mt-auto p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Disponibilidad Offline
              </span>
              Las entradas se guardan en tu dispositivo para que puedas mostrarlas en el acceso sin necesidad de conexión.
            </div>
          </div>

          {/* Right Main Area: Viewer or Upload Form */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-stone-100/40 flex flex-col justify-center">
            {isUploading ? (
              /* Upload Form */
              <div className="max-w-md mx-auto w-full bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <h4 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600" />
                  Subir o Generar Nueva Entrada
                </h4>
                <p className="text-xs text-stone-500 mb-4">
                  Sube el comprobante de compra o genera el voucher oficial del tour
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Nombre o Identificador de la Entrada:
                    </label>
                    <input
                      type="text"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder={`Ej: Entrada Oficial ${tour.title}`}
                      className="w-full text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Asignar a Viajero:
                    </label>
                    <select
                      value={travelerId}
                      onChange={(e) => setTravelerId(e.target.value)}
                      className="w-full text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="group">Pase Grupal (Aplica a los 5 Viajeros)</option>
                      {travelers.map((t) => (
                        <option key={t.id} value={t.id}>
                          Viajero: {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Asiento o Referencia (Opcional):
                    </label>
                    <input
                      type="text"
                      value={seatOrRef}
                      onChange={(e) => setSeatOrRef(e.target.value)}
                      placeholder="Ej: Acceso 11:15 AM / Coche 5"
                      className="w-full text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Upload file Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Archivo de Entrada (PDF o Imagen):
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/40 p-4 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-stone-700 block">
                        Haz clic para seleccionar archivo PDF o Foto
                      </span>
                      <span className="text-[10px] text-stone-400">PDF, JPG, PNG admitidos</span>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-stone-200"></div>
                    <span className="shrink mx-3 text-[11px] font-bold text-stone-400 uppercase">o también</span>
                    <div className="grow border-t border-stone-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDigitalTicket}
                    className="w-full text-xs font-semibold py-2.5 px-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Generar Boleto Digital Oficial con Código QR
                  </button>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUploading(false)}
                      className="text-xs font-medium text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTicket ? (
              /* Online Ticket Viewer */
              <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-4">
                {/* Actions Toolbar */}
                <div className="w-full flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{activeTicket.title}</span>
                    <span className="text-[11px] text-stone-400">
                      ({activeTicket.fileType.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="download-ticket-btn"
                      type="button"
                      onClick={() => handleDownload(activeTicket)}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Entrada
                    </button>
                  </div>
                </div>

                {/* Ticket Display Canvas */}
                <div className="w-full bg-stone-950 p-2 sm:p-4 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-stone-800">
                  {activeTicket.fileType === 'pdf' ? (
                    <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-xl p-4 text-center">
                      <FileText className="w-16 h-16 text-red-500 mb-3" />
                      <h4 className="font-bold text-stone-800 text-sm">{activeTicket.fileName}</h4>
                      <p className="text-xs text-stone-500 mt-1 mb-4">
                        Documento PDF cargado listo para inspección y descarga
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={activeTicket.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir PDF en pestaña nueva
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDownload(activeTicket)}
                          className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={activeTicket.dataUrl}
                      alt={activeTicket.title}
                      className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-md"
                    />
                  )}
                </div>

                {/* Ticket Details Summary Bar */}
                <div className="w-full bg-white p-3.5 rounded-xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-stone-400 font-medium">Lugar: </span>
                    <span className="font-semibold text-stone-800">{tour.location}</span>
                  </div>
                  {tour.meetingPoint && (
                    <div>
                      <span className="text-stone-400 font-medium">Punto de encuentro: </span>
                      <span className="font-semibold text-amber-800">{tour.meetingPoint}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-stone-400 font-medium">Ref: </span>
                    <span className="font-mono font-bold text-stone-700">
                      {activeTicket.referenceNumber || 'ESP-GRUPO-5'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Cada tour cuenta con almacenamiento de entradas digitales y comprobantes para los 5 viajeros.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors ml-auto"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
