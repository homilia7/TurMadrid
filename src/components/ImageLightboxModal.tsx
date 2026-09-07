import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  X,
  Download,
  FileText,
  ExternalLink
} from 'lucide-react';
import { downloadFile } from '../utils/ticketGenerator';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  fileType?: 'image' | 'pdf' | 'digital';
  fileName?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  fileType = 'image',
  fileName,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotateCw = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCcw = () => setRotation((prev) => (prev - 90 + 360) % 360);

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

  const handleDownload = () => {
    downloadFile(imageUrl, fileName || `${title.replace(/\s+/g, '_')}.png`);
  };

  const isPdf = fileType === 'pdf';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Floating Controls Bar */}
      <div className="p-3 sm:p-4 bg-black/60 border-b border-stone-800 flex items-center justify-between z-10">
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
                disabled={zoom >= 4}
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
            className="p-2 text-stone-300 hover:text-white bg-red-950/60 border border-red-800/80 hover:bg-red-900 rounded-xl transition ml-1 cursor-pointer"
            title="Cerrar visor"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Main Canvas with Drag / Zoom */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-2 sm:p-6 ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={() => (zoom === 1 ? setZoom(2) : handleResetZoom())}
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
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.18s ease-out',
              transformOrigin: 'center center',
            }}
            className="flex items-center justify-center max-w-full max-h-full"
          >
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="max-h-[82vh] max-w-[94vw] object-contain rounded-xl shadow-2xl pointer-events-none select-none border border-stone-800"
            />
          </div>
        )}
      </div>

      {/* Bottom helper footer */}
      {!isPdf && (
        <div className="p-2 sm:p-3 bg-black/60 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400 px-4">
          <span>💡 Tip: Usa los botones de zoom (+/-) o haz doble clic para agrandar la entrada. Arrastra con el ratón o dedo para moverla.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetZoom}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Restablecer
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
