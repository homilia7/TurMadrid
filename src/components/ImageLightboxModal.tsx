import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  X,
  Download,
  FileText,
  ExternalLink,
  Camera,
  Crop,
  Check,
  Sparkles
} from 'lucide-react';
import { downloadFile } from '../utils/ticketGenerator';
import { captureFramedArea } from '../utils/imageUtils';
import { decodeQRFromImage } from '../utils/qrReader';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  fileType?: 'image' | 'pdf' | 'digital';
  fileName?: string;
  onSaveCrop?: (croppedDataUrl: string, detectedQR?: string) => Promise<void> | void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  fileType = 'image',
  fileName,
  onSaveCrop,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFramingQR, setIsFramingQR] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Multi-touch pinch zoom & drag refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsFramingQR(false);
      setToastMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.6));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotateCw = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCcw = () => setRotation((prev) => (prev - 90 + 360) % 360);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mobile Pinch-to-Zoom & Touch Pan Handlers
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers detected: initialize pinch-to-zoom
      const dist = getTouchDistance(e.touches);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // 1 finger detected: check for double tap or pan
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap detected: toggle zoom
        if (zoom > 1.2) {
          handleResetZoom();
        } else {
          setZoom(2.5);
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
      // Pinching with two fingers
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / touchStartDistRef.current;
      const newZoom = Math.max(0.6, Math.min(5, touchStartZoomRef.current * scale));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Dragging with one finger
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

  const handleDownload = () => {
    downloadFile(imageUrl, fileName || `${title.replace(/\s+/g, '_')}.png`);
  };

  const handleCaptureQR = async () => {
    if (!imageRef.current || !frameRef.current) return;

    setIsCapturing(true);
    try {
      const croppedDataUrl = await captureFramedArea(imageRef.current, frameRef.current, 750);
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

        setIsFramingQR(false);
        setToastMsg('¡Captura guardada! Ahora esta imagen del QR aparecerá siempre al ingresar.');
        setTimeout(() => setToastMsg(''), 4500);
      }
    } catch (err) {
      console.error('Error capturing framed QR in lightbox:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const isPdf = fileType === 'pdf';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Floating Controls Bar */}
      <div className="p-3 sm:p-4 bg-black/60 border-b border-stone-800 flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0">
            🔍
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">{title}</h3>
            <span className="text-[11px] text-amber-400 font-medium">
              Vista Ampliada • {Math.round(zoom * 100)}% zoom
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isPdf && onSaveCrop && (
            <button
              type="button"
              onClick={() => {
                setIsFramingQR(!isFramingQR);
                if (!isFramingQR) {
                  setZoom(1.8);
                } else {
                  handleResetZoom();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isFramingQR
                  ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-stone-900 border border-stone-700 hover:bg-stone-800 text-amber-300'
              }`}
              title="Ajustar encuadre para recortar el código QR"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isFramingQR ? 'Modo Encuadre Activo' : 'Encuadrar QR'}</span>
            </button>
          )}

          {!isPdf && (
            <div className="flex items-center bg-stone-900 border border-stone-700 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition disabled:opacity-40 cursor-pointer"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-xs font-mono font-bold text-amber-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                title="Restablecer tamaño original (100%)"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition disabled:opacity-40 cursor-pointer"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isPdf && (
            <div className="hidden sm:flex items-center bg-stone-900 border border-stone-700 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleRotateCcw}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
                title="Rotar a la izquierda"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotateCw}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
                title="Rotar a la derecha"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-stone-300 hover:text-white bg-stone-900 border border-stone-700 hover:bg-stone-800 rounded-xl transition cursor-pointer"
            title="Descargar archivo"
          >
            <Download className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-black text-white bg-red-600 hover:bg-red-700 active:bg-red-800 border border-red-500 rounded-xl transition-all shadow-md shadow-red-600/30 ml-1 cursor-pointer flex items-center gap-1.5"
            title="Cerrar"
          >
            <X className="w-4 h-4 text-white stroke-[3]" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in z-20">
          <Check className="w-4 h-4 text-white shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Canvas with Drag / Zoom / Touch Pinch */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-2 sm:p-6 touch-none ${
          zoom > 1 || isFramingQR ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={() => (zoom === 1 ? setZoom(2.5) : handleResetZoom())}
      >
        {isPdf ? (
          <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl">
            <FileText className="w-16 h-16 text-red-500 mb-3" />
            <h4 className="text-base font-bold text-stone-900">{fileName || title}</h4>
            <p className="text-xs text-stone-500 mt-1 mb-4">Documento PDF cargado en el sistema</p>
            <div className="flex gap-2">
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                Abrir PDF en pestaña nueva
              </a>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.18s ease-out',
                transformOrigin: 'center center',
              }}
              className="flex items-center justify-center"
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={title}
                draggable={false}
                className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl pointer-events-none select-none border border-stone-800"
              />
            </div>

            {/* Central Viewfinder Box Overlay when framing */}
            {isFramingQR && (
              <div
                ref={frameRef}
                className="absolute pointer-events-none w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] border-2 border-dashed border-amber-400 bg-amber-500/10 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col justify-between p-3"
              >
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                  <div className="w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider bg-black/80 text-amber-300 px-3 py-1 rounded-full border border-amber-400/50 shadow-md">
                    Encuadre del Código QR
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                  <div className="w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom helper footer */}
      {!isPdf && (
        <div className="p-2 sm:p-3 bg-black/75 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-300 px-4 flex-wrap gap-2">
          <span>
            {isFramingQR ? (
              <strong className="text-amber-300">
                Mueve y amplía la imagen para que el código QR quede dentro del recuadro dorado.
              </strong>
            ) : (
              '💡 Tip: Amplía con dos dedos (pellizco) o doble toque. Desliza con el dedo para mover.'
            )}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {isFramingQR && onSaveCrop && (
              <button
                type="button"
                disabled={isCapturing}
                onClick={handleCaptureQR}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {isCapturing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-stone-950 stroke-[2.5]" />
                    <span>📸 Guardar Captura del QR</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleResetZoom}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Restablecer
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

