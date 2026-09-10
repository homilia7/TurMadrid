import React, { useState } from 'react';
import { 
  Plane, 
  Users, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Clock, 
  Send, 
  Mic, 
  Volume2, 
  Navigation,
  LogOut,
  Radio
} from 'lucide-react';
import { Traveler, Tour, WallPost, FamilyMessage, PresenceUser, LiveLocationShare, DocumentItem } from '../types';
import { FlightLiveTracker } from './FlightLiveTracker';
import { LiveWallSection } from './LiveWallSection';
import { PrivateChatModal } from './PrivateChatModal';
import { LiveGPSMap } from './LiveGPSMap';
import { sendPresenceHeartbeatToCloud } from '../utils/familySync';
import {
  subscribeToWebPush,
  requestNotificationPermission,
  sendBrowserNotification,
  playChimeSound,
} from '../utils/alertManager';

interface FamilyViewProps {
  associatedTravelerName: string;
  travelers: Traveler[];
  tours: Tour[];
  documents?: DocumentItem[];
  wallPosts: WallPost[];
  familyMessages: FamilyMessage[];
  presenceUsers: PresenceUser[];
  travelerLocation?: LiveLocationShare | null;
  locations?: LiveLocationShare[];
  seenMessageIds?: Set<string>;
  onAddWallPost: (post: WallPost) => void;
  onLikeWallPost: (postId: string) => void;
  onSendFamilyMessage: (msg: FamilyMessage) => void;
  onSwitchToTravelerMode: () => void;
  onMarkAsSeen?: (msgIds: string[]) => void;
  onClearChat?: (targetUserName?: string) => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({
  associatedTravelerName,
  travelers,
  tours,
  documents = [],
  wallPosts,
  familyMessages,
  presenceUsers,
  travelerLocation,
  locations = [],
  seenMessageIds,
  onAddWallPost,
  onLikeWallPost,
  onSendFamilyMessage,
  onSwitchToTravelerMode,
  onMarkAsSeen,
  onClearChat,
}) => {
  const [familyMemberName, setFamilyMemberName] = useState<string>(() => {
    return localStorage.getItem('tur_family_name') || '';
  });
  const [nameInput, setNameInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'muro' | 'chat' | 'vuelo' | 'itinerario' | 'gps'>('muro');
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string>(associatedTravelerName || 'Jessica');
  const [selectedGpsTravelerName, setSelectedGpsTravelerName] = useState<string>(associatedTravelerName || 'Jessica');

  // Send real-time presence heartbeat and auto-register WebPush when family member has entered their name
  React.useEffect(() => {
    if (!familyMemberName.trim()) return;
    const sendHb = () => {
      sendPresenceHeartbeatToCloud({
        id: `fam-${familyMemberName.toLowerCase().trim().replace(/\s+/g, '-')}`,
        name: familyMemberName.trim(),
        role: 'family',
        isOnline: true,
        lastActive: new Date().toISOString(),
        avatarColor: '#0284c7',
      });
    };
    sendHb();
    const interval = setInterval(sendHb, 10000);

    // Auto-register for Web Push if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      subscribeToWebPush(`fam-${familyMemberName.toLowerCase().trim()}`, familyMemberName.trim());
    }

    return () => clearInterval(interval);
  }, [familyMemberName]);

  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const targetTraveler = safeTravelers.find((t) => t && t.name && t.name.toLowerCase() === (associatedTravelerName || '').toLowerCase()) || safeTravelers[0];

  const handleSaveFamilyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const clean = nameInput.trim();
    setFamilyMemberName(clean);
    localStorage.setItem('tur_family_name', clean);

    // On user gesture, proactively request notification permissions and register WebPush
    try {
      playChimeSound();
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        await subscribeToWebPush(`fam-${clean.toLowerCase()}`, clean);
        sendBrowserNotification(
          '🔔 ¡Conectado al viaje en vivo!',
          `Recibirás todas las fotos y mensajes de ${targetTraveler?.name || 'los viajeros'} en tiempo real.`,
          '/pwa-192x192.png'
        );
      }
    } catch {}
  };

  const handleLogoutFamily = () => {
    localStorage.removeItem('tur_family_name');
    setFamilyMemberName('');
  };

  // If no name entered yet, show the friendly welcome screen
  if (!familyMemberName) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
        <div className="max-w-md mx-auto my-auto w-full text-center">
          <div className="w-14 h-14 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/20">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal de Acompañamiento Familiar</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            ¡Sigue el viaje a España de <span className="text-amber-400">{targetTraveler?.name || 'los Viajeros'}</span>! 🇪🇸✈️
          </h2>

          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Ingresa tu nombre para acceder al vuelo en vivo, ver las fotos del muro y conversar en directo.
          </p>

          <form onSubmit={handleSaveFamilyName} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                ¿Cómo te conocen los viajeros? (ej: Mamá, Papá, Carlos):
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Tu nombre o parentesco..."
                autoFocus
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Conectarme al Viaje</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onSwitchToTravelerMode}
              className="text-xs font-bold text-slate-400 hover:text-white transition underline"
            >
              ¿Eres uno de los 5 viajeros? Ingresar como viajero
            </button>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-600">
          TurEuropa • Enlace de acompañamiento familiar
        </footer>
      </div>
    );
  }

  // Current user object for Wall and Chat
  const familyCurrentUser = {
    name: familyMemberName,
    type: 'family' as const,
    color: '#0284c7', // Sky blue for family
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20 overflow-x-hidden max-w-full w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-stone-900">TurEuropa Familiar</h1>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                  Siguiendo a {targetTraveler?.name}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Conectado como: <strong>{familyMemberName}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrivateChatOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat con {targetTraveler?.name}</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutFamily}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              title="Cambiar de nombre"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-2 border-t border-stone-100 py-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('muro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'muro'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs ring-1 ring-amber-600/40'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 font-bold'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-900" />
            <span>💬 Chats & Muro ({wallPosts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrivateChatOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 border border-amber-500/50 shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer animate-pulse"
          >
            <MessageSquare className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
            <span>Abrir Chats (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'gps'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>📍 Ubicación GPS</span>
            {((locations || []).filter((l) => l && l.isActive).length > 0 || travelerLocation?.isActive) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vuelo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'vuelo'
                ? 'bg-stone-900 text-white shadow-xs font-black'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Vuelo en Vivo</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'gps' && (
          <div className="space-y-6">
            <LiveGPSMap
              locations={locations.length > 0 ? locations : (travelerLocation ? [travelerLocation] : [])}
              travelers={travelers}
              selectedTravelerName={selectedGpsTravelerName}
              onSelectTraveler={(tName) => {
                setSelectedGpsTravelerName(tName);
              }}
              onOpenChat={(tName) => {
                if (tName) setSelectedChatPartner(tName);
                setIsPrivateChatOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'vuelo' && (
          <div className="space-y-6">
            <FlightLiveTracker documents={documents} mode="family" />
          </div>
        )}

        {activeTab === 'muro' && (
          <div className="space-y-6">
            <LiveWallSection
              currentUser={familyCurrentUser}
              posts={wallPosts}
              presenceUsers={presenceUsers}
              messages={familyMessages}
              travelers={travelers}
              seenMessageIds={seenMessageIds}
              onAddPost={onAddWallPost}
              onLikePost={onLikeWallPost}
              onOpenPrivateChat={(tName) => {
                if (tName) setSelectedChatPartner(tName);
                setIsPrivateChatOpen(true);
              }}
              onClearAllChats={onClearChat ? () => onClearChat() : undefined}
              onClearConversation={onClearChat ? (name) => onClearChat(name) : undefined}
              onMarkAsSeen={onMarkAsSeen}
            />
          </div>
        )}
      </main>

      {/* Private Chat Modal with Audio & Quick Status */}
      {isPrivateChatOpen && (
        <PrivateChatModal
          isOpen={isPrivateChatOpen}
          onClose={() => setIsPrivateChatOpen(false)}
          currentUser={familyCurrentUser}
          targetUserName={selectedChatPartner || targetTraveler?.name || 'Jessica'}
          messages={familyMessages}
          onSendMessage={onSendFamilyMessage}
          travelerLocation={travelerLocation}
          onMarkAsSeen={onMarkAsSeen}
          onClearChat={onClearChat ? (name) => onClearChat(name) : undefined}
          travelers={travelers}
          seenMessageIds={seenMessageIds}
        />
      )}
    </div>
  );
};
