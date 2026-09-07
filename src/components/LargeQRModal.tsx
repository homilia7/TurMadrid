import React, { useEffect, useState } from 'react';
import { QrCode, X, Download, Maximize2, Minimize2, Sparkles, Calendar, MapPin, Clock, User, ShieldCheck } from 'lucide-react';
import { generateLargeQR } from '../utils/qrReader';
import { formatDateWithDay } from '../utils/dateUtils';
import { downloadFile } from '../utils/ticketGenerator';

interface LargeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  qrPayload: string;
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
  travelerName,
  date,
  time,
  location,
  referenceNumber,
  seatOrSection,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const payloadToEncode = qrPayload || referenceNumber || `PASS-${title}-${date || ''}`;

    generateLargeQR(payloadToEncode, 450).then((url) => {
      if (isMounted) {
        setQrDataUrl(url);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrPayload, referenceNumber, title, date]);

  if (!isOpen) return null;

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const filename = `QR_${title.substring(0, 20).replace(/\s+/g, '_')}.png`;
    downloadFile(qrDataUrl, filename);
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
                  Entrada QR Oficial
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
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition"
              title={isFullScreen ? 'Reducir' : 'Ampliar'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              id="close-qr-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition"
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

          {/* Large High-Contrast QR Code Card */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-4 border-amber-400/80 flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm">
            {isLoading ? (
              <div className="w-64 h-64 flex items-center justify-center text-stone-400">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <img
                src={qrDataUrl}
                alt={`Código QR para ${title}`}
                className="w-full h-auto aspect-square object-contain rounded-xl select-none"
              />
            )}

            <div className="mt-3 pt-2.5 border-t border-stone-200 w-full flex items-center justify-between text-stone-700 font-mono text-xs">
              <span className="font-semibold text-stone-500 text-[11px]">REF:</span>
              <span className="font-bold text-stone-900 tracking-wider">
                {referenceNumber || 'ESP-TUR-2026'}
              </span>
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
            onClick={handleDownloadQR}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Descargar Imagen QR
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
