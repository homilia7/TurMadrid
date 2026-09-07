import React, { useEffect, useState, useRef } from 'react';
import {
  QrCode,
  X,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Camera,
  Check,
  Crop,
  Edit2,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Users,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { downloadFile, formatCleanReference } from '../utils/ticketGenerator';
import { decodeQRFromImage } from '../utils/qrReader';
import { captureFramedArea } from '../utils/imageUtils';
import { DocumentItem, Traveler } from '../types';

interface LargeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  tickets?: DocumentItem[];
  travelers?: Traveler[];
  initialTicketId?: string;
  onSaveCrop?: (croppedDataUrl: string, detectedQR?: string, ticketId?: string) => Promise<void> | void;
}

export const LargeQRModal: React.FC<LargeQRModalProps> = ({
  isOpen,
  onClose,
  title,
  ticketImage,
  qrCropUrl,
  travelerName,
  tickets,
  travelers = [],
  initialTicketId,
  onSaveCrop,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureToast, setCaptureToast] = useState<string>('');
  const [isFramingMode, setIsFramingMode] = useState<boolean>(false);

  // Tickets state array to support multiple tickets
  const [localTickets, setLocalTickets] = useState<DocumentItem[]>([]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number>(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);

  // Multi-touch pinch zoom & drag refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setCaptureToast('');

      let ticketArray: DocumentItem[] = [];
      if (Array.isArray(tickets) && tickets.length > 0) {
        ticketArray = [...tickets];
      } else if (ticketImage || qrCropUrl) {
        ticketArray = [
          {
            id: initialTicketId || 'single-ticket',
            title: title || 'Entrada',
            fileName: 'ticket.png',
            fileType: 'image',
            dataUrl: ticketImage || '',
            qrCropUrl: qrCropUrl,
            category: 'entrada',
            uploadedAt: new Date().toISOString(),
          },
        ];
      }

      setLocalTickets(ticketArray);

      let initialIdx = 0;
      if (initialTicketId && ticketArray.length > 0) {
        const foundIdx = ticketArray.findIndex((t) => t.id === initialTicketId);
        if (foundIdx >= 0) initialIdx = foundIdx;
      }
      setSelectedTicketIndex(initialIdx);

      const activeT = ticketArray[initialIdx];
      setIsFramingMode(!activeT?.qrCropUrl && Boolean(activeT?.dataUrl));
    }
  }, [isOpen, tickets, ticketImage, qrCropUrl, initialTicketId, title]);

  if (!isOpen) return null;

  const currentTicket = localTickets[selectedTicketIndex] || localTickets[0] || null;
  const currentTicketImage = currentTicket?.dataUrl || ticketImage || '';
  const currentCropUrl = currentTicket?.qrCropUrl;

  const currentTraveler = currentTicket?.travelerId
    ? travelers.find((tr) => tr.id === currentTicket.travelerId)
    : null;

  const currentPersonDisplayName = currentTraveler
    ? currentTraveler.name
    : currentTicket?.seatOrSection || travelerName || 'Pase Grupal (5 Viajeros)';

  // Active image to display in viewfinder: ALWAYS real ticket image or real crop
  const currentImageSource = isFramingMode
    ? (currentTicketImage || currentCropUrl || '')
    : (currentCropUrl || currentTicketImage || '');

  const handleSelectTicket = (index: number) => {
    setSelectedTicketIndex(index);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    const targetT = localTickets[index];
    setIsFramingMode(!targetT?.qrCropUrl && Boolean(targetT?.dataUrl));
    setCaptureToast('');
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1 && !isFramingMode) return;
    setIsDragging(true);
    touchStartPosRef.current = { ...position };
    touchStartClientRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - touchStartClientRef.current.x;
    const dy = e.clientY - touchStartClientRef.current.y;
    setPosition({
      x: touchStartPosRef.current.x + dx,
      y: touchStartPosRef.current.y + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.6));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Start editing existing capture / re-framing
  const handleStartEditing = () => {
    setIsFramingMode(true);
    setZoom(1.6);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleCancelEditing = () => {
    setIsFramingMode(false);
    handleResetZoom();
  };

  // Touch handlers for pinch-to-zoom & pan
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDistance(e.touches);
      touchStartZoomRef.current = zoom;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (zoom > 1.2) {
          handleResetZoom();
        } else {
          setZoom(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      setIsDragging(true);
      touchStartPosRef.current = { ...position };
      touchStartClientRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / touchStartDistRef.current;
      setZoom(Math.max(0.6, Math.min(6, touchStartZoomRef.current * scale)));
    } else if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - touchStartClientRef.current.x;
      const dy = e.touches[0].clientY - touchStartClientRef.current.y;
      setPosition({
        x: touchStartPosRef.current.x + dx,
        y: touchStartPosRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const handleDownloadActiveQR = () => {
    if (!currentImageSource) return;
    const filename = `QR_${currentPersonDisplayName.substring(0, 15)}_${title.substring(0, 15)}.png`.replace(/\s+/g, '_');
    downloadFile(currentImageSource, filename);
  };

  // Screenshot / Crop framed area & save permanently
  const handleCaptureFramedQR = async () => {
    if (!imageRef.current || !viewfinderRef.current) return;

    setIsCapturing(true);
    try {
      const croppedDataUrl = await captureFramedArea(imageRef.current, viewfinderRef.current, 750);
      if (croppedDataUrl) {
        let detectedQRText: string | undefined = undefined;
        try {
          const qrScan = await decodeQRFromImage(croppedDataUrl);
          if (qrScan && qrScan.text) {
            detectedQRText = qrScan.text;
          }
        } catch (err) {
          console.warn('QR scan on crop failed:', err);
        }

        // Update in parent state & DB
        if (onSaveCrop) {
          await onSaveCrop(croppedDataUrl, detectedQRText, currentTicket?.id);
        }

        // Update local state in modal
        setLocalTickets((prev) =>
          prev.map((t, i) =>
            i === selectedTicketIndex
              ? { ...t, qrCropUrl: croppedDataUrl, qrCodeText: detectedQRText || t.qrCodeText }
              : t
          )
        );

        setIsFramingMode(false);
        handleResetZoom();
        setCaptureToast(`¡Captura de ${currentPersonDisplayName} guardada con éxito!`);
        setTimeout(() => setCaptureToast(''), 4500);
      }
    } catch (err) {
      console.error('Error capturing framed QR:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Find next uncropped ticket if any
  const nextUncroppedIndex = localTickets.findIndex((t, idx) => idx !== selectedTicketIndex && !t.qrCropUrl);

  return (
    <div
      id="large-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/90 backdrop-blur-md transition-all animate-in fade-in"
      onClick={onClose}
      onMouseUp={handleMouseUp}
    >
      <div
        id="large-qr-modal-card"
        className={`bg-stone-900 border border-stone-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all max-h-[96vh] w-full ${
          isFullScreen ? 'max-w-3xl' : 'max-w-xl sm:max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
      >
        {/* Top Header - Minimalist */}
        <div className="px-4 py-3 sm:px-5 sm:py-3 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block leading-none mb-0.5">
                Código QR de la Entrada
              </span>
              <h3 className="text-sm font-bold text-white truncate" title={title}>
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Header Edit Button when Crop is already active */}
            {currentTicketImage && !isFramingMode && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700 hover:text-amber-200 flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Editar encuadre y tomar una nueva captura del QR"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Editar Captura</span>
                <span className="sm:hidden">Editar</span>
              </button>
            )}

            {isFramingMode && currentCropUrl && (
              <button
                type="button"
                onClick={handleCancelEditing}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 flex items-center gap-1 transition cursor-pointer"
                title="Volver a la captura guardada"
              >
                <span>Cancelar</span>
              </button>
            )}

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
              title={isFullScreen ? 'Reducir' : 'Ampliar'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              id="close-qr-modal-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MULTI-TICKET / PERSON SELECTOR (Shown when more than 1 ticket exists - fully visible without scrolling) */}
        {localTickets.length > 1 && (
          <div className="bg-stone-950/95 px-3.5 py-2.5 border-b border-stone-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Entradas por Persona:</span>
                <span className="text-stone-400 font-normal">({localTickets.length} viajeros)</span>
              </div>
              <div className="text-[11px] font-semibold">
                {localTickets.filter((t) => t.qrCropUrl).length === localTickets.length ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Todos listos
                  </span>
                ) : (
                  <span className="text-stone-400">
                    <strong className="text-emerald-400">{localTickets.filter((t) => t.qrCropUrl).length}</strong>/{localTickets.length} con QR
                  </span>
                )}
              </div>
            </div>

            {/* Responsive Grid of all Traveler Buttons - NO scrolling */}
            <div
              className={`grid gap-1.5 sm:gap-2 ${
                localTickets.length === 2
                  ? 'grid-cols-2'
                  : localTickets.length === 3
                  ? 'grid-cols-3'
                  : localTickets.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : localTickets.length === 5
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
              }`}
            >
              {localTickets.map((t, idx) => {
                const tr = t.travelerId ? travelers.find((trav) => trav.id === t.travelerId) : null;
                const name = tr ? tr.name : t.seatOrSection || t.title || `Entrada ${idx + 1}`;
                const isSelected = idx === selectedTicketIndex;
                const isCropped = Boolean(t.qrCropUrl);

                return (
                  <button
                    key={t.id || idx}
                    type="button"
                    onClick={() => handleSelectTicket(idx)}
                    className={`p-1.5 sm:p-2 rounded-xl text-left transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md ring-2 ring-amber-400/40 font-bold scale-[1.02]'
                        : 'bg-stone-900/90 hover:bg-stone-800/90 text-stone-200 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {/* Traveler avatar circle */}
                    <div
                      className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                        isSelected ? 'text-white' : 'text-white'
                      }`}
                      style={{ backgroundColor: tr?.avatarColor || (isSelected ? '#78350f' : '#44403c') }}
                    >
                      {name.substring(0, 1).toUpperCase()}
                    </div>

                    {/* Name & Status */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-bold leading-tight truncate ${
                          isSelected ? 'text-stone-950 font-black' : 'text-stone-200'
                        }`}
                        title={name}
                      >
                        {name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isCropped ? (
                          <span
                            className={`text-[9px] font-extrabold px-1 py-0.2 rounded-md inline-flex items-center gap-0.5 leading-none ${
                              isSelected
                                ? 'bg-stone-950 text-emerald-300'
                                : 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/50'
                            }`}
                          >
                            ✓ QR Listo
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-extrabold px-1 py-0.2 rounded-md inline-flex items-center gap-0.5 leading-none ${
                              isSelected
                                ? 'bg-stone-950/80 text-amber-200'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            }`}
                          >
                            ✂ Recortar
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Single Ticket Traveler Info Header */}
        {localTickets.length <= 1 && currentTraveler && (
          <div className="bg-stone-950/60 px-4 py-1.5 border-b border-stone-800/60 flex items-center gap-2 text-xs font-semibold text-stone-300">
            <div
              className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: currentTraveler.avatarColor }}
            >
              {currentTraveler.name.substring(0, 1)}
            </div>
            <span>Entrada de: <strong className="text-white font-bold">{currentTraveler.name}</strong></span>
          </div>
        )}

        {/* Success Toast */}
        {captureToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-white shrink-0" />
            <span>{captureToast}</span>
          </div>
        )}

        {/* Modal Body: QR code viewfinder and zoom controls */}
        <div className="p-3 sm:p-4 overflow-y-auto flex flex-col items-center text-center space-y-3">
          {/* Zoom and Controls Toolbar */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1 rounded-xl border border-stone-800 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              className="p-1 text-stone-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Reducir"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-amber-400 text-[11px] min-w-[42px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 6}
              className="p-1 text-stone-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Aumentar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1 text-stone-400 hover:text-white transition cursor-pointer"
              title="Girar 90 grados"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[10px] text-stone-400 hover:text-amber-400 font-bold transition ml-0.5 cursor-pointer"
            >
              100%
            </button>
          </div>

          {/* Clean Focused Viewfinder Box */}
          <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-2xl border-2 border-stone-200 flex flex-col items-center justify-center w-full overflow-hidden relative">
            {/* Viewfinder Target Container */}
            <div
              ref={viewfinderRef}
              className={`w-full flex items-center justify-center overflow-hidden touch-none relative min-h-[260px] max-h-[350px] rounded-xl select-none ${
                zoom > 1 || isFramingMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentImageSource ? (
                <div
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    transformOrigin: 'center center',
                  }}
                  className="flex items-center justify-center w-full h-full p-2"
                >
                  <img
                    ref={imageRef}
                    src={currentImageSource}
                    alt={`Código QR de ${currentPersonDisplayName}`}
                    draggable={false}
                    className="max-h-[320px] w-auto max-w-full object-contain select-none"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 text-xs">
                  <QrCode className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <span>No se encontró imagen de ticket cargada para esta persona</span>
                </div>
              )}

              {/* Viewfinder Corner Framing Target Marks (Shown in Framing/Edit mode) */}
              {isFramingMode && (
                <div className="absolute inset-2 border-2 border-dashed border-amber-500/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-3 border-l-3 border-amber-500 rounded-tl-md"></div>
                    <div className="w-4 h-4 border-t-3 border-r-3 border-amber-500 rounded-tr-md"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-3 border-l-3 border-amber-500 rounded-bl-md"></div>
                    <div className="w-4 h-4 border-b-3 border-r-3 border-amber-500 rounded-br-md"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Helper Label */}
          <div className="text-[11px] text-stone-400">
            {currentCropUrl && !isFramingMode ? (
              <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Mostrando el QR guardado de <strong>{currentPersonDisplayName}</strong>. Pulsa "Editar Captura" si deseas cambiarlo.
              </span>
            ) : isFramingMode ? (
              <span className="text-amber-300 font-medium">
                💡 Recortando QR de <strong>{currentPersonDisplayName}</strong>: Amplía con zoom y centra el cuadro del QR. Luego pulsa "Guardar Captura".
              </span>
            ) : (
              <span>💡 Mostrando ticket real de {currentPersonDisplayName}. Haz zoom y pulsa "Guardar Captura del QR".</span>
            )}
          </div>
        </div>

        {/* Modal Footer with Screenshot & Crop Actions */}
        <div className="px-4 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadActiveQR}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Descargar QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* If crop exists and NOT in framing mode: Show prominent EDIT button */}
            {currentCropUrl && !isFramingMode && currentTicketImage && (
              <button
                id="btn-edit-qr-crop"
                type="button"
                onClick={handleStartEditing}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Volver a encuadrar y tomar otra captura si quedó mal"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar / Volver a Capturar</span>
              </button>
            )}

            {/* If in framing mode or no crop yet: Show SAVE CAPTURE button */}
            {(isFramingMode || !currentCropUrl) && (
              <button
                id="btn-capture-qr-screenshot"
                type="button"
                disabled={isCapturing}
                onClick={handleCaptureFramedQR}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 active:scale-95 text-stone-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                title="Tomar captura de este encuadre y guardarla para esta persona"
              >
                {isCapturing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-stone-950 stroke-[2.5]" />
                    <span>📸 Guardar Captura ({currentPersonDisplayName})</span>
                  </>
                )}
              </button>
            )}

            {/* Next Uncropped Ticket Button */}
            {nextUncroppedIndex >= 0 && !isFramingMode && (
              <button
                type="button"
                onClick={() => handleSelectTicket(nextUncroppedIndex)}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente Entrada</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

