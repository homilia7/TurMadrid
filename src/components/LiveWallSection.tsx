import React, { useState, useRef } from 'react';
import { 
  Users, 
  Send, 
  Camera, 
  Image as ImageIcon, 
  Heart, 
  MessageSquare, 
  Clock, 
  Globe, 
  Sparkles, 
  Share2, 
  X,
  MapPin,
  Trash2,
  Check
} from 'lucide-react';
import { WallPost, PresenceUser, Traveler, FamilyMessage } from '../types';
import { getDualTimezoneStrings } from '../utils/timeUtils';
import { optimizeImageForUpload } from '../utils/imageUtils';
import { formatPersonName, getPersonDetails } from '../utils/nameUtils';

interface LiveWallSectionProps {
  currentUser: {
    name: string;
    type: 'traveler' | 'family';
    color: string;
  };
  posts: WallPost[];
  presenceUsers: PresenceUser[];
  messages?: FamilyMessage[];
  travelers?: Traveler[];
  seenMessageIds?: Set<string>;
  onAddPost: (post: WallPost) => void;
  onLikePost: (postId: string) => void;
  onOpenPrivateChat?: (targetName: string) => void;
  onClearAllChats?: () => void;
  onClearConversation?: (partnerName: string) => void;
  onMarkAsSeen?: (msgIds: string[]) => void;
}

