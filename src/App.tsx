import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Traveler, Tour, ItineraryDay, DocumentItem, CloudSyncState, Ticket } from './types';
import { INITIAL_DAYS } from './data/initialItinerary';
import {
  loadTravelers,
  saveTravelers,
  loadTours,
  saveTours,
  loadDays,
  saveDays,
  loadDocuments,
  saveDocuments,
  loadActiveTravelerId,
  saveActiveTravelerId,
  loadDefaultAlertHours,
  saveDefaultAlertHours,
  loadAlertSoundEnabled,
  saveAlertSoundEnabled,
  resetToBrochureDefaults,
} from './utils/storage';
import {
  fetchCloudData,
  syncToCloud,
  uploadDocumentToCloud,
  deleteDocumentFromCloud,
  saveTravelerToCloud,
} from './utils/cloudSync';
import {
  calculateTourAlertStatus,
  playChimeSound,
  sendBrowserNotification,
  requestNotificationPermission,
  subscribeToWebPush,
  triggerServerPushTest,
} from './utils/alertManager';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { DaySection } from './components/DaySection';
import { GroupSummary } from './components/GroupSummary';
import { TravelersModal } from './components/TravelersModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AddTourModal } from './components/AddTourModal';
import { TicketModal } from './components/TicketModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileBottomNav, MainTabType } from './components/MobileBottomNav';
import { PassportSection } from './components/PassportSection';
import { FlightSection } from './components/FlightSection';
import { TicketsHubSection } from './components/TicketsHubSection';
import { ExpensesTrackerSection } from './components/ExpensesTrackerSection';
import { LandingGateway } from './components/LandingGateway';
import { FamilyView } from './components/FamilyView';
import { FlightLiveWidget } from './components/FlightLiveWidget';
import { FlightCountdown } from './components/FlightCountdown';
import { LiveWallSection } from './components/LiveWallSection';
import { PrivateChatModal } from './components/PrivateChatModal';
import { IncomingChatToast } from './components/IncomingChatToast';
import { TravelerGPSWidget } from './components/TravelerGPSWidget';
import { useTravelerGPS } from './hooks/useTravelerGPS';
import {
  fetchFamilyData,
  sendWallPostToCloud,
  sendFamilyMessageToCloud,
  sendPresenceHeartbeatToCloud,
  sendLocationToCloud,
  clearChatInCloud,
  markFamilyMessagesReadInCloud,
} from './utils/familySync';
import {
  WallPost,
  FamilyMessage,
  PresenceUser,
  LiveLocationShare,
  Expense,
} from './types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ticket as TicketIcon,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Plane,
  ShieldCheck,
  Users,
  Radio,
  Share2,
  Copy,
  Check,
  Bell,
  X,
  LogOut,
  MessageCircle,
} from 'lucide-react';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<MainTabType>('itinerary');

  // Mode & Authentication State
  const searchParams = new URLSearchParams(window.location.search);
  const isFamilyUrlParam = searchParams.get('familia') === '1' || searchParams.get('familiar') === '1';
  const urlTravelerName = searchParams.get('viajero') || searchParams.get('v') || 'Jessica';

  const [isFamilyMode, setIsFamilyMode] = useState<boolean>(() => {
    if (isFamilyUrlParam) {
      try {
        localStorage.setItem('tur_role', 'family');
      } catch {}
      return true;
    }
    try {
      const savedRole = localStorage.getItem('tur_role');
      if (savedRole === 'family') return true;
      if (localStorage.getItem('tur_family_name') && !localStorage.getItem('tur_traveler_session')) {
        return true;
      }
    } catch {}
    return false;
  });
  const [travelerSessionId, setTravelerSessionId] = useState<string | null>(() => {
    return localStorage.getItem('tur_traveler_session');
  });

  // Family Realtime State
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [familyMessages, setFamilyMessages] = useState<FamilyMessage[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [travelerLocation, setTravelerLocation] = useState<LiveLocationShare | null>(null);
  const [familyLocations, setFamilyLocations] = useState<LiveLocationShare[]>([]);
  const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null);
  const [incomingChatToast, setIncomingChatToast] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tur_seen_msg_ids') || sessionStorage.getItem('tur_seen_msg_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const seenMessageIdsRef = React.useRef<Set<string>>(seenMessageIds);

  // Track message IDs for which a system/sound notification has already fired (prevents duplicates)
  const [notifiedMessageIds, setNotifiedMessageIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tur_notified_msg_ids') || sessionStorage.getItem('tur_notified_msg_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const notifiedMessageIdsRef = React.useRef<Set<string>>(notifiedMessageIds);

  const markMessageAsNotified = useCallback((msgIds: string | string[]) => {
    const ids = Array.isArray(msgIds) ? msgIds : [msgIds];
    if (ids.length === 0) return;
    let changed = false;
    ids.forEach((id) => {
      if (id && !notifiedMessageIdsRef.current.has(id)) {
        notifiedMessageIdsRef.current.add(id);
        changed = true;
      }
    });
    if (changed) {
      try {
        const arr = Array.from(notifiedMessageIdsRef.current);
        const trimmed = arr.length > 500 ? arr.slice(arr.length - 500) : arr;
        localStorage.setItem('tur_notified_msg_ids', JSON.stringify(trimmed));
        sessionStorage.setItem('tur_notified_msg_ids', JSON.stringify(trimmed));
      } catch {}
      setNotifiedMessageIds(new Set(notifiedMessageIdsRef.current));
    }
  }, []);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [dismissNotificationBanner, setDismissNotificationBanner] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('tur_dismiss_notif_banner'));
  });

  const markMessagesAsSeen = useCallback((msgIds: string | string[]) => {
    const ids = Array.isArray(msgIds) ? msgIds : [msgIds];
    if (ids.length === 0) return;
    let changed = false;
    ids.forEach((id) => {
      if (id && !seenMessageIdsRef.current.has(id)) {
        seenMessageIdsRef.current.add(id);
        changed = true;
      }
    });
    if (changed) {
      try {
        const arr = Array.from(seenMessageIdsRef.current);
        localStorage.setItem('tur_seen_msg_ids', JSON.stringify(arr));
        sessionStorage.setItem('tur_seen_msg_ids', JSON.stringify(arr));
      } catch {
        // ignore
      }
      setSeenMessageIds(new Set(seenMessageIdsRef.current));
    }
    // Synchronize read status with Cloudflare D1 so the sender sees the double green checkmark
    const readerRole = isFamilyMode ? 'family' : 'traveler';
    setFamilyMessages((prev) =>
      prev.map((msg) => {
        if (ids.includes(msg.id)) {
          return {
            ...msg,
            ...(readerRole === 'traveler' ? { isReadByTraveler: true } : { isReadByFamily: true }),
          };
        }
        return msg;
      })
    );
    markFamilyMessagesReadInCloud(ids, readerRole);
  }, [isFamilyMode]);

  const markMessageAsSeen = (msgId: string) => {
    markMessagesAsSeen([msgId]);
  };

  // Core State
  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    const loaded = loadTravelers();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [tours, setTours] = useState<Tour[]>(() => {
    const loaded = loadTours();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [days, setDays] = useState<ItineraryDay[]>(() => {
    const loaded = loadDays();
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : [];
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const loaded = loadDocuments();
    return Array.isArray(loaded) ? loaded : [];
  });
  const [activeTravelerId, setActiveTravelerId] = useState<string>(() => {
    return localStorage.getItem('tur_traveler_session') || loadActiveTravelerId();
  });

  useEffect(() => {
    if (activeTravelerId) {
      saveActiveTravelerId(activeTravelerId);
      try {
        localStorage.setItem('tur_traveler_session', activeTravelerId);
      } catch {}
    }
  }, [activeTravelerId]);
  const [defaultAlertHours, setDefaultAlertHours] = useState<number>(loadDefaultAlertHours);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(loadAlertSoundEnabled);

  // Safe arrays defined at the very top of App to prevent Temporal Dead Zone (TDZ)
  const safeTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : [];
  const safeTours = Array.isArray(tours) ? tours : [];
  const safeDays = Array.isArray(days) ? days : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Expenses Tracker State (Starts with 0 expenses)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('tureuropa_expenses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out demo seeds if any
          return parsed.filter((exp) => exp.id !== 'exp-1' && exp.id !== 'exp-2' && exp.id !== 'exp-demo-1' && exp.id !== 'exp-demo-2');
        }
      }
    } catch (e) {
      console.warn('Error loading expenses from storage:', e);
    }
    return [];
  });

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...newExpenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const updated = [newExp, ...prev];
      try {
        localStorage.setItem('tureuropa_expenses_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving expense:', e);
      }
      return updated;
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((exp) => exp.id !== id);
      try {
        localStorage.setItem('tureuropa_expenses_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error deleting expense:', e);
      }
      return updated;
    });
  };

  const handleClearExpenses = (travelerId?: string) => {
    setExpenses((prev) => {
      let updated: Expense[] = [];
      if (travelerId && travelerId !== 'all') {
        updated = prev.filter((exp) => exp.travelerId !== travelerId);
      } else {
        updated = [];
      }
      try {
        localStorage.setItem('tureuropa_expenses_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error clearing expenses:', e);
      }
      return updated;
    });
  };

  // Cloudflare Sync State
  const [syncState, setSyncState] = useState<CloudSyncState>({
    status: 'synced',
    lastSyncedAt: new Date().toISOString(),
  });

  // Modals state
  const [isTravelersModalOpen, setIsTravelersModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isAddTourModalOpen, setIsAddTourModalOpen] = useState<boolean>(false);
  const [selectedDayForNewTour, setSelectedDayForNewTour] = useState<number>(1);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [activeTicketTour, setActiveTicketTour] = useState<Tour | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'visited' | 'tickets'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // 1. Initial Cloudflare D1 Data Fetch & Hydration
  useEffect(() => {
    let isMounted = true;
    async function initCloudData() {
      setSyncState((prev) => ({ ...prev, status: 'syncing' }));
      const cloudData = await fetchCloudData();
      if (!isMounted) return;

      if (cloudData) {
        const cloudDocs = Array.isArray(cloudData.documents) ? cloudData.documents : [];
        const localDocs = loadDocuments();
        
        // Merge cloud documents and any local documents by id, preserving latest qrCropUrl
        const docsMap = new Map<string, DocumentItem>();
        cloudDocs.forEach((d) => docsMap.set(d.id, d));
        localDocs.forEach((d) => {
          if (!docsMap.has(d.id)) {
            docsMap.set(d.id, d);
          } else {
            const existing = docsMap.get(d.id)!;
            docsMap.set(d.id, {
              ...existing,
              ...d,
              passengerName: d.passengerName || existing.passengerName,
              qrCropUrl: d.qrCropUrl || existing.qrCropUrl,
              qrCodeText: d.qrCodeText || existing.qrCodeText,
              dataUrl: d.dataUrl || existing.dataUrl,
            });
          }
        });
        const mergedDocs = Array.from(docsMap.values());
        setDocuments(mergedDocs);
        saveDocuments(mergedDocs);

        if (Array.isArray(cloudData.tours) && cloudData.tours.length > 0) {
          const rawLocalTours = loadTours();
          const localToursList = Array.isArray(rawLocalTours) ? rawLocalTours : [];
          const localTicketsMap = new Map<string, Ticket>();
          localToursList.forEach((tourItem) => {
            if (tourItem && Array.isArray(tourItem.tickets)) {
              tourItem.tickets.forEach((ticketItem) => {
                if (ticketItem && ticketItem.id) {
                  localTicketsMap.set(ticketItem.id, ticketItem);
                }
              });
            }
          });

          const docsByIdMap = new Map<string, any>();
          (Array.isArray(mergedDocs) ? mergedDocs : []).forEach((docItem) => {
            if (docItem && docItem.id) {
              docsByIdMap.set(docItem.id, docItem);
            }
          });

          const hydratedTours = cloudData.tours.map((cloudTour) => {
            const tourDocs = (Array.isArray(mergedDocs) ? mergedDocs : []).filter(
              (docItem) => docItem && docItem.tourId === cloudTour.id && (docItem.category === 'entrada' || !docItem.category)
            );

            const baseTickets = tourDocs.length > 0 ? tourDocs : (Array.isArray(cloudTour.tickets) ? cloudTour.tickets : []);
            const finalTickets = baseTickets.map((ticketItem) => {
              const matchedLocalTicket = localTicketsMap.get(ticketItem.id);
              const matchedCloudDoc = docsByIdMap.get(ticketItem.id);
              return {
                ...ticketItem,
                qrCropUrl: ticketItem.qrCropUrl || matchedCloudDoc?.qrCropUrl || matchedLocalTicket?.qrCropUrl,
                qrCodeText: ticketItem.qrCodeText || matchedCloudDoc?.qrCodeText || matchedLocalTicket?.qrCodeText,
                dataUrl: ticketItem.dataUrl || matchedCloudDoc?.dataUrl || matchedLocalTicket?.dataUrl,
              };
            });

            return {
              ...cloudTour,
              tickets: finalTickets,
            };
          });
          setTours(hydratedTours);
          saveTours(hydratedTours);
        }
        if (Array.isArray(cloudData.travelers) && cloudData.travelers.length > 0) {
          setTravelers(cloudData.travelers);
          saveTravelers(cloudData.travelers);
        }
        if (Array.isArray(cloudData.days) && cloudData.days.length > 0) {
          setDays(cloudData.days);
          saveDays(cloudData.days);
        }
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      } else {
        const initialTours = loadTours();
        const initialTravelers = loadTravelers();
        const initialDays = loadDays();
        const initialDocs = loadDocuments();
        await syncToCloud({
          travelers: initialTravelers,
          tours: initialTours,
          days: initialDays,
          documents: initialDocs,
        });
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      }
    }

    initCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Local Persistence Effects
  useEffect(() => {
    saveTravelers(travelers);
  }, [travelers]);

  useEffect(() => {
    saveTours(tours);
  }, [tours]);

  useEffect(() => {
    saveDays(days);
  }, [days]);

  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  useEffect(() => {
    saveActiveTravelerId(activeTravelerId);
  }, [activeTravelerId]);

  useEffect(() => {
    saveDefaultAlertHours(defaultAlertHours);
  }, [defaultAlertHours]);

  useEffect(() => {
    saveAlertSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // 3. Debounced Cloudflare Sync on State Change
  const triggerCloudSync = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, status: 'syncing' }));
    const success = await syncToCloud({
      travelers,
      tours,
      days,
      documents,
    });
    if (success) {
      setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } else {
      setSyncState({ status: navigator.onLine ? 'error' : 'offline' });
    }
  }, [travelers, tours, days, documents]);

  // 4. Family & Wall Realtime Sync Effect
  useEffect(() => {
    let isMounted = true;

    const syncFamily = async () => {
      const data = await fetchFamilyData();
      if (!isMounted) return;

      // Find current device traveler session
      const currentTraveler =
        travelers.find((t) => t.id === travelerSessionId) ||
        travelers.find((t) => t.id === activeTravelerId && activeTravelerId !== 'all') ||
        travelers.find((t) => t.name.toLowerCase() === urlTravelerName.toLowerCase()) ||
        travelers[0];

      const myNormalizedName = (currentTraveler?.name || '').trim().toLowerCase();

      // Process Wall Posts
      if (data.wallPosts.length > 0) {
        setWallPosts(data.wallPosts);

        // Check for new unseen wall posts created by someone else
        if (currentTraveler) {
          const unseenPosts = data.wallPosts.filter(
            (p) =>
              !seenMessageIdsRef.current.has(`post-${p.id}`) &&
              (p.authorName || '').trim().toLowerCase() !== myNormalizedName
          );

          if (unseenPosts.length > 0) {
            const latestPost = unseenPosts[0];
            seenMessageIdsRef.current.add(`post-${latestPost.id}`);
            try {
              localStorage.setItem('tur_seen_msg_ids', JSON.stringify(Array.from(seenMessageIdsRef.current)));
            } catch {}

            if (soundEnabled) {
              playChimeSound();
            }

            const author = latestPost.authorName || 'Familia';
            const postPreview = latestPost.text || (latestPost.photoUrl ? '📷 Nueva foto compartida en el Muro' : 'Nueva publicación');
            sendBrowserNotification(
              `📸 ${author} publicó en el Muro`,
              postPreview,
              '/pwa-192x192.png',
              `wall-${latestPost.id}`
            );
          }
        }
      }

      // Process Messages
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setFamilyMessages(data.messages);

        if (currentTraveler) {
          // Messages addressed to me (either as travelerName or familyMemberName) or group, sent by someone else
          const incomingForMe = data.messages.filter((m) => {
            const travelerDest = (m.travelerName || '').trim().toLowerCase();
            const familyDest = (m.familyMemberName || '').trim().toLowerCase();
            const sender = (m.senderName || '').trim().toLowerCase();

            const isNotFromMe = sender !== myNormalizedName;
            const isAddressedToMe =
              !travelerDest ||
              travelerDest === myNormalizedName ||
              familyDest === myNormalizedName ||
              travelerDest === 'todos' ||
              travelerDest === 'grupo' ||
              travelerDest === 'todos los viajeros';
            return isAddressedToMe && isNotFromMe;
          });

          if (incomingForMe.length > 0) {
            // If the chat modal is currently open with this target, mark all messages as seen & notified immediately
            if (activeChatTarget) {
              const activeTargetNorm = activeChatTarget.trim().toLowerCase();
              const activeUnseen = incomingForMe
                .filter(
                  (m) =>
                    m.senderName.trim().toLowerCase() === activeTargetNorm &&
                    !seenMessageIdsRef.current.has(m.id)
                )
                .map((m) => m.id);
              if (activeUnseen.length > 0) {
                markMessagesAsSeen(activeUnseen);
                markMessageAsNotified(activeUnseen);
              }
              setIncomingChatToast((prev) =>
                prev && prev.senderName.trim().toLowerCase() === activeTargetNorm ? null : prev
              );
            }

            // Find unnotified messages that are NOT from the currently active open chat
            const unnotifiedMessages = incomingForMe.filter((m) => {
              if (notifiedMessageIdsRef.current.has(m.id) || seenMessageIdsRef.current.has(m.id)) {
                return false;
              }
              if (activeChatTarget && activeChatTarget.trim().toLowerCase() === m.senderName.trim().toLowerCase()) {
                return false;
              }
              return true;
            });

            if (unnotifiedMessages.length > 0) {
              // Immediately mark all unnotified messages as notified so they NEVER fire again
              markMessageAsNotified(unnotifiedMessages.map((m) => m.id));

              // Filter for recent messages (sent within last 30 minutes) to avoid alerting old history on startup
              const nowMs = Date.now();
              const recentUnnotified = unnotifiedMessages.filter((m) => {
                if (!m.createdAt) return true;
                const msgTime = new Date(m.createdAt).getTime();
                return isNaN(msgTime) || nowMs - msgTime < 30 * 60 * 1000;
              });

              if (recentUnnotified.length > 0) {
                const latest = recentUnnotified[recentUnnotified.length - 1];
                const previewText = latest.text || (latest.photoUrl ? '📷 Foto compartida' : latest.audioUrl ? 'Nota de voz 🎙️' : 'Mensaje en vivo');
                
                setIncomingChatToast({
                  id: latest.id,
                  senderName: latest.senderName,
                  text: previewText,
                });

                // Play audible chime alert ONCE for this new message
                if (soundEnabled) {
                  playChimeSound();
                }

                // Send exactly 1 native push notification to Mobile Phone System Notification Bar
                sendBrowserNotification(
                  `💬 Mensaje de ${latest.senderName}`,
                  previewText,
                  '/pwa-192x192.png',
                  `chat-${latest.id}`
                );
              }
            }
          } else {
            // If there are no unseen messages, clear any previously stuck toast
            setIncomingChatToast((prev) => (prev && seenMessageIdsRef.current.has(prev.id) ? null : prev));
          }
        }
      }

      if (Array.isArray(data.presenceUsers) && data.presenceUsers.length > 0) setPresenceUsers(data.presenceUsers);
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        setFamilyLocations(data.locations);
        const activeLoc = data.locations.find((l) => l && l.isActive);
        if (activeLoc) setTravelerLocation(activeLoc);
      }
    };

    syncFamily();
    // Ultra-fast realtime polling interval (2.5 seconds)
    const interval = setInterval(syncFamily, 2500);

    // Instant wake-up on tab visibility change, window focus or network reconnect
    const handleWakeup = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        syncFamily();
      }
    };

    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('focus', handleWakeup);
    window.addEventListener('online', handleWakeup);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('focus', handleWakeup);
      window.removeEventListener('online', handleWakeup);
    };
  }, [activeTravelerId, travelerSessionId, activeChatTarget, markMessagesAsSeen, travelers, soundEnabled, urlTravelerName]);

  // Automatic Web Push Subscription registration on startup/login if permission is already granted
  useEffect(() => {
    const registerPushAuto = async () => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const activeT =
            safeTravelers.find((t) => t && t.id === travelerSessionId) ||
            safeTravelers.find((t) => t && t.id === activeTravelerId && activeTravelerId !== 'all') ||
            safeTravelers[0];
          if (activeT) {
            await subscribeToWebPush(activeT.id, activeT.name);
          }
        }
      } catch {}
    };
    registerPushAuto();
  }, [travelerSessionId, activeTravelerId, safeTravelers]);

  // Presence heartbeat for active traveler
  useEffect(() => {
    const activeT = safeTravelers.find((t) => t && t.id === activeTravelerId);
    if (activeT && travelerSessionId) {
      sendPresenceHeartbeatToCloud({
        id: activeT.id,
        name: activeT.name,
        role: 'traveler',
        avatarColor: activeT.avatarColor,
        lastActive: new Date().toISOString(),
        isOnline: true,
      });
    }
  }, [activeTravelerId, travelerSessionId, travelers]);

  const handleLoginTraveler = async (id: string) => {
    localStorage.setItem('tur_traveler_session', id);
    setTravelerSessionId(id);
    setActiveTravelerId(id);
    const trav = safeTravelers.find((t) => t && t.id === id);
    // Proactively request browser notification permission and register real WebPush
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        setHasNotificationPermission(true);
        if (soundEnabled) {
          playChimeSound();
        }
        await subscribeToWebPush(id, trav?.name);
        sendBrowserNotification(
          '🔔 ¡Notificaciones Activadas!',
          'Recibirás las alertas de tours y mensajes directamente en este teléfono.',
          '/pwa-192x192.png'
        );
      }
    } catch {}
  };

  const handleLogoutTraveler = () => {
    localStorage.removeItem('tur_traveler_session');
    setTravelerSessionId(null);
  };

  const handleAddWallPost = async (post: WallPost) => {
    setWallPosts((prev) => [post, ...prev]);
    await sendWallPostToCloud(post);
  };

  const handleLikeWallPost = async (postId: string) => {
    const activeT = safeTravelers.find((t) => t && t.id === activeTravelerId);
    const likerName = activeT?.name || 'Viajero';
    setWallPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const likedBy = p.likedBy || [];
          const hasLiked = likedBy.includes(likerName);
          const nextLikes = hasLiked
            ? likedBy.filter((n) => n !== likerName)
            : [...likedBy, likerName];
          const updated = {
            ...p,
            likesCount: nextLikes.length,
            likedBy: nextLikes,
          };
          sendWallPostToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleSendFamilyMessage = async (msg: FamilyMessage) => {
    setFamilyMessages((prev) => [...prev, msg]);
    // Dismiss toast immediately & mark all messages from this partner as seen
    setIncomingChatToast(null);
    const activeT = safeTravelers.find((t) => t && t.id === activeTravelerId);
    const partner = msg.travelerName === activeT?.name ? msg.familyMemberName : msg.travelerName;
    if (partner) {
      const relatedIds = (Array.isArray(familyMessages) ? familyMessages : [])
        .filter((m) => m && m.senderName && m.senderName.toLowerCase() === partner.toLowerCase())
        .map((m) => m.id);
      if (relatedIds.length > 0) {
        markMessagesAsSeen(relatedIds);
      }
    }
    await sendFamilyMessageToCloud(msg);
  };

  const handleOpenPrivateChat = (targetName: string) => {
    setActiveChatTarget(targetName);
    setIncomingChatToast(null);
    const cleanTarget = targetName.toLowerCase().trim();
    const relatedIds = familyMessages
      .filter((m) => m && m.senderName && m.senderName.toLowerCase().trim() === cleanTarget)
      .map((m) => m.id);
    if (relatedIds.length > 0) {
      markMessagesAsSeen(relatedIds);
    }
  };

  const currentLoggedInTraveler = useMemo(() => {
    return (
      safeTravelers.find((t) => t.id === travelerSessionId) ||
      safeTravelers.find((t) => t.id === activeTravelerId && activeTravelerId !== 'all') ||
      safeTravelers[0]
    );
  }, [safeTravelers, travelerSessionId, activeTravelerId]);

  const handleUpdateLocation = async (loc: LiveLocationShare) => {
    setTravelerLocation(loc);
    setFamilyLocations((prev) => {
      const filtered = prev.filter((p) => p.travelerId !== loc.travelerId);
      return [loc, ...filtered];
    });
    await sendLocationToCloud(loc);
  };

  const travelerGps = useTravelerGPS({
    travelerId: currentLoggedInTraveler?.id || 'trav-jessica',
    travelerName: currentLoggedInTraveler?.name || 'Jessica',
    onLocationUpdated: handleUpdateLocation,
  });

  const handleClearChat = async (targetPartnerName?: string) => {
    if (targetPartnerName) {
      const activeTraveler = safeTravelers.find((t) => t && t.id === activeTravelerId);
      const travelerName = activeTraveler?.name || 'Jessica';
      setFamilyMessages((prev) =>
        prev.filter((m) => {
          const isThisPair =
            (m.travelerName === targetPartnerName && m.familyMemberName === travelerName) ||
            (m.travelerName === travelerName && m.familyMemberName === targetPartnerName) ||
            (m.senderName === travelerName && (m.travelerName === targetPartnerName || m.familyMemberName === targetPartnerName)) ||
            (m.senderName === targetPartnerName && (m.travelerName === travelerName || m.familyMemberName === travelerName));
          return !isThisPair;
        })
      );
      setIncomingChatToast(null);
      await clearChatInCloud({ travelerName, targetUserName: targetPartnerName });
    } else {
      setFamilyMessages([]);
      seenMessageIdsRef.current.clear();
      setIncomingChatToast(null);
      await clearChatInCloud({ clearAll: true });
    }
  };

  // Periodic alert monitor effect
  useEffect(() => {
    const checkedAlertsKey = 'checked_alerts_set_v1';
    let alertedIds: string[] = [];
    try {
      alertedIds = JSON.parse(sessionStorage.getItem(checkedAlertsKey) || '[]');
    } catch {
      alertedIds = [];
    }

    const checkAlerts = () => {
      const now = new Date();
      tours.forEach((tour) => {
        if (!tour.alertEnabled || alertedIds.includes(tour.id)) return;
        const status = calculateTourAlertStatus(tour, now);

        if (status.isInAlertWindow) {
          alertedIds.push(tour.id);
          sessionStorage.setItem(checkedAlertsKey, JSON.stringify(alertedIds));

          if (soundEnabled) {
            playChimeSound();
          }

          sendBrowserNotification(
            `🔔 ¡Alerta de Tour! ${tour.title}`,
            `Tu tour en ${tour.city} comienza a las ${tour.time} (${tour.alertHoursBefore}h de aviso). Punto: ${
              tour.meetingPoint || tour.location
            }`,
            '/pwa-192x192.png',
            `tour-${tour.id}`
          );
        }
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tours, soundEnabled]);

  // Toggle visit mark for a traveler
  const handleToggleVisit = (tourId: string, travelerId: string) => {
    setTours((prevTours) => {
      const updated = prevTours.map((t) => {
        if (t.id !== tourId) return t;
        const currentVisited = Array.isArray(t.visitedByUserIds) ? t.visitedByUserIds : [];
        const exists = currentVisited.includes(travelerId);
        const updatedUserIds = exists
          ? currentVisited.filter((id) => id !== travelerId)
          : [...currentVisited, travelerId];
        return {
          ...t,
          visitedByUserIds: updatedUserIds,
        };
      });
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Quick change alert hours for a specific tour
  const handleQuickChangeAlert = (tourId: string, hours: number) => {
    setTours((prev) => {
      const updated = prev.map((t) => (t.id === tourId ? { ...t, alertHoursBefore: hours } : t));
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Save new or updated tour
  const handleSaveTour = (savedTour: Tour) => {
    setTours((prev) => {
      const exists = prev.some((t) => t.id === savedTour.id);
      const updated = exists
        ? prev.map((t) => (t.id === savedTour.id ? savedTour : t))
        : [...prev, savedTour];
      saveTours(updated);
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Delete tour
  const handleDeleteTour = (tourId: string) => {
    setTours((prev) => {
      const updated = prev.filter((t) => t.id !== tourId);
      saveTours(updated);
      syncToCloud({ tours: updated });
      return updated;
    });
  };

  // Update tour tickets
  const handleUpdateTourTickets = async (tourId: string, newTickets: Tour['tickets']) => {
    const cleanTickets = (newTickets || []).map((t) => ({
      ...t,
      category: 'entrada' as const,
      tourId,
    }));

    // 1. Calculate updated tours synchronously
    const currentTours = Array.isArray(tours) ? tours : [];
    const updatedTours = currentTours.map((t) =>
      t.id === tourId ? { ...t, tickets: cleanTickets } : t
    );
    setTours(updatedTours);
    saveTours(updatedTours);

    // 2. Calculate updated documents synchronously
    const currentDocs = Array.isArray(documents) ? documents : [];
    const otherDocs = currentDocs.filter(
      (d) => !(d.tourId === tourId && (d.category === 'entrada' || !d.category))
    );
    const updatedDocs = [...cleanTickets, ...otherDocs];
    setDocuments(updatedDocs);
    saveDocuments(updatedDocs);

    if (activeTicketTour?.id === tourId) {
      setActiveTicketTour((prev) => (prev ? { ...prev, tickets: cleanTickets } : null));
    }

    // 3. Persist directly to Cloudflare D1
    setSyncState((prev) => ({ ...prev, status: 'syncing' }));

    try {
      // Direct insertion of each ticket into D1 documents table
      for (const ticket of cleanTickets) {
        await uploadDocumentToCloud(ticket);
      }

      // Sync overall state to Cloudflare D1
      const success = await syncToCloud({
        tours: updatedTours,
        documents: updatedDocs,
      });

      if (success) {
        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      } else {
        setSyncState({ status: navigator.onLine ? 'error' : 'offline' });
      }
    } catch (err) {
      console.error('Error syncing tour tickets to D1:', err);
      setSyncState({ status: 'error' });
    }
  };

  // Update Traveler Passport / Profile
  const handleUpdateTraveler = (updatedTraveler: Traveler) => {
    setTravelers((prev) => {
      const updated = prev.map((t) => (t.id === updatedTraveler.id ? updatedTraveler : t));
      saveTravelers(updated);
      saveTravelerToCloud(updatedTraveler);
      return updated;
    });
  };

  // Add or Update Document
  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id);
      const updated = [newDoc, ...filtered];
      saveDocuments(updated);
      uploadDocumentToCloud(newDoc);
      syncToCloud({ documents: updated });
      return updated;
    });
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== docId);
      saveDocuments(updated);
      deleteDocumentFromCloud(docId);
      syncToCloud({ documents: updated });
      return updated;
    });
  };

  // Global default alert hours save
  const handleSaveDefaultAlertHours = (hours: number, applyToAll: boolean) => {
    setDefaultAlertHours(hours);
    if (applyToAll) {
      setTours((prev) => {
        const updated = prev.map((t) => ({ ...t, alertHoursBefore: hours }));
        syncToCloud({ tours: updated });
        return updated;
      });
    }
  };

  // Reset to original brochure
  const handleResetDefaults = () => {
    if (
      window.confirm(
        '¿Deseas restaurar el itinerario original de 13 días del brochure (Madrid, Toledo, Segovia, Ávila y Barcelona)?'
      )
    ) {
      const defaults = resetToBrochureDefaults();
      setTravelers(defaults.travelers);
      setTours(defaults.tours);
      setDays(defaults.days);
      setDocuments(defaults.documents);
      syncToCloud(defaults);
    }
  };

  // Active traveler
  const activeTraveler = safeTravelers.find((t) => t.id === activeTravelerId) || safeTravelers[0] || {
    id: 'u1',
    name: 'Viajero 1',
    avatarColor: '#2563eb',
  };

  // Distinct cities for filter
  const uniqueCities = Array.from(new Set(safeTours.map((t) => t.city))).filter(Boolean);

  // Filtered tours and days
  const filteredTours = safeTours.filter((tour) => {
    if (selectedCity !== 'all' && !tour.city?.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

    const visited = Array.isArray(tour.visitedByUserIds) ? tour.visitedByUserIds : [];
    const tickets = Array.isArray(tour.tickets) ? tour.tickets : [];

    if (filterStatus === 'visited' && !visited.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'pending' && visited.includes(activeTravelerId)) {
      return false;
    }
    if (filterStatus === 'tickets' && tickets.length === 0) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tour.title?.toLowerCase().includes(q);
      const matchCity = tour.city?.toLowerCase().includes(q);
      const matchLocation = tour.location?.toLowerCase().includes(q);
      const matchMeeting = tour.meetingPoint?.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchLocation && !matchMeeting) {
        return false;
      }
    }

    return true;
  });

  const matchingDayNumbers = new Set(filteredTours.map((t) => t.dayNumber));
  const displayedDays =
    searchQuery.trim() || filterStatus !== 'all' || selectedCity !== 'all'
      ? safeDays.filter((d) => matchingDayNumbers.has(d.dayNumber))
      : safeDays;

  const handleOpenTourTickets = (tour: Tour) => {
    const currentTour = safeTours.find((t) => t && t.id === tour.id) || tour;
    const currentDocs = Array.isArray(documents) ? documents : [];
    const tourDocs = currentDocs.filter(
      (d) => d.tourId === tour.id && (d.category === 'entrada' || !d.category)
    );
    const combinedMap = new Map<string, Ticket>();
    (currentTour.tickets || []).forEach((t) => combinedMap.set(t.id, t));
    tourDocs.forEach((d) => {
      combinedMap.set(d.id, {
        id: d.id,
        tourId: d.tourId || tour.id,
        category: 'entrada',
        title: d.title,
        fileName: d.fileName || 'ticket.png',
        fileType: d.fileType || 'image',
        dataUrl: d.dataUrl,
        fileSize: d.fileSize || '100 KB',
        uploadedAt: d.uploadedAt || new Date().toISOString(),
        travelerId: d.travelerId,
        seatOrSection: d.seatOrSection,
        referenceNumber: d.referenceNumber,
        qrCodeText: d.qrCodeText,
        qrCropUrl: d.qrCropUrl,
      });
    });
    const mergedTickets = Array.from(combinedMap.values());
    setActiveTicketTour({
      ...currentTour,
      tickets: mergedTickets,
    });
  };

  const passportCount = safeTravelers.filter((t) => Boolean(t.passportDocUrl || t.passportNumber)).length;
  const flightCount = safeDocs.filter((d) => d.category === 'vuelo').length;
  const ticketCount = safeTours.reduce((acc, t) => acc + (t.tickets?.length || 0), 0);

  const currentTravelerNorm = (activeTraveler?.name || '').toLowerCase().trim();
  const unreadFamilyCount =
    activeTab === 'family'
      ? 0
      : familyMessages.filter((m) => {
          if (!m.id || seenMessageIds.has(m.id)) return false;
          const senderNorm = (m.senderName || '').toLowerCase().trim();
          if (senderNorm === currentTravelerNorm) return false;
          const travelerDest = (m.travelerName || '').toLowerCase().trim();
          const familyDest = (m.familyMemberName || '').toLowerCase().trim();
          return (
            travelerDest === currentTravelerNorm ||
            familyDest === currentTravelerNorm ||
            travelerDest === 'todos' ||
            travelerDest === 'grupo' ||
            travelerDest === 'todos los viajeros' ||
            !travelerDest
          );
        }).length;

  const handleTabChange = useCallback((tab: MainTabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'family') {
      const myName = (activeTraveler?.name || '').toLowerCase().trim();
      const unseenIds = familyMessages
        .filter((m) => {
          if (!m.id || seenMessageIdsRef.current.has(m.id)) return false;
          const sender = (m.senderName || '').toLowerCase().trim();
          if (sender === myName) return false;
          const dest1 = (m.travelerName || '').toLowerCase().trim();
          const dest2 = (m.familyMemberName || '').toLowerCase().trim();
          return dest1 === myName || dest2 === myName || dest1 === 'todos' || dest1 === 'grupo' || !dest1;
        })
        .map((m) => m.id);
      if (unseenIds.length > 0) {
        markMessagesAsSeen(unseenIds);
      }
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, [activeTraveler?.name, familyMessages, markMessagesAsSeen]);

  // Sincronizar el badge del icono del teléfono (PWA App Badge API) en tiempo real
  useEffect(() => {
    try {
      if (unreadFamilyCount > 0) {
        if ('setAppBadge' in navigator) {
          (navigator as any).setAppBadge(unreadFamilyCount).catch(() => {});
        }
      } else {
        if ('clearAppBadge' in navigator) {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }, [unreadFamilyCount]);

  useEffect(() => {
    const handleClearNativeBadge = () => {
      if ('clearAppBadge' in navigator && unreadFamilyCount === 0) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    };
    window.addEventListener('focus', handleClearNativeBadge);
    document.addEventListener('visibilitychange', handleClearNativeBadge);
    return () => {
      window.removeEventListener('focus', handleClearNativeBadge);
      document.removeEventListener('visibilitychange', handleClearNativeBadge);
    };
  }, [unreadFamilyCount]);

  // 1. If opened via family link (?familia=1 or ?familiar=1)
  if (isFamilyMode) {
    return (
      <FamilyView
        associatedTravelerName={urlTravelerName}
        travelers={travelers}
        tours={tours}
        documents={documents}
        wallPosts={wallPosts}
        familyMessages={familyMessages}
        presenceUsers={presenceUsers}
        travelerLocation={travelerGps.currentLocation || travelerLocation}
        locations={familyLocations}
        seenMessageIds={seenMessageIds}
        onAddWallPost={handleAddWallPost}
        onLikeWallPost={handleLikeWallPost}
        onSendFamilyMessage={handleSendFamilyMessage}
        onSwitchToTravelerMode={() => {
          try {
            localStorage.removeItem('tur_role');
            localStorage.removeItem('tur_traveler_session');
          } catch {}
          setTravelerSessionId(null);
          setIsFamilyMode(false);
        }}
        onMarkAsSeen={markMessagesAsSeen}
        onClearChat={handleClearChat}
      />
    );
  }

  // 2. If traveler has not entered 3-digit PIN yet
  if (!travelerSessionId) {
    return (
      <LandingGateway
        travelers={travelers}
        onLoginTraveler={handleLoginTraveler}
        onContinueAsGuestFamily={() => {
          try {
            localStorage.setItem('tur_role', 'family');
          } catch {}
          setIsFamilyMode(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans pb-20 md:pb-12 overflow-x-hidden max-w-full w-full">
      {/* Top sticky navigation */}
      <Navbar
        travelers={travelers}
        activeTravelerId={activeTravelerId}
        onSelectActiveTraveler={setActiveTravelerId}
        onOpenTravelersModal={() => setIsTravelersModalOpen(true)}
        onOpenAlertSettings={() => setIsAlertModalOpen(true)}
        onOpenAddTourModal={() => {
          setEditingTour(null);
          setSelectedDayForNewTour(1);
          setIsAddTourModalOpen(true);
        }}
        tours={tours}
        defaultAlertHours={defaultAlertHours}
        syncState={syncState}
        onManualSync={triggerCloudSync}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onLogout={handleLogoutTraveler}
        isGpsTracking={travelerGps.isTracking}
        onToggleGpsTracking={travelerGps.toggleTracking}
        travelerSessionId={travelerSessionId}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* System Mobile Notification Prompt Banner */}
        {!hasNotificationPermission && !dismissNotificationBanner && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-950 p-3.5 sm:p-4 rounded-2xl shadow-md border border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-stone-950 flex items-center gap-1.5">
                  🔔 Activa las Notificaciones y Sonido en tu Celular
                </h4>
                <p className="text-[11px] text-amber-950 font-medium leading-tight mt-0.5">
                  Toca el botón negro para permitir las alertas de tours y mensajes de chat en la barra de tu teléfono.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={async () => {
                  // Direct user gesture: play sound immediately & request permission
                  playChimeSound();
                  const perm = await requestNotificationPermission();
                  if (perm === 'granted') {
                    setHasNotificationPermission(true);
                    const currentT =
                      safeTravelers.find((t) => t && t.id === travelerSessionId) ||
                      safeTravelers.find((t) => t && t.id === activeTravelerId && activeTravelerId !== 'all') ||
                      safeTravelers[0];
                    await subscribeToWebPush(currentT?.id, currentT?.name);
                    await triggerServerPushTest();
                    sendBrowserNotification(
                      '🔔 ¡Notificaciones y Sonido Activados!',
                      'Tu teléfono ahora recibirá todas las alertas de tours y mensajes en vivo.',
                      '/pwa-192x192.png'
                    );
                  } else {
                    setIsAlertModalOpen(true);
                  }
                }}
                className="px-4 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-400 font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Activar y Probar Sonido 🔊</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissNotificationBanner(true);
                  sessionStorage.setItem('tur_dismiss_notif_banner', 'true');
                }}
                className="p-1.5 text-stone-900/60 hover:text-stone-950 rounded-lg hover:bg-amber-400/30 transition cursor-pointer"
                title="Ocultar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: ITINERARIO DE 13 DÍAS */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {/* GPS en Vivo para el Viajero hacia sus Familiares */}
            <TravelerGPSWidget
              isTracking={travelerGps.isTracking}
              currentLocation={travelerGps.currentLocation}
              accuracy={travelerGps.accuracy}
              lastSyncTime={travelerGps.lastSyncTime}
              error={travelerGps.error}
              travelerName={currentLoggedInTraveler?.name || 'Viajero'}
              travelerColor={currentLoggedInTraveler?.avatarColor || '#d97706'}
              onToggleTracking={travelerGps.toggleTracking}
              onRefreshLocation={travelerGps.refreshLocation}
            />

            {/* Cuenta Regresiva Vuelo Costa Rica -> España */}
            <FlightCountdown onViewFlights={() => setActiveTab('flights')} />

            {/* Active Alert Banner for Incoming Tours (Solo en Itinerario) */}
            <AlertBanner
              tours={tours}
              defaultAlertHours={defaultAlertHours}
              onOpenAlertSettings={() => setIsAlertModalOpen(true)}
              onOpenTickets={handleOpenTourTickets}
              activeTravelerId={travelerSessionId || activeTravelerId}
            />

            {/* Search & Filter Header Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar tour, museo, ciudad o punto de encuentro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por ciudad"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 text-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Todas las Ciudades</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Todos ({tours.length})
                  </button>

                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'pending'
                        ? 'bg-white text-amber-700 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Pendientes
                  </button>

                  <button
                    onClick={() => setFilterStatus('visited')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterStatus === 'visited'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Completados
                  </button>
                </div>
              </div>
            </div>

            {/* List of Days & Tours */}
            <div className="space-y-5">
              {displayedDays.length > 0 ? (
                displayedDays.map((day) => {
                  const dayTours = filteredTours.filter((t) => t.dayNumber === day.dayNumber);
                  return (
                    <DaySection
                      key={day.dayNumber}
                      day={day}
                      tours={dayTours}
                      travelers={travelers}
                      activeTravelerId={travelerSessionId || activeTravelerId}
                      documents={documents}
                      onToggleVisit={handleToggleVisit}
                      onEditTour={(tour) => {
                        setEditingTour(tour);
                        setSelectedDayForNewTour(tour.dayNumber);
                        setIsAddTourModalOpen(true);
                      }}
                      onDeleteTour={handleDeleteTour}
                      onOpenTickets={handleOpenTourTickets}
                      onQuickChangeAlert={handleQuickChangeAlert}
                      onAddNewTourToDay={(dayNumber) => {
                        setEditingTour(null);
                        setSelectedDayForNewTour(dayNumber);
                        setIsAddTourModalOpen(true);
                      }}
                      onUpdateTourTickets={handleUpdateTourTickets}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-stone-800">No se encontraron actividades</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Prueba ajustando los filtros o el término de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                      setSelectedCity('all');
                    }}
                    className="mt-4 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VUELOS & PASAJES DE AVIÓN */}
        {activeTab === 'flights' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <FlightSection
              travelers={travelers}
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              activeTravelerId={activeTravelerId}
              onSelectTraveler={setActiveTravelerId}
            />
          </div>
        )}

        {/* TAB 3: PASAPORTES & DOCUMENTACIÓN */}
        {activeTab === 'passports' && (
          <div className="animate-in fade-in duration-200">
            <PassportSection
              travelers={travelers}
              documents={documents}
              onUpdateTraveler={handleUpdateTraveler}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddTraveler={(name, color) => {
                const newT: Traveler = {
                  id: `u-${Date.now()}`,
                  name,
                  avatarColor: color,
                };
                setTravelers((prev) => [...prev, newT]);
                saveTravelerToCloud(newT);
              }}
              activeTravelerId={activeTravelerId}
              onSelectTraveler={setActiveTravelerId}
            />
          </div>
        )}

        {/* TAB 4: ENTRADAS & RESERVAS */}
        {activeTab === 'tickets' && (
          <div className="animate-in fade-in duration-200">
            <TicketsHubSection
              tours={tours}
              travelers={travelers}
              documents={documents}
              days={days}
              activeTravelerId={travelerSessionId || activeTravelerId}
              onOpenTourTickets={handleOpenTourTickets}
              onUpdateTourTickets={handleUpdateTourTickets}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        )}

        {/* TAB: CONTROL DE GASTOS */}
        {activeTab === 'expenses' && (
          <div className="animate-in fade-in duration-200">
            <ExpensesTrackerSection
              expenses={expenses}
              travelers={travelers}
              activeTravelerId={activeTravelerId}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onClearExpenses={handleClearExpenses}
            />
          </div>
        )}

        {/* TAB 5: MURO & FAMILIA EN VIVO */}
        {activeTab === 'family' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Share Family Link Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-stone-950 p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-950/20 flex items-center justify-center text-2xl shadow-inner">
                  👨‍👩‍👧‍👦
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">Muro & Acompañamiento Familiar</h2>
                  <p className="text-xs text-amber-100">
                    Comparte tu enlace con tus familiares para que sigan tu vuelo, vean las fotos y chateen contigo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="share-btn-glow px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black shadow-xl transition flex items-center gap-2.5 cursor-pointer shrink-0 border-2 border-amber-200 ring-4 ring-amber-400/20 active:scale-95"
              >
                <Share2 className="w-5 h-5 text-stone-950 shrink-0 animate-bounce" />
                <span className="tracking-wide uppercase font-black">Compartir Link a Familiares</span>
              </button>
            </div>

            {/* Live Wall Feed & Chat History */}
            <LiveWallSection
              currentUser={{
                name: safeTravelers.find((t) => t && t.id === activeTravelerId)?.name || 'Jessica',
                type: 'traveler',
                color: safeTravelers.find((t) => t && t.id === activeTravelerId)?.avatarColor || '#f59e0b',
              }}
              posts={wallPosts}
              presenceUsers={presenceUsers}
              messages={familyMessages}
              travelers={safeTravelers}
              seenMessageIds={seenMessageIds}
              onAddPost={handleAddWallPost}
              onLikePost={handleLikeWallPost}
              onOpenPrivateChat={handleOpenPrivateChat}
              onClearAllChats={() => handleClearChat()}
              onClearConversation={(partnerName) => handleClearChat(partnerName)}
              onMarkAsSeen={markMessagesAsSeen}
            />
          </div>
        )}

        {/* TAB 6: GRUPO / VIAJEROS */}
        {activeTab === 'travelers' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Grupo de Viajeros</h2>
                  <p className="text-xs text-purple-200">
                    5 Pasajeros: Jessica, Mayela, Vilma, Mercedes y Angelica
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTravelersModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-purple-950 bg-purple-200 hover:bg-purple-100 rounded-xl shadow-sm transition"
              >
                Editar Nombres
              </button>
            </div>

            <GroupSummary
              travelers={safeTravelers}
              tours={safeTours}
              activeTravelerId={activeTravelerId}
              onSelectActiveTraveler={setActiveTravelerId}
            />
          </div>
        )}

        {/* Bottom Actions and Reset */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>TurEuropa • Sistema Online Sincronizado</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas salir de la sesión actual del viajero?')) {
                  handleLogoutTraveler();
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-stone-700 hover:text-rose-700 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 text-xs"
              title="Cerrar sesión y cambiar de viajero"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Cerrar Sesión / Salir</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Itinerario Oficial del Brochure</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Offline Sync Indicator */}
      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        ticketCount={ticketCount}
        flightCount={flightCount}
        passportCount={passportCount}
        unreadFamilyCount={unreadFamilyCount}
      />

      {/* Incoming Chat Notification Toast */}
      {incomingChatToast && (
        <IncomingChatToast
          senderName={incomingChatToast.senderName}
          messagePreview={incomingChatToast.text}
          onAcceptChat={() => {
            const senderMsgs = (Array.isArray(familyMessages) ? familyMessages : [])
              .filter((m) => m && m.senderName && m.senderName.toLowerCase() === incomingChatToast.senderName.toLowerCase())
              .map((m) => m.id);
            markMessagesAsSeen([...senderMsgs, incomingChatToast.id]);
            setActiveChatTarget(incomingChatToast.senderName);
            setIncomingChatToast(null);
          }}
          onDismiss={() => {
            if (incomingChatToast.id) {
              const senderMsgs = (Array.isArray(familyMessages) ? familyMessages : [])
                .filter((m) => m && m.senderName && m.senderName.toLowerCase() === incomingChatToast.senderName.toLowerCase())
                .map((m) => m.id);
              markMessagesAsSeen([...senderMsgs, incomingChatToast.id]);
            }
            setIncomingChatToast(null);
          }}
        />
      )}

      {/* Private 1-on-1 Chat Modal with Voice Notes & Location */}
      {activeChatTarget && (
        <PrivateChatModal
          isOpen={Boolean(activeChatTarget)}
          onClose={() => setActiveChatTarget(null)}
          currentUser={{
            name: safeTravelers.find((t) => t && t.id === activeTravelerId)?.name || 'Jessica',
            type: 'traveler',
            color: safeTravelers.find((t) => t && t.id === activeTravelerId)?.avatarColor || '#f59e0b',
          }}
          targetUserName={activeChatTarget}
          messages={familyMessages}
          onSendMessage={handleSendFamilyMessage}
          travelerLocation={travelerGps.currentLocation || travelerLocation}
          onUpdateLocation={handleUpdateLocation}
          onMarkAsSeen={markMessagesAsSeen}
          onClearChat={(target) => handleClearChat(target)}
          travelers={safeTravelers}
          seenMessageIds={seenMessageIds}
        />
      )}

      {/* Share Link to WhatsApp Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-stone-900">Enlace de Acompañamiento Familiar</h3>
            <p className="text-xs text-stone-500 mb-4">
              Envía este enlace por WhatsApp a tus familiares. Podrán ver tu vuelo, las fotos del muro y chatear contigo directamente.
            </p>

            {(() => {
              const activeT = safeTravelers.find((t) => t && t.id === activeTravelerId);
              const isLocal = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
              const baseUrl = isLocal ? window.location.origin : 'https://tureuropa.pages.dev';
              const shareUrl = `${baseUrl}/?familia=1&viajero=${encodeURIComponent(activeT?.name || 'Jessica')}`;
              const whatsappText = `✈️ ¡Hola! Les comparto el portal familiar en vivo para que sigan nuestro vuelo, vean nuestras fotos y conversemos en tiempo real: ${shareUrl}`;
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-mono break-all text-stone-700 text-left">
                    {shareUrl}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Botón WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] font-black text-xs sm:text-sm text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Botón Compartir (Nativo del celular) */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          try {
                            await navigator.share({
                              title: 'España 2026 - Acompañamiento Familiar',
                              text: whatsappText,
                              url: shareUrl,
                            });
                          } catch {}
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          setCopyLinkSuccess(true);
                          setTimeout(() => setCopyLinkSuccess(false), 2000);
                        }
                      }}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs sm:text-sm text-white transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir</span>
                    </button>
                  </div>

                  {/* Botón Copiar Link */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setCopyLinkSuccess(true);
                      setTimeout(() => setCopyLinkSuccess(false), 2000);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold text-xs text-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copyLinkSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                    <span>{copyLinkSuccess ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Link'}</span>
                  </button>
                </div>
              );
            })()}

            <div className="pt-3 mt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition cursor-pointer shadow-md shadow-red-600/20 flex items-center gap-1.5 border border-red-500 active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TravelersModal
        isOpen={isTravelersModalOpen}
        onClose={() => setIsTravelersModalOpen(false)}
        travelers={travelers}
        onSaveTravelers={(updatedTravelers) => {
          setTravelers(updatedTravelers);
          syncToCloud({ travelers: updatedTravelers });
        }}
      />

      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        defaultAlertHours={defaultAlertHours}
        soundEnabled={soundEnabled}
        onSaveAlertHours={handleSaveDefaultAlertHours}
        onToggleSound={setSoundEnabled}
      />

      <AddTourModal
        isOpen={isAddTourModalOpen}
        onClose={() => {
          setIsAddTourModalOpen(false);
          setEditingTour(null);
        }}
        days={days && days.length > 0 ? days : INITIAL_DAYS}
        onSaveTour={handleSaveTour}
        editingTour={editingTour}
        initialDayNumber={selectedDayForNewTour}
        defaultDayNumber={selectedDayForNewTour}
        defaultAlertHours={defaultAlertHours}
      />

      {activeTicketTour && (
        <TicketModal
          isOpen={Boolean(activeTicketTour)}
          onClose={() => setActiveTicketTour(null)}
          tour={activeTicketTour}
          travelers={travelers}
          activeTravelerId={travelerSessionId || activeTravelerId}
          onUpdateTourTickets={handleUpdateTourTickets}
        />
      )}
    </div>
  );
}
