import React, { useState, useRef } from 'react';
import { Tour, Traveler, Ticket } from '../types';
import {
  X,
  Plus,
  Trash2,
  Download,
  Calendar,
  Clock,
  MapPin,
  Compass,
  FileText,
  FileImage,
  Ticket as TicketIcon,
  Check,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Maximize2,
  Lock,
  AlertTriangle,
  ZoomIn,
  Users,
  Upload,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { generateDigitalTicketSvg, downloadFile } from '../utils/ticketGenerator';
import { formatDateWithDay, getDayOfWeek } from '../utils/dateUtils';
import { decodeQRFromImage } from '../utils/qrReader';
import { deleteDocumentFromCloud, uploadDocumentToCloud } from '../utils/cloudSync';
import { optimizeImageForUpload } from '../utils/imageUtils';
import { LargeQRModal } from './LargeQRModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  travelers: Traveler[];
  onUpdateTourTickets: (tourId: string, tickets: Ticket[]) => Promise<void> | void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  tour,
  travelers,
  onUpdateTourTickets,
}) => {
  const ticketsList = Array.isArray(tour.tickets) ? tour.tickets : [];
  const safeTravelers = Array.isArray(travelers) ? travelers : [];

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(
    ticketsList.length > 0 ? ticketsList[0] : null
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [ticketTitle, setTicketTitle] = useState<string>('');
  const [travelerId, setTravelerId] = useState<string>('group');
  const [seatOrRef, setSeatOrRef] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isScanningQR, setIsScanningQR] = useState<boolean>(false);
  const [isChangingImage, setIsChangingImage] = useState<boolean>(false);

  // 4-digit PIN deletion modal state for tickets (code: 8888)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteTicketPin, setDeleteTicketPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    fileType: 'pdf' | 'image' | 'digital';
    dataUrl: string;
    fileSize: string;
    detectedQR?: string;
    qrCropUrl?: string;
  } | null>(null);

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    setIsScanningQR(true);
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      let finalFileSize = `${(file.size / 1024).toFixed(1)} KB`;
      let detectedQR: string | undefined = undefined;
      let qrCropUrl: string | undefined = undefined;

      // Automatically attempt to scan and decode QR code from uploaded image
      if (isImage) {
        try {
          const qrResult = await decodeQRFromImage(dataUrl);
          if (qrResult && qrResult.text) {
            detectedQR = qrResult.text;
            qrCropUrl = qrResult.cropDataUrl;
            console.log('✅ QR Code real detectado en la entrada:', qrResult.text);
          }
          // Optimize/compress image for storage and fast cloud syncing
          const optimized = await optimizeImageForUpload(dataUrl);
          dataUrl = optimized.dataUrl;
          finalFileSize = optimized.fileSize;
        } catch (err) {
          console.warn('Error optimizando imagen o escaneando QR:', err);
        }
      }

      setPendingFile({
        fileName: file.name,
        fileType: isPdf ? 'pdf' : isImage ? 'image' : 'digital',
        dataUrl,
        fileSize: finalFileSize,
        detectedQR,
        qrCropUrl,
      });
      setIsScanningQR(false);

      if (!ticketTitle.trim()) {
        setTicketTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (detectedQR && !seatOrRef.trim()) {
        setSeatOrRef(detectedQR);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleChangeTicketFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentActive = selectedTicket || ticketsList[0];
    if (!file || !currentActive) return;

    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    setIsChangingImage(true);
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      let finalFileSize = `${(file.size / 1024).toFixed(1)} KB`;
      let detectedQR: string | undefined = currentActive.qrCodeText;
      let qrCropUrl: string | undefined = currentActive.qrCropUrl;

      if (isImage) {
        try {
          const qrResult = await decodeQRFromImage(dataUrl);
          if (qrResult && qrResult.text) {
            detectedQR = qrResult.text;
            qrCropUrl = qrResult.cropDataUrl;
            console.log('✅ Nuevo código QR detectado al cambiar imagen:', qrResult.text);
          }
          const optimized = await optimizeImageForUpload(dataUrl);
          dataUrl = optimized.dataUrl;
          finalFileSize = optimized.fileSize;
        } catch (err) {
          console.warn('Error optimizando nueva imagen:', err);
        }
      }

      const updatedTicket: Ticket = {
        ...currentActive,
        fileName: file.name,
        fileType: isPdf ? 'pdf' : isImage ? 'image' : 'digital',
        dataUrl,
        fileSize: finalFileSize,
        qrCodeText: detectedQR || currentActive.qrCodeText,
        qrCropUrl: qrCropUrl || currentActive.qrCropUrl,
        referenceNumber: detectedQR || currentActive.referenceNumber,
      };

      const updatedList = ticketsList.map((t) => (t.id === currentActive.id ? updatedTicket : t));
      await onUpdateTourTickets(tour.id, updatedList);
      setSelectedTicket(updatedTicket);
      setIsChangingImage(false);
      setSaveSuccessMsg('¡Imagen de la entrada cambiada con éxito!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);

      if (changeFileInputRef.current) {
        changeFileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleGenerateDigitalTicket = () => {
    const assignedTraveler = safeTravelers.find((t) => t.id === travelerId);
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

    setPendingFile({
      fileName: `Boleto_${tour.title.substring(0, 15).replace(/\s+/g, '_')}.svg`,
      fileType: 'digital',
      dataUrl: svgDataUrl,
      fileSize: '45 KB',
      detectedQR: refCode,
    });

    if (!ticketTitle.trim()) {
      setTicketTitle(`Entrada Oficial - ${travelerLabel}`);
    }
    if (!seatOrRef.trim()) {
      setSeatOrRef('Acceso General Prioritario');
    }
  };

  const handleSaveTicket = async () => {
    if (!pendingFile) {
      alert('Por favor selecciona un archivo PDF o Foto de la entrada, o presiona "Generar Boleto Digital".');
      return;
    }

    setIsSaving(true);
    const refCode = pendingFile.detectedQR || seatOrRef.trim() || undefined;

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      tourId: tour.id,
      category: 'entrada',
      title: ticketTitle.trim() || pendingFile.fileName.replace(/\.[^/.]+$/, '') || `Entrada ${tour.title}`,
      fileName: pendingFile.fileName,
      fileType: pendingFile.fileType,
      dataUrl: pendingFile.dataUrl,
      fileSize: pendingFile.fileSize,
      uploadedAt: new Date().toISOString().split('T')[0],
      travelerId: travelerId === 'group' ? undefined : travelerId,
      seatOrSection: seatOrRef.trim() || undefined,
      referenceNumber: refCode,
      qrCodeText: pendingFile.detectedQR || undefined,
      qrCropUrl: pendingFile.qrCropUrl || undefined,
    };

    const updated = [...ticketsList, newTicket];
    await onUpdateTourTickets(tour.id, updated);
    setSelectedTicket(newTicket);
    setIsSaving(false);
    setSaveSuccessMsg('¡Entrada guardada online exitosamente!');
    setTimeout(() => {
      setSaveSuccessMsg('');
      setIsUploading(false);
      setPendingFile(null);
      setTicketTitle('');
      setSeatOrRef('');
    }, 700);
  };

  const handleDeleteTicketClick = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setDeleteTicketPin('');
    setPinError(false);
  };

  const handleConfirmDeleteTicket = async () => {
    if (deleteTicketPin.trim() !== '8888') {
      setPinError(true);
      return;
    }

    if (!ticketToDelete) return;

    const ticketId = ticketToDelete.id;
    const updated = ticketsList.filter((t) => t.id !== ticketId);
    await deleteDocumentFromCloud(ticketId);
    await onUpdateTourTickets(tour.id, updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated.length > 0 ? updated[0] : null);
    }
    setTicketToDelete(null);
    setDeleteTicketPin('');
  };

  const handleDownload = (ticket: Ticket) => {
    downloadFile(ticket.dataUrl, ticket.fileName || `Entrada_${ticket.title}.svg`);
  };

  const activeTicket = selectedTicket || ticketsList[0] || null;

  return (
    <div id="ticket-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      {/* Hidden input for replacing existing ticket image/file */}
      <input
        type="file"
        ref={changeFileInputRef}
        onChange={handleChangeTicketFile}
        accept="image/*,.pdf"
        className="hidden"
      />

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
                  {ticketsList.length} {ticketsList.length === 1 ? 'entrada' : 'entradas'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                <span>{tour.city}</span>
                <span>•</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  {formatDateWithDay(tour.date)}
                </span>
                <span>•</span>
                <span className="font-semibold text-stone-700">{tour.time}</span>
              </div>
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
            {ticketsList.length === 0 ? (
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
                {ticketsList.map((t) => {
                  const isSelected = activeTicket?.id === t.id;
                  const assigned = safeTravelers.find((tr) => tr.id === t.travelerId);
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
                            handleDeleteTicketClick(t);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 p-1 transition-opacity cursor-pointer"
                          title="Eliminar entrada (requiere código 8888)"
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
              <div className="max-w-md mx-auto w-full bg-white p-6 rounded-2xl border border-stone-200 shadow-md">
                <h4 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600" />
                  Subir y Guardar Entrada
                </h4>
                <p className="text-xs text-stone-500 mb-4">
                  Sube el comprobante de compra (PDF o Foto) o genera el voucher oficial con código QR
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Asiento o Referencia / Código:
                    </label>
                    <input
                      type="text"
                      value={seatOrRef}
                      onChange={(e) => setSeatOrRef(e.target.value)}
                      placeholder="Ej: Acceso 11:15 AM / Coche 5 / REF-93821"
                      className="w-full text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Upload file Box or Selected File Preview */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Archivo de Entrada (PDF o Foto):
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFilePicked}
                      accept="image/*,.pdf"
                      className="hidden"
                    />

                    {pendingFile ? (
                      <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 flex flex-col gap-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {pendingFile.fileType === 'pdf' ? (
                              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            ) : pendingFile.fileType === 'image' ? (
                              <img
                                src={pendingFile.dataUrl}
                                alt="Preview"
                                className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <QrCode className="w-5 h-5" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-stone-900 block truncate">
                                {pendingFile.fileName}
                              </span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {pendingFile.fileType.toUpperCase()} • {pendingFile.fileSize}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition"
                          >
                            Cambiar
                          </button>
                        </div>

                        {isScanningQR && (
                          <div className="text-[11px] text-stone-500 flex items-center gap-1.5 animate-pulse">
                            <QrCode className="w-3.5 h-3.5 text-amber-600" />
                            <span>Escaneando código QR de la entrada...</span>
                          </div>
                        )}

                        {pendingFile.detectedQR && (
                          <div className="bg-emerald-100 text-emerald-900 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">QR Detectado: {pendingFile.detectedQR}</span>
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-stone-200"></div>
                    <span className="shrink mx-3 text-[10px] font-bold text-stone-400 uppercase">o también</span>
                    <div className="grow border-t border-stone-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDigitalTicket}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors flex items-center justify-center gap-1.5 border border-stone-200"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    Generar Boleto Digital Oficial con Código QR
                  </button>

                  {saveSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600" />
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Prominent Save Button */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploading(false);
                        setPendingFile(null);
                      }}
                      className="text-xs font-medium text-stone-500 hover:text-stone-700 px-3.5 py-2 rounded-xl transition"
                    >
                      Cancelar
                    </button>

                    <button
                      id="save-ticket-btn"
                      type="button"
                      disabled={isSaving || !pendingFile}
                      onClick={handleSaveTicket}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                        !pendingFile
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : isSaving
                          ? 'bg-amber-600 text-white cursor-wait'
                          : 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black cursor-pointer shadow-amber-500/20'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Guardando Online...</span>
                        </>
                      ) : (
                        <>
                          <span>💾 Guardar Entrada Online</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTicket ? (
              /* Online Ticket Viewer */
              <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-4">
                {/* Actions Toolbar */}
                <div className="w-full flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="text-xs font-bold text-stone-900 truncate">{activeTicket.title}</span>
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
                      {activeTicket.fileType.toUpperCase()}
                    </span>
                    {activeTicket.fileName && (
                      <span className="text-[11px] text-stone-400 font-mono truncate max-w-[160px] hidden sm:inline" title={activeTicket.fileName}>
                        ({activeTicket.fileName})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-change-ticket-image"
                      type="button"
                      disabled={isChangingImage}
                      onClick={() => changeFileInputRef.current?.click()}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 transition-colors flex items-center gap-1.5 border border-amber-300 cursor-pointer shadow-2xs"
                      title="Cambiar o reemplazar la foto o PDF de esta entrada"
                    >
                      {isChangingImage ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
                          <span>Cambiando...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-amber-700" />
                          <span>Cambiar Imagen</span>
                        </>
                      )}
                    </button>

                    <button
                      id="zoom-ticket-image-btn"
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors flex items-center gap-1.5 border border-stone-300 cursor-pointer"
                      title="Agrandar y hacer zoom en pantalla completa"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Agrandar</span>
                    </button>

                    <button
                      id="open-large-qr-btn"
                      type="button"
                      onClick={() =>
                        setQrModalData({
                          isOpen: true,
                          title: activeTicket.title,
                          qrPayload: activeTicket.qrCodeText || undefined,
                          ticketImage: activeTicket.dataUrl,
                          qrCropUrl: activeTicket.qrCropUrl,
                          travelerName:
                            safeTravelers.find((tr) => tr.id === activeTicket.travelerId)?.name ||
                            'Pase Grupal (5 Viajeros)',
                          date: tour.date,
                          time: tour.time,
                          location: tour.location,
                          referenceNumber: activeTicket.referenceNumber,
                          seatOrSection: activeTicket.seatOrSection,
                        })
                      }
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 transition-colors flex items-center gap-1.5 shadow-xs border border-stone-700 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-amber-400" />
                      Entrada QR
                    </button>

                    <button
                      id="download-ticket-btn"
                      type="button"
                      onClick={() => handleDownload(activeTicket)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>

                    <button
                      id="delete-ticket-btn"
                      type="button"
                      onClick={() => handleDeleteTicketClick(activeTicket)}
                      className="text-xs font-bold p-1.5 rounded-lg bg-stone-100 text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition-colors flex items-center cursor-pointer"
                      title="Eliminar entrada (requiere código 8888)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    {saveSuccessMsg}
                  </div>
                )}

                {/* Ticket Display Canvas */}
                <div
                  className="w-full bg-stone-950 p-2 sm:p-4 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-stone-800 relative group cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Haz clic para agrandar en pantalla completa"
                >
                  {/* Floating Change Image button inside canvas */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      type="button"
                      disabled={isChangingImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeFileInputRef.current?.click();
                      }}
                      className="bg-black/75 hover:bg-black/90 backdrop-blur-xs text-amber-300 hover:text-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-400/40 flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      title="Cambiar foto o archivo de esta entrada"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isChangingImage ? 'Procesando...' : '📷 Cambiar Foto'}</span>
                    </button>
                  </div>

                  <div className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 opacity-90 group-hover:opacity-100 flex items-center gap-1.5 transition">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>🔍 Agrandar</span>
                  </div>

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
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir PDF en pestaña nueva
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(activeTicket);
                          }}
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
                      className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-md group-hover:scale-[1.01] transition-transform"
                    />
                  )}
                </div>

                {/* Ticket Details Summary Bar */}
                <div className="w-full bg-white p-3.5 rounded-xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-stone-400 font-medium">Fecha: </span>
                    <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {formatDateWithDay(tour.date)}
                    </span>
                  </div>
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
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors ml-auto cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>

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

      {/* High-Resolution Image Zoom / Lightbox Modal */}
      {activeTicket && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={activeTicket.dataUrl}
          title={activeTicket.title}
          fileType={activeTicket.fileType}
          fileName={activeTicket.fileName}
        />
      )}

      {/* 4-Digit PIN Security Modal for Deleting Tickets (Code: 8888) */}
      {ticketToDelete && (
        <div
          id="delete-ticket-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setTicketToDelete(null)}
        >
          <div
            id="delete-ticket-modal-card"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-200 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-stone-900">
              Confirmar Borrado de Entrada
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Para eliminar <strong className="text-stone-900">"{ticketToDelete.title}"</strong>, introduce el código de seguridad de 4 dígitos:
            </p>

            <div className="my-4">
              <input
                id="input-delete-ticket-pin"
                type="password"
                maxLength={4}
                autoFocus
                value={deleteTicketPin}
                onChange={(e) => {
                  setDeleteTicketPin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDeleteTicket();
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
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-delete-ticket"
                type="button"
                onClick={handleConfirmDeleteTicket}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
