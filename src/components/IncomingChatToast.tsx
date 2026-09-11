import React, { useEffect, useRef } from 'react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';
import { playChimeSound } from '../utils/alertManager';

interface IncomingChatToastProps {
  senderName: string;
  messagePreview: string;
  onAcceptChat: () => void;
  onDismiss: () => void;
}

export const IncomingChatToast: React.FC<IncomingChatToastProps> = ({
  senderName,
  messagePreview,
  onAcceptChat,
  onDismiss,
}) => {
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    if (!hasAlertedRef.current) {
      hasAlertedRef.current = true;
      try {
        playChimeSound();
      } catch (e) {
        console.warn('Could not play chime on incoming toast:', e);
      }
    }

    // Auto dismiss after 6 seconds so notifications do not get stuck on screen
    const autoDismissTimer = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => clearTimeout(autoDismissTimer);
  }, [senderName, messagePreview, onDismiss]);

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="traffic-glow-toast toast-bg-blink text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 relative overflow-hidden backdrop-blur-md">
        {/* Animated Traffic Light indicator dots */}
        <div className="absolute top-2 left-4 flex items-center gap-1 opacity-90">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
          <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse delay-100 shadow-sm shadow-yellow-300" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200 shadow-sm shadow-emerald-400" />
        </div>

        <div className="w-11 h-11 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-bold shrink-0 animate-bounce shadow-md mt-2">
          <MessageSquare className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-white">{senderName}</span>
            <span className="text-[10px] text-orange-100 font-semibold">quiere hablar contigo</span>
          </div>
          <p className="text-xs text-orange-50 truncate mt-0.5 font-medium">
            {messagePreview || 'Te ha enviado un mensaje en vivo'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-2">
          <button
            type="button"
            onClick={onAcceptChat}
            className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Aceptar</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-orange-200 hover:text-white rounded-xl hover:bg-white/20 transition cursor-pointer"
            title="Descartar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
