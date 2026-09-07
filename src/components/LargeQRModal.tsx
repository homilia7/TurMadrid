import React, { useEffect, useState } from 'react';
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
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { generateLargeQR } from '../utils/qrReader';
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
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [activeView, setActiveView] = useState<'digital' | 'original'>('digital');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine if we have a real decoded QR payload
  const hasRealPayload = Boolean(qrPayload && qrPayload.trim().length > 0);
  const displayImage = qrCropUrl || ticketImage;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    if (hasRealPayload && qrPayload) {
      generateLargeQR(qrPayload, 480).then((url) => {
        if (isMounted) {
          setGeneratedQR(url);
          setActiveView('digital');
          setIsLoading(false);
        }
      });
    } else {
      // If no decoded payload, switch to showing the original uploaded ticket image
      setGeneratedQR('');
      setActiveView('original');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrPayload, hasRealPayload]);

  if (!isOpen) return null;

  const handleDownloadActiveQR = () => {
    const srcToDownload = activeView === 'digital' && generatedQR ? generatedQR : (displayImage || generatedQR);
    if (!srcToDownload) return;
    const filename = `QR_${title.substring(0, 20).replace(/\s+/g, '_')}.png`;
    downloadFile(srcToDownload, filename);
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
                  {hasRealPayload ? 'QR Real Decodificado' : 'Código Original de Entrada'}
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
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col items-center text-center space-y-4">
          {/* Scanner instruction banner */}
          <div className="w-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Listo para Escanear en Molinete / Acceso</span>
          </div>

          {/* Toggle between High-Contrast Digital QR and Original Uploaded QR Image if available */}
          {hasRealPayload && displayImage && (
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('digital')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeView === 'digital'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Alta Definición</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('original')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeView === 'original'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>QR Original del Boleto</span>
              </button>
            </div>
          )}

          {/* Large High-Contrast QR Code Card */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-4 border-amber-400/80 flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm overflow-hidden">
            {isLoading ? (
              <div className="w-64 h-64 flex items-center justify-center text-stone-400">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : activeView === 'digital' && generatedQR ? (
              <img
                src={generatedQR}
                alt={`Código QR exacto para ${title}`}
                className="w-full h-auto aspect-square object-contain rounded-xl select-none"
              />
            ) : displayImage ? (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={displayImage}
                  alt={`Código QR original para ${title}`}
                  className="max-h-72 w-auto object-contain rounded-xl shadow-xs select-none"
                />
                <span className="text-[10px] text-stone-500 font-semibold mt-2">
                  Fotografía original del boleto subido
                </span>
              </div>
            ) : (
              <div className="p-8 text-center text-stone-500 text-xs">
                <QrCode className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                <span>No se encontró código QR en la entrada</span>
              </div>
            )}

            {/* Real decoded string / reference banner */}
            <div className="mt-3 pt-2.5 border-t border-stone-200 w-full flex flex-col items-center justify-center text-stone-700 text-xs">
              <span className="font-semibold text-stone-500 text-[10px] uppercase tracking-wider">
                {hasRealPayload ? 'Contenido Real del Código QR:' : 'Referencia de la Entrada:'}
              </span>
              <div className="mt-1.5 px-3 py-1.5 bg-stone-100 rounded-xl border border-stone-200/90 w-full overflow-hidden text-center">
                <p 
                  className="font-mono font-bold text-stone-900 text-[11px] break-all line-clamp-2 select-all leading-snug" 
                  title={qrPayload || referenceNumber}
                >
                  {qrPayload || referenceNumber || 'Boleto Oficial Confirmado'}
                </p>
              </div>
            </div>
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
