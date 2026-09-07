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
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { downloadFile } from '../utils/ticketGenerator';
import { generateLargeQR, decodeQRFromImage } from '../utils/qrReader';
import { captureFramedArea } from '../utils/imageUtils';

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
  onSaveCrop?: (croppedDataUrl: string, detectedQR?: string) => Promise<void> | void;
}

export const LargeQRModal: React.FC<LargeQRModalProps> = ({
  isOpen,
  onClose,
  title,
  qrPayload,
  ticketImage,
  qrCropUrl,
  referenceNumber,
  onSaveCrop,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [renderedQrUrl, setRenderedQrUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureToast, setCaptureToast] = useState<string>('');
  const [isFramingMode, setIsFramingMode] = useState<boolean>(false);

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
      setIsFramingMode(false);
      setCaptureToast('');
      computeQR();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrCropUrl, qrPayload, referenceNumber, ticketImage]);

  if (!isOpen) return null;

  // Active image to display in viewfinder
  const currentImageSource = isFramingMode && ticketImage
    ? ticketImage
    : renderedQrUrl || qrCropUrl || ticketImage || '';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.6));
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
    const filename = `QR_${title.substring(0, 20).replace(/\s+/g, '_')}.png`;
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

        if (onSaveCrop) {
          await onSaveCrop(croppedDataUrl, detectedQRText);
        }

        setRenderedQrUrl(croppedDataUrl);
        setIsFramingMode(false);
        handleResetZoom();
        setCaptureToast('¡Captura guardada con éxito! Ahora esta imagen del QR aparecerá siempre al ingresar.');
        setTimeout(() => setCaptureToast(''), 4500);
      }
    } catch (err) {
      console.error('Error capturing framed QR:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      id="large-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md transition-all animate-in fade-in"
      onClick={onClose}
      onMouseUp={handleMouseUp}
    >
      <div
        id="large-qr-modal-card"
        className={`bg-stone-900 border border-stone-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all max-h-[96vh] w-full ${
          isFullScreen ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
      >
        {/* Top Header - Minimalist */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
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
            {ticketImage && (
              <button
                type="button"
                onClick={() => {
                  setIsFramingMode(!isFramingMode);
                  if (!isFramingMode) {
                    setZoom(1.8);
                  } else {
                    handleResetZoom();
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl border flex items-center gap-1 transition cursor-pointer ${
                  isFramingMode
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700'
                }`}
                title="Ajustar encuadre y capturar cuadro del QR"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{isFramingMode ? 'Encuadrando...' : 'Reencuadrar QR'}</span>
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

        {/* Success Toast */}
        {captureToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-white shrink-0" />
            <span>{captureToast}</span>
          </div>
        )}

        {/* Modal Body: Only QR code and zoom controls */}
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
          <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-stone-200 flex flex-col items-center justify-center w-full overflow-hidden relative">
            {/* Viewfinder Target Container */}
            <div
              ref={viewfinderRef}
              className={`w-full flex items-center justify-center overflow-hidden touch-none relative min-h-[260px] max-h-[360px] rounded-xl select-none ${
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
                    alt={`Código QR de la entrada ${title}`}
                    draggable={false}
                    className="max-h-[330px] w-auto max-w-full object-contain select-none"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 text-xs">
                  <QrCode className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <span>No se encontró imagen ni código QR</span>
                </div>
              )}

              {/* Viewfinder Corner Framing Target Marks */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-500/50 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-3 border-l-3 border-amber-500 rounded-tl-md"></div>
                  <div className="w-4 h-4 border-t-3 border-r-3 border-amber-500 rounded-tr-md"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-3 border-l-3 border-amber-500 rounded-bl-md"></div>
                  <div className="w-4 h-4 border-b-3 border-r-3 border-amber-500 rounded-br-md"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Helper Label */}
          <div className="text-[11px] text-stone-400">
            {isFramingMode || zoom > 1.1 ? (
              <span className="text-amber-300 font-medium">
                💡 Amplía y centra el cuadro del QR. Luego pulsa el botón dorado abajo para guardar la captura.
              </span>
            ) : (
              <span>💡 Amplía con dos dedos o botones y muévelo para encuadrar solo el código QR.</span>
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
            {/* Direct Screenshot Capture & Save Button */}
            <button
              id="btn-capture-qr-screenshot"
              type="button"
              disabled={isCapturing}
              onClick={handleCaptureFramedQR}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 active:scale-95 text-stone-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Tomar captura de este encuadre y guardarla para que aparezca siempre aquí"
            >
              {isCapturing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando Captura...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-stone-950 stroke-[2.5]" />
                  <span>📸 Guardar Captura del QR</span>
                </>
              )}
            </button>

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

