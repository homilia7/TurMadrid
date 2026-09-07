import React, { useEffect, useState, useRef } from 'react';
import {
  QrCode,
  X,
  Download,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { formatDateWithDay } from '../utils/dateUtils';
import { downloadFile } from '../utils/ticketGenerator';

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
}

export const LargeQRModal: React.FC<LargeQRModalProps> = ({
  isOpen,
  onClose,
  title,
  qrPayload,
  ticketImage,
  qrCropUrl,
  travelerName,
  date,
  time,
  location,
  referenceNumber,
  seatOrSection,
}) => {
  // Always use the real authentic ticket image / crop from "Ver Ticket"
  const hasCrop = Boolean(qrCropUrl && qrCropUrl.trim().length > 0);
  const [selectedView, setSelectedView] = useState<'crop' | 'full'>(hasCrop ? 'crop' : 'full');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Multi-touch pinch zoom & drag refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedView(hasCrop ? 'crop' : 'full');
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, hasCrop]);

  if (!isOpen) return null;

  // Active authentic image to show (always from the uploaded ticket!)
  const activeImage = selectedView === 'crop' && qrCropUrl ? qrCropUrl : (ticketImage || qrCropUrl || '');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 4.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.7));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

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
          setZoom(2.2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (zoom > 1) {
        setIsDragging(true);
        touchStartPosRef.current = { ...position };
        touchStartClientRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / touchStartDistRef.current;
      setZoom(Math.max(0.7, Math.min(4.5, touchStartZoomRef.current * scale)));
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
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
    if (!activeImage) return;
    const filename = `QR_Oficial_${title.substring(0, 20).replace(/\s+/g, '_')}.png`;
    downloadFile(activeImage, filename);
  };

  return (
    <div
      id="large-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="large-qr-modal-card"
        className={`bg-stone-900 border border-stone-700 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all max-h-[96vh] w-full ${
          isFullScreen ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  QR Oficial de la Entrada
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-sm mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
              title={isFullScreen ? 'Reducir' : 'Ampliar'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              id="close-qr-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center text-center space-y-3.5">
          {/* Scanner instruction banner */}
          <div className="w-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Listo para Escanear en Molinete / Acceso</span>
          </div>

          {/* Toggle between Focused QR and Full Ticket Image if both available */}
          {hasCrop && ticketImage && (
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedView('crop');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  selectedView === 'crop'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>🎯 QR Enfocado del Boleto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedView('full');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  selectedView === 'full'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>📄 Entrada Completa</span>
              </button>
            </div>
          )}

          {/* Zoom and Controls Toolbar */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.7}
              className="p-1 text-stone-400 hover:text-white disabled:opacity-40 transition"
              title="Reducir"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-amber-400 text-[11px] min-w-[45px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4.5}
              className="p-1 text-stone-400 hover:text-white disabled:opacity-40 transition"
              title="Aumentar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1 text-stone-400 hover:text-white transition"
              title="Girar 90 grados"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[10px] text-stone-400 hover:text-amber-400 font-bold transition ml-1"
            >
              100%
            </button>
          </div>

          {/* Large Authentic QR Code Card with Touch Pinch & Drag */}
          <div className="bg-white p-3 sm:p-5 rounded-3xl shadow-2xl border-4 border-amber-400/80 flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm overflow-hidden">
            <div
              className="w-full flex items-center justify-center overflow-hidden touch-none relative min-h-[220px] max-h-[340px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {activeImage ? (
                <div
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    transformOrigin: 'center center',
                  }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={activeImage}
                    alt={`Código QR exacto de la entrada ${title}`}
                    draggable={false}
                    className="max-h-[300px] w-auto max-w-full object-contain rounded-xl select-none shadow-xs"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 text-xs">
                  <QrCode className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <span>No se encontró imagen de la entrada</span>
                </div>
              )}
            </div>

            <span className="text-[10px] text-stone-500 font-semibold mt-2 block">
              Imagen original del boleto • Puedes ampliar con dos dedos o doble toque
            </span>

            {/* Reference Badge */}
            {(qrPayload || referenceNumber) && (
              <div className="mt-2.5 pt-2 border-t border-stone-200 w-full flex flex-col items-center justify-center text-stone-700 text-xs">
                <span className="font-semibold text-stone-500 text-[10px] uppercase tracking-wider">
                  Código / Referencia:
                </span>
                <div className="mt-1 px-3 py-1 bg-stone-100 rounded-xl border border-stone-200/90 w-full overflow-hidden text-center">
                  <p 
                    className="font-mono font-bold text-stone-900 text-[11px] break-all line-clamp-2 select-all leading-snug" 
                    title={qrPayload || referenceNumber}
                  >
                    {qrPayload || referenceNumber}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Details Box */}
          <div className="w-full bg-stone-950/80 rounded-2xl p-4 border border-stone-800 text-xs text-left space-y-2.5">
            {travelerName && (
              <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Titular / Asignado:
                </span>
                <span className="font-bold text-sky-300">{travelerName}</span>
              </div>
            )}

            {date && (
              <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Día y Fecha:
                </span>
                <span className="font-bold text-amber-300">
                  {formatDateWithDay(date)}
                </span>
              </div>
            )}

            {time && (
              <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Hora:
                </span>
                <span className="font-semibold text-white">{time}</span>
              </div>
            )}

            {location && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-stone-400 flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Lugar:
                </span>
                <span className="font-medium text-stone-200 text-right truncate">
                  {location}
                </span>
              </div>
            )}

            {seatOrSection && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                <span>Acceso:</span>
                <span className="text-stone-300 font-semibold">{seatOrSection}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadActiveQR}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Descargar Imagen QR
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