export const LiveWallSection: React.FC<LiveWallSectionProps> = ({
  currentUser,
  posts,
  presenceUsers,
  messages = [],
  travelers = [],
  seenMessageIds,
  onAddPost,
  onLikePost,
  onOpenPrivateChat,
  onClearAllChats,
  onClearConversation,
  onMarkAsSeen,
}) => {
  const [postText, setPostText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<{ url: string; name: string } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const optimized = await optimizeImageForUpload(reader.result as string);
        setUploadedPhoto({
          url: optimized.dataUrl,
          name: file.name,
        });
      } catch (err) {
        console.warn('Error compressing photo for wall:', err);
        setUploadedPhoto({
          url: reader.result as string,
          name: file.name,
        });
      } finally {
        setIsPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !uploadedPhoto) return;

    const dual = getDualTimezoneStrings();
    const newPost: WallPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      authorName: currentUser.name,
      authorType: currentUser.type,
      authorColor: currentUser.color,
      text: postText.trim(),
      photoUrl: uploadedPhoto?.url,
      photoName: uploadedPhoto?.name,
      locationName: locationName.trim() || undefined,
      createdAt: new Date().toISOString(),
      timezoneSpain: dual.spain,
      timezoneCostaRica: dual.costaRica,
      likedBy: [],
      likesCount: 0,
    };

    onAddPost(newPost);
    setPostText('');
    setLocationName('');
    setUploadedPhoto(null);
  };

  // Compute conversation list for current user
  interface ChatConversationSummary {
    partnerName: string;
    formattedName: string;
    initial: string;
    partnerRole: 'traveler' | 'family';
    avatarColor: string;
    lastMessage: string;
    lastTime: string;
    timestamp: number;
    unreadCount: number;
    isOnline: boolean;
    totalMessages: number;
    lastMessageIsMine?: boolean;
    lastMessageIsDelivered?: boolean;
    lastMessageIsRead?: boolean;
  }

  const conversationsMap = new Map<string, ChatConversationSummary>();
  const safeMessages = Array.isArray(messages) ? messages : [];

  safeMessages.forEach((msg) => {
    let partnerName = '';
    let partnerRole: 'traveler' | 'family' = 'family';

    if (msg.senderName === currentUser.name) {
      partnerName = currentUser.type === 'traveler' ? msg.familyMemberName : msg.travelerName;
      partnerRole = currentUser.type === 'traveler' ? 'family' : 'traveler';
    } else {
      if (msg.travelerName === currentUser.name || msg.familyMemberName === currentUser.name) {
        partnerName = msg.senderName;
        partnerRole = msg.senderType;
      }
    }

    if (!partnerName || partnerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return;

    const partnerDetails = getPersonDetails(partnerName, travelers);
    const key = partnerName.trim().toLowerCase();

    const safePresence = Array.isArray(presenceUsers) ? presenceUsers : [];
    const presencePartner = safePresence.find(
      (p) => p && p.name && p.name.trim().toLowerCase() === key
    );
    const isOnline = Boolean(presencePartner?.isOnline);
    const avatarColor = presencePartner?.avatarColor || partnerDetails.color;

    let textSnippet = msg.text || '';
    if (msg.photoUrl && !msg.text) {
      textSnippet = '📷 Foto compartida';
    } else if (msg.photoUrl && msg.text) {
      textSnippet = `📷 ${msg.text}`;
    } else if (!textSnippet) {
      if (msg.audioUrl) textSnippet = '🎙️ Nota de voz';
      else if (msg.isQuickStatus) textSnippet = '📍 Estado rápido';
      else textSnippet = 'Mensaje privado';
    }

    const isUnread =
      (!seenMessageIds || !seenMessageIds.has(msg.id)) &&
      (currentUser.type === 'traveler'
        ? msg.senderType === 'family' && !msg.isReadByTraveler
        : msg.senderType === 'traveler' && !msg.isReadByFamily);

    const msgTimestamp = new Date(msg.createdAt).getTime() || 0;
    let timeDisplay = '';
    if (msg.createdAt) {
      const d = new Date(msg.createdAt);
      if (!isNaN(d.getTime())) {
        timeDisplay = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    if (!timeDisplay) {
      if (msg.timezoneCostaRica) {
        const match = msg.timezoneCostaRica.match(/(\d{1,2}:\d{2}\s*(?:a\.\s*m\.|p\.\s*m\.|AM|PM)?)/i);
        timeDisplay = match ? match[1] : 'Reciente';
      } else if (msg.timezoneSpain) {
        const match = msg.timezoneSpain.match(/(\d{1,2}:\d{2}\s*(?:a\.\s*m\.|p\.\s*m\.|AM|PM)?)/i);
        timeDisplay = match ? match[1] : 'Reciente';
      } else {
        timeDisplay = 'Reciente';
      }
    }

    const isMine = msg.senderName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
    const isDelivered = Boolean(msg.id) && !msg.id.startsWith('temp-');
    const isRead = isMine && (
      currentUser.type === 'traveler' ? Boolean(msg.isReadByFamily) : Boolean(msg.isReadByTraveler)
    );

    if (!conversationsMap.has(key)) {
      conversationsMap.set(key, {
        partnerName: partnerDetails.formattedName,
        formattedName: partnerDetails.formattedName,
        initial: partnerDetails.initial,
        partnerRole: partnerDetails.isTraveler ? 'traveler' : partnerRole,
        avatarColor,
        lastMessage: textSnippet,
        lastTime: timeDisplay,
        timestamp: msgTimestamp,
        unreadCount: isUnread ? 1 : 0,
        totalMessages: 1,
        isOnline,
        lastMessageIsMine: isMine,
        lastMessageIsDelivered: isDelivered,
        lastMessageIsRead: isRead,
      });
    } else {
      const existing = conversationsMap.get(key)!;
      const isNewer = msgTimestamp >= existing.timestamp;
      conversationsMap.set(key, {
        ...existing,
        lastMessage: isNewer ? textSnippet : existing.lastMessage,
        lastTime: isNewer ? timeDisplay : existing.lastTime,
        timestamp: Math.max(existing.timestamp, msgTimestamp),
        unreadCount: existing.unreadCount + (isUnread ? 1 : 0),
        totalMessages: existing.totalMessages + 1,
        isOnline: isOnline || existing.isOnline,
        lastMessageIsMine: isNewer ? isMine : existing.lastMessageIsMine,
        lastMessageIsDelivered: isNewer ? isDelivered : existing.lastMessageIsDelivered,
        lastMessageIsRead: isNewer ? isRead : existing.lastMessageIsRead,
      });
    }
  });

  // Also include users connected via link (presence) who entered their name
  presenceUsers.forEach((p) => {
    if (!p.name || p.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return;
    const cleanName = p.name.trim();
    const key = cleanName.toLowerCase();
    const pDetails = getPersonDetails(cleanName, travelers, p.avatarColor);

    if (!conversationsMap.has(key)) {
      conversationsMap.set(key, {
        partnerName: pDetails.formattedName,
        formattedName: pDetails.formattedName,
        initial: pDetails.initial,
        partnerRole: pDetails.isTraveler ? 'traveler' : p.role,
        avatarColor: p.avatarColor || pDetails.color,
        lastMessage: pDetails.isTraveler ? 'Viajero en España • Toca para chatear' : 'Conectado por enlace familiar',
        lastTime: 'En línea',
        timestamp: 0,
        unreadCount: 0,
        totalMessages: 0,
        isOnline: Boolean(p.isOnline),
      });
    } else {
      const existing = conversationsMap.get(key)!;
      conversationsMap.set(key, {
        ...existing,
        isOnline: Boolean(p.isOnline) || existing.isOnline,
      });
    }
  });

  // Ensure all 5 travelers are visible in the chat list
  if (Array.isArray(travelers)) {
    travelers.forEach((t) => {
      if (!t.name || t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return;
      const cleanTName = t.name.trim();
      const key = cleanTName.toLowerCase();
      const isOnline = presenceUsers.some(
        (p) => p && p.name && p.name.toLowerCase() === key && p.isOnline
      );
      const tDetails = getPersonDetails(cleanTName, travelers, t.avatarColor);

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          partnerName: tDetails.formattedName,
          formattedName: tDetails.formattedName,
          initial: tDetails.initial,
          partnerRole: 'traveler',
          avatarColor: t.avatarColor || tDetails.color,
          lastMessage: 'Viajero en España • Toca para chatear',
          lastTime: isOnline ? 'En línea' : 'España',
          timestamp: 0,
          unreadCount: 0,
          totalMessages: 0,
          isOnline,
        });
      }
    });
  }

  const conversationList = Array.from(conversationsMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );

  const totalUnreadCount = Array.from(conversationsMap.values()).reduce(
    (acc, c) => acc + c.unreadCount,
    0
  );

  const handleOpenConversation = (partnerName: string) => {
    if (onMarkAsSeen) {
      const cleanTarget = partnerName.toLowerCase().trim();
      const idsToMark = safeMessages
        .filter(
          (m) =>
            m.senderName.toLowerCase().trim() === cleanTarget ||
            (m.familyMemberName && m.familyMemberName.toLowerCase().trim() === cleanTarget) ||
            (m.travelerName && m.travelerName.toLowerCase().trim() === cleanTarget)
        )
        .map((m) => m.id);
      if (idsToMark.length > 0) {
        onMarkAsSeen(idsToMark);
      }
    }
    onOpenPrivateChat?.(partnerName);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Active Presence Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              En Línea en Vivo ({presenceUsers.length})
            </h4>
          </div>
          <span className="text-[10px] text-stone-400">Viajeros y Familiares conectados</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {presenceUsers.map((u) => {
            const uDetails = getPersonDetails(u.name, travelers, u.avatarColor);
            return (
              <div
                key={u.id}
                onClick={() => handleOpenConversation(u.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border transition-all cursor-pointer shadow-2xs ${
                  uDetails.isTraveler
                    ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                    : 'bg-sky-50 text-sky-950 border-sky-300 hover:bg-sky-100'
                }`}
                title={`Iniciar chat privado con ${uDetails.formattedName}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white"
                  style={{ backgroundColor: uDetails.color }}
                />
                <span>{uDetails.formattedName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Messages & Conversations Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
              <MessageSquare className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-stone-950">
                Mis Mensajes & Chats Directos
              </h3>
              <p className="text-[11px] text-stone-500">
                Toca cualquier nombre para abrir la conversación y responder con texto, audios o estados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalUnreadCount > 0 && onMarkAsSeen && (
              <button
                type="button"
                onClick={() => {
                  const allUnreadIds = safeMessages
                    .filter((m) => !seenMessageIds || !seenMessageIds.has(m.id))
                    .map((m) => m.id);
                  if (allUnreadIds.length > 0) {
                    onMarkAsSeen(allUnreadIds);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold border border-amber-300 transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                title="Marcar todos los mensajes como leídos"
              >
                <Check className="w-3.5 h-3.5 text-amber-700" />
                <span>Marcar leídos ({totalUnreadCount})</span>
              </button>
            )}

            {safeMessages.length > 0 && onClearAllChats && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas vaciar todo el historial de mensajes de los chats?')) {
                    onClearAllChats();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 text-xs font-bold border border-stone-200 hover:border-red-200 transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                title="Borrar todos los mensajes del chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-600" />
                <span>Limpiar Chats</span>
              </button>
            )}
          </div>
        </div>

        {conversationList.length === 0 ? (
          <div className="text-center py-6 px-4 bg-stone-50/80 rounded-2xl border border-dashed border-stone-200 space-y-2">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-stone-700">
              Aún no tienes mensajes directos en tu historial
            </h4>
            <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
              Cuando un familiar o viajero te escriba, verás su conversación aquí para chatear al instante.
            </p>
            {presenceUsers.length > 0 && (
              <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-stone-500">Chatear con:</span>
                {presenceUsers.filter(u => u.name && u.name.trim().toLowerCase() !== currentUser.name.trim().toLowerCase()).slice(0, 4).map((u) => {
                  const uDetails = getPersonDetails(u.name, travelers, u.avatarColor);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleOpenConversation(u.name)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: uDetails.color }} />
                      <span>{uDetails.formattedName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {conversationList.map((conv) => (
              <div
                key={conv.partnerName}
                onClick={() => handleOpenConversation(conv.partnerName)}
                className="p-3 sm:p-4 bg-white hover:bg-amber-50/70 border-2 border-stone-200 hover:border-amber-400 rounded-2xl sm:rounded-3xl transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-xs hover:shadow-md"
                title={`Abrir chat con ${conv.formattedName}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-xs border-2 border-white shrink-0"
                      style={{ backgroundColor: conv.avatarColor }}
                    >
                      {conv.initial}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-base font-black text-stone-950 group-hover:text-amber-950 transition-colors leading-tight truncate">
                          {conv.formattedName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border uppercase shrink-0 whitespace-nowrap shadow-2xs ${
                              conv.partnerRole === 'traveler'
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-sky-100 text-sky-950 border-sky-300'
                            }`}
                          >
                            {conv.partnerRole === 'traveler' ? '✈️ Viajero en España' : '🏠 Familia'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-stone-500 font-bold shrink-0 ml-1 whitespace-nowrap">
                        {conv.lastTime}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-stone-600 truncate font-medium mt-1 flex items-center gap-1.5">
                      {conv.lastMessageIsMine && (
                        conv.lastMessageIsRead ? (
                          <span
                            className="inline-flex items-center -space-x-1.5 text-emerald-600 font-black shrink-0"
                            title="Visto por el viajero (Doble palomita verde ✓✓)"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-stone-400 font-bold shrink-0"
                            title="Mensaje recibido (Una palomita ✓)"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                          </span>
                        )
                      )}
                      <span className="truncate">{conv.lastMessage}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {conv.unreadCount > 0 && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-bounce shadow-2xs">
                      {conv.unreadCount} nuevo
                    </span>
                  )}
                  {conv.totalMessages > 0 && onClearConversation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Deseas vaciar los mensajes con ${conv.formattedName}?`)) {
                          onClearConversation(conv.partnerName);
                        }
                      }}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 transition shadow-2xs cursor-pointer active:scale-95"
                      title={`Limpiar mensajes con ${conv.formattedName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-amber-400 group-hover:bg-amber-500 text-stone-950 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Creator Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
        <form onSubmit={handlePublishPost}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-xs border border-white"
              style={{ backgroundColor: currentUser.color }}
            >
              {formatPersonName(currentUser.name).charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder={`¿Qué hay de nuevo, ${formatPersonName(currentUser.name)}? Comparte un mensaje o foto con todos...`}
                rows={2}
                className="w-full text-sm text-stone-900 placeholder:text-stone-400 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />

              {/* Uploaded Photo Preview */}
              {uploadedPhoto && (
                <div className="relative mt-2 inline-block rounded-xl overflow-hidden border border-stone-300 max-h-48 shadow-xs">
                  <img src={uploadedPhoto.url} alt="Preview" className="max-h-48 w-auto object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedPhoto(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Creator Bottom Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>Subir Foto</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoPicked}
                  />

                  <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Lugar (ej: Puerta del Sol)"
                      className="bg-transparent text-xs text-stone-800 focus:outline-none w-32 sm:w-44"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!postText.trim() && !uploadedPhoto}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar en el Muro</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Wall Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center">
            <MessageSquare className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
            <h5 className="text-sm font-bold text-stone-700">El muro está esperando la primera publicación</h5>
            <p className="text-xs text-stone-400 mt-1">
              ¡Sé el primero en compartir un saludo, foto o actualización del viaje!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = (post.likedBy || []).includes(currentUser.name);
            const authorDetails = getPersonDetails(post.authorName, travelers, post.authorColor);
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-2xs shrink-0 border border-white"
                      style={{ backgroundColor: authorDetails.color }}
                    >
                      {authorDetails.initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-stone-950">{authorDetails.formattedName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs uppercase ${
                            authorDetails.isTraveler
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-sky-100 text-sky-950 border-sky-300'
                          }`}
                        >
                          {authorDetails.isTraveler ? '✈️ Viajero en España' : '🏠 Familiar'}
                        </span>
                      </div>

                      {post.locationName && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 font-semibold mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{post.locationName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dual Timezone Badge */}
                  <div className="text-right text-[10px] font-semibold text-stone-500 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
                    <span className="block text-emerald-700 font-bold">{post.timezoneSpain}</span>
                    <span className="block text-amber-700">{post.timezoneCostaRica}</span>
                  </div>
                </div>

                {/* Body Text */}
                {post.text && (
                  <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed mb-3">
                    {post.text}
                  </p>
                )}

                {/* Photo */}
                {post.photoUrl && (
                  <div
                    onClick={() => setLightboxImage(post.photoUrl || null)}
                    className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 max-h-96 cursor-pointer group mb-3 shadow-xs"
                  >
                    <img
                      src={post.photoUrl}
                      alt={post.photoName || 'Foto del Muro'}
                      className="w-full h-full max-h-96 object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="px-3 py-1.5 bg-black/70 text-white rounded-full text-xs font-bold backdrop-blur-xs">
                        🔍 Clic para ver en grande
                      </span>
                    </div>
                  </div>
                )}

                {/* Action buttons (Like) */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      hasLiked
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{post.likesCount || 0} Me gusta</span>
                  </button>

                  <span className="text-[11px] text-stone-400">
                    Visible para los 5 viajeros y familiares con el link
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
