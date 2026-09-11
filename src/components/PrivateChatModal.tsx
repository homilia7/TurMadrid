import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  MapPin, 
  Navigation, 
  Check, 
  Sparkles, 
  Clock, 
  Hotel, 
  Plane, 
  Home, 
  Volume2,
  Trash2,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Loader2,
  Download
} from 'lucide-react';
import { FamilyMessage, LiveLocationShare, Traveler } from '../types';
import { getDualTimezoneStrings } from '../utils/timeUtils';
import { getPersonDetails } from '../utils/nameUtils';
import { optimizeImageForUpload } from '../utils/imageUtils';

interface PrivateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    type: 'traveler' | 'family';
    color: string;
  };
  targetUserName: string; // The person we are chatting with
  messages: FamilyMessage[];
  onSendMessage: (msg: FamilyMessage) => void;
  travelerLocation?: LiveLocationShare | null;
  onUpdateLocation?: (loc: LiveLocationShare) => void;
  onMarkAsSeen?: (msgIds: string[]) => void;
  onClearChat?: (targetUserName: string) => void;
  travelers?: Traveler[];
  seenMessageIds?: Set<string>;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUserName,
  messages,
  onSendMessage,
  travelerLocation,
  onUpdateLocation,
  onMarkAsSeen,
  onClearChat,
  travelers = [],
  seenMessageIds,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSharingLocation, setIsSharingLocation] = useState(Boolean(travelerLocation?.isActive));
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Estados para envío y visualización de fotos en el chat
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filter messages for this pair
  const chatMessages = messages.filter((m) => 
    (m.travelerName === targetUserName && m.familyMemberName === currentUser.name) ||
    (m.travelerName === currentUser.name && m.familyMemberName === targetUserName) ||
    (m.senderName === currentUser.name && (m.travelerName === targetUserName || m.familyMemberName === targetUserName))
  );

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const myName = currentUser.name.trim().toLowerCase();
      const unreadIncomingIds = chatMessages
        .filter((m) => {
          const isFromOther = m.senderName.trim().toLowerCase() !== myName;
          const isUnread = currentUser.type === 'traveler' ? !m.isReadByTraveler : !m.isReadByFamily;
          return isFromOther && isUnread;
        })
        .map((m) => m.id);

      if (unreadIncomingIds.length > 0) {
        onMarkAsSeen?.(unreadIncomingIds);
      }
    }
  }, [isOpen, chatMessages, onMarkAsSeen, currentUser.name, currentUser.type]);

  if (!isOpen) return null;

  // Selección y compresión optimizada de fotos
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawResult = reader.result as string;
        const optimized = await optimizeImageForUpload(rawResult, 1400, 0.82);
        setSelectedPhoto({
          url: optimized.dataUrl,
          name: file.name,
        });
      } catch (err) {
        console.warn('Error optimizando foto:', err);
        setSelectedPhoto({
          url: reader.result as string,
          name: file.name,
        });
      } finally {
        setIsProcessingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendTextMessage = (textToSend?: string, quickType?: FamilyMessage['quickStatusType']) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text && !selectedPhoto) return;

    const dual = getDualTimezoneStrings();
    const newMsg: FamilyMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      chatRoomId: `${currentUser.type === 'traveler' ? currentUser.name : targetUserName}_${currentUser.type === 'family' ? currentUser.name : targetUserName}`,
      travelerName: currentUser.type === 'traveler' ? currentUser.name : targetUserName,
      familyMemberName: currentUser.type === 'family' ? currentUser.name : targetUserName,
      senderName: currentUser.name,
      senderType: currentUser.type,
      text: text || undefined,
      photoUrl: selectedPhoto?.url,
      photoName: selectedPhoto?.name,
      isQuickStatus: Boolean(quickType),
      quickStatusType: quickType,
      createdAt: new Date().toISOString(),
      timezoneSpain: dual.spain,
      timezoneCostaRica: dual.costaRica,
      isReadByTraveler: currentUser.type === 'traveler',
      isReadByFamily: currentUser.type === 'family',
    };

    onSendMessage(newMsg);
    setSelectedPhoto(null);
    if (!textToSend) setInputText('');
  };

  // Start Voice Recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const dual = getDualTimezoneStrings();
          const newMsg: FamilyMessage = {
            id: `msg-audio-${Date.now()}`,
            chatRoomId: `${currentUser.type === 'traveler' ? currentUser.name : targetUserName}_${currentUser.type === 'family' ? currentUser.name : targetUserName}`,
            travelerName: currentUser.type === 'traveler' ? currentUser.name : targetUserName,
            familyMemberName: currentUser.type === 'family' ? currentUser.name : targetUserName,
            senderName: currentUser.name,
            senderType: currentUser.type,
            audioUrl: base64Audio,
            audioDuration: recordingDuration,
            createdAt: new Date().toISOString(),
            timezoneSpain: dual.spain,
            timezoneCostaRica: dual.costaRica,
            isReadByTraveler: currentUser.type === 'traveler',
            isReadByFamily: currentUser.type === 'family',
          };
          onSendMessage(newMsg);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or error:', err);
      alert('No se pudo acceder al micrófono. Por favor permite el acceso al audio.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Toggle GPS Location
  const handleToggleLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en tu navegador.');
      return;
    }

    if (!isSharingLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LiveLocationShare = {
            travelerId: currentUser.name,
            travelerName: currentUser.name,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            placeName: 'Madrid Centro',
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
          setIsSharingLocation(true);
          onUpdateLocation?.(loc);
          handleSendTextMessage(`📍 He compartido mi ubicación en tiempo real (Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)})`, 'location');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          alert('Por favor activa los permisos de ubicación en tu navegador para compartir tu posición.');
        }
      );
    } else {
      setIsSharingLocation(false);
      onUpdateLocation?.({
        travelerId: currentUser.name,
        travelerName: currentUser.name,
        lat: 0,
        lng: 0,
        updatedAt: new Date().toISOString(),
        isActive: false,
      });
    }
  };

  const playAudio = (audioUrl: string, id: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioId(id);
    audio.play();
    audio.onended = () => setPlayingAudioId(null);
  };

  const targetDetails = getPersonDetails(targetUserName, travelers, '#f59e0b');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[90vh] max-h-[700px] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center shadow-xs border-2 border-white shrink-0"
              style={{ backgroundColor: targetDetails.color }}
            >
              {targetDetails.initial}
            </div>
            <div>
              <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
                <span>Chat con {targetDetails.formattedName}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="En línea" />
              </h3>
              <p className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                    targetDetails.isTraveler
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-sky-100 text-sky-950 border-sky-300'
                  }`}
                >
                  {targetDetails.isTraveler ? '✈️ Viajero en España' : '🏠 Familiar Conectado'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.type === 'traveler' && (
              <button
                type="button"
                onClick={handleToggleLocation}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isSharingLocation
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
                title={isSharingLocation ? 'Ubicación GPS activa' : 'Compartir ubicación GPS'}
              >
                <Navigation className={`w-3.5 h-3.5 ${isSharingLocation ? 'text-emerald-600 fill-emerald-600 animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isSharingLocation ? 'GPS Activo' : 'GPS'}</span>
              </button>
            )}

            {chatMessages.length > 0 && onClearChat && (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 hover:border-red-300 bg-white hover:bg-red-50 text-stone-600 hover:text-red-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Limpiar mensajes de este chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-600" />
                <span className="hidden sm:inline">Limpiar Chat</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation Banner for Clearing Chat */}
        {showConfirmClear && (
          <div className="bg-red-50 border-b border-red-200 p-3 px-4 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>¿Borrar todos los mensajes con {targetDetails.formattedName}?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 text-xs font-semibold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearChat?.(targetUserName);
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer active:scale-95"
              >
                Sí, Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Quick Status Buttons (For Travelers) */}
        {currentUser.type === 'traveler' && (
          <div className="p-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-amber-900 shrink-0 mr-1">Rápidos:</span>
            
            <button
              type="button"
              onClick={() => handleSendTextMessage('🛬 Ya aterrizamos, estamos en el aeropuerto', 'airport')}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100/70 text-amber-950 text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plane className="w-3 h-3 text-amber-600" />
              <span>En Aeropuerto</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendTextMessage('🏨 Ya estamos en el Hotel descansando', 'hotel')}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100/70 text-amber-950 text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Hotel className="w-3 h-3 text-amber-600" />
              <span>En Hotel</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendTextMessage('🏠 Ya llegamos al Alojamiento', 'home')}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100/70 text-amber-950 text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Home className="w-3 h-3 text-amber-600" />
              <span>En la Casa</span>
            </button>
          </div>
        )}

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Sparkles className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
              <p className="text-xs font-bold text-stone-700">Comienza a conversar con {targetDetails.formattedName}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Puedes enviar mensajes de texto o notas de voz 🎙️</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMine = msg.senderName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
              const rawName = msg.senderName || (msg.senderType === 'traveler' ? msg.travelerName : msg.familyMemberName) || (isMine ? currentUser.name : targetUserName) || 'Usuario';
              const senderDetails = getPersonDetails(rawName, travelers, isMine ? currentUser.color : undefined);

              // Checkmarks de estado según especificación:
              // 1. Una palomita (✓): el usuario envió / el sistema recibió el mensaje
              // 2. Dos palomitas (✓✓) en COLOR VERDE: confirma cuando el viajero/destinatario vio el mensaje
              const isRead = isMine && (
                currentUser.type === 'traveler'
                  ? Boolean(msg.isReadByFamily)
                  : Boolean(msg.isReadByTraveler)
              );

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-full space-y-1 my-2`}
                >
                  {/* Encabezado del Remitente: Ultra Claro y Visible con su color oficial */}
                  <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs border border-white"
                      style={{ backgroundColor: isMine ? (currentUser.color || senderDetails.color) : senderDetails.color }}
                    >
                      {senderDetails.initial}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-stone-950 tracking-tight">
                      {isMine ? `${senderDetails.formattedName} (Tú)` : senderDetails.formattedName}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs uppercase tracking-wide ${
                        senderDetails.isTraveler
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : 'bg-sky-100 text-sky-950 border-sky-300'
                      }`}
                    >
                      {senderDetails.isTraveler ? '✈️ Viajero' : '🏠 Familia'}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl max-w-[90%] sm:max-w-[82%] text-xs sm:text-sm shadow-sm ${
                      isMine
                        ? 'bg-amber-400 text-stone-950 rounded-tr-xs font-medium border border-amber-500/40'
                        : 'bg-white border-2 border-stone-200 text-stone-900 rounded-tl-xs font-normal'
                    }`}
                  >
                    {/* Photo in Message Bubble */}
                    {msg.photoUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl border border-black/10 relative group cursor-pointer shadow-2xs">
                        <img
                          src={msg.photoUrl}
                          alt={msg.photoName || 'Foto adjunta'}
                          className="w-full max-h-72 object-cover rounded-xl transition group-hover:brightness-95"
                          loading="lazy"
                          onClick={() => setLightboxImage({ url: msg.photoUrl!, title: msg.photoName || `Foto de ${senderDetails.formattedName}` })}
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: msg.photoUrl!, title: msg.photoName || `Foto de ${senderDetails.formattedName}` })}
                          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded-lg backdrop-blur-xs transition flex items-center gap-1 text-[11px] font-bold shadow-xs cursor-pointer"
                          title="Ampliar foto"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ampliar</span>
                        </button>
                      </div>
                    )}

                    {/* Audio Player Message */}
                    {msg.audioUrl ? (
                      <div className="flex items-center gap-2.5 py-1 min-w-[160px]">
                        <button
                          type="button"
                          onClick={() => playAudio(msg.audioUrl!, msg.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-2xs ${
                            isMine ? 'bg-stone-950 text-amber-400' : 'bg-amber-500 text-stone-950'
                          }`}
                        >
                          {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-1 font-bold text-xs">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nota de Voz</span>
                          </div>
                          <span className="text-[10px] opacity-80">{msg.audioDuration ? `${msg.audioDuration}s` : 'Audio'}</span>
                        </div>
                      </div>
                    ) : msg.text ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : null}

                    {/* Dual Timestamps & WhatsApp Status Ticks */}
                    <div className="mt-1.5 pt-1 border-t border-black/10 flex items-center justify-between gap-2 text-[9px]">
                      <div className="flex items-center gap-1.5 text-stone-800 opacity-75">
                        <span>{msg.timezoneSpain.split(' ')[0]} (ES)</span>
                        <span>•</span>
                        <span>{msg.timezoneCostaRica.split(' ')[0]} (CR)</span>
                      </div>

                      {/* Status Checkmarks: 1 palomita (enviado/recibido), 2da palomita en VERDE cuando lo ve el viajero */}
                      {isMine && (
                        <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                          {isRead ? (
                            <span
                              className="inline-flex items-center -space-x-1.5 text-emerald-800 font-black drop-shadow-xs"
                              title="Visto por el viajero (Doble palomita verde ✓✓)"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-stone-600/75 font-bold"
                              title="Mensaje recibido (Una palomita ✓)"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-200 bg-white">
          {/* Photo processing indicator */}
          {isProcessingPhoto && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
              <span>Optimizando foto para envío rápido...</span>
            </div>
          )}

          {/* Selected photo preview strip */}
          {selectedPhoto && (
            <div className="mb-2 p-2 bg-stone-100 border border-stone-300 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt="Vista previa"
                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1 text-xs font-bold text-stone-900 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{selectedPhoto.name || 'Foto adjunta'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">Lista para enviar con tu mensaje</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition shrink-0 border border-stone-200 cursor-pointer"
                title="Quitar foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isRecording ? (
            <div className="flex items-center justify-between p-2 bg-rose-50 border border-rose-200 rounded-2xl animate-pulse">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                <span>Grabando nota de voz... {recordingDuration}s</span>
              </div>
              <button
                type="button"
                onClick={stopAudioRecording}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Enviar Audio</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Hidden file input for photos */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
                placeholder={selectedPhoto ? "Agrega un comentario a la foto (opcional)..." : `Escribe a ${targetUserName}...`}
                className="flex-1 text-xs sm:text-sm text-stone-900 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
              />

              {/* Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                  selectedPhoto
                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/50'
                    : 'border-stone-200 hover:bg-stone-100 text-stone-700 hover:text-amber-600'
                }`}
                title="Adjuntar o tomar foto"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={startAudioRecording}
                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 hover:text-amber-600 transition cursor-pointer shrink-0"
                title="Grabar nota de voz"
              >
                <Mic className="w-4 h-4 text-amber-600" />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendTextMessage()}
                disabled={(!inputText.trim() && !selectedPhoto) || isProcessingPhoto}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-bold transition shadow-xs cursor-pointer shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Fullscreen Photo Viewing */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/92 flex flex-col items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between text-white mb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-bold text-stone-200 truncate">{lightboxImage.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={lightboxImage.url}
                download={lightboxImage.title ? `${lightboxImage.title}.jpg` : 'foto-chat.jpg'}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                title="Descargar foto"
                target="_blank"
                rel="noreferrer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div
            className="relative max-w-4xl max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
