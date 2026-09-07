import React, { useEffect, useState, useRef } from 'react';
import {
  QrCode,
  X,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { downloadFile } from '../utils/ticketGenerator';
import { generateLargeQR } from '../utils/qrReader';

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
  referenceNumber,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [renderedQrUrl, setRenderedQrUrl] = useState<string>('');

  // Multi-touch pinch zoom & drag refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Generate crisp QR code fallback if payload exists and no crop is available
  useEffect(() => {
    let isMounted = true;
    const computeQR = async () => {
      if (qrCropUrl) {
        setRenderedQrUrl(qrCropUrl);
        return;
      }
      const rawText = qrPayload || referenceNumber;
      if (rawText) {
        try {
          const generated = await generateLargeQR(rawText, 600);
          if (isMounted) {
            setRenderedQrUrl(generated || ticketImage || '');
          }
        } catch {
          if (isMounted) {
            setRenderedQrUrl(ticketImage || '');
          }
        }
      } else {
        setRenderedQrUrl(ticketImage || '');
      }
    };

    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      computeQR();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrCropUrl, qrPayload, referenceNumber, ticketImage]);

  if (!isOpen) return null;

  const activeImage = renderedQrUrl || qrCropUrl || ticketImage || '';

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
    const filename = `QR_${title.substring(0, 20).replace(/\s+/g, '_')}.png`;
    downloadFile(activeImage, filename);
  };

  return (
    <div
      id="large-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="large-qr-modal-card"
        className={`bg-stone-900 border border-stone-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all max-h-[96vh] w-full ${
          isFullScreen ? 'max-w-2xl' : 'max-w-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Minimalist */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
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

          <div className="flex items-center gap-1 shrink-0">
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

        {/* Modal Body: Only QR code and zoom controls */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center text-center space-y-3">
          {/* Zoom and Controls Toolbar */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1 rounded-xl border border-stone-800 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.7}
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
              disabled={zoom >= 4.5}
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

          {/* Clean Focused QR Box */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-stone-200 flex flex-col items-center justify-center w-full overflow-hidden">
            <div
              className="w-full flex items-center justify-center overflow-hidden touch-none relative min-h-[220px] max-h-[360px]"
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
                  className="flex items-center justify-center w-full h-full p-2"
                >
                  <img
                    src={activeImage}
                    alt={`Código QR de la entrada ${title}`}
                    draggable={false}
                    className="max-h-[320px] w-auto max-w-full object-contain rounded-lg select-none"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 text-xs">
                  <QrCode className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <span>No se encontró código QR</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadActiveQR}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Descargar QR
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
