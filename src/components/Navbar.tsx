import React from 'react';
import { Traveler, Tour, CloudSyncState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { CloudSyncBadge } from './CloudSyncBadge';
import {
  Users,
  Bell,
  Plus,
  Calendar,
  Plane,
  ShieldCheck,
  Ticket,
  SlidersHorizontal,
} from 'lucide-react';
import { MainTabType } from './MobileBottomNav';

interface NavbarProps {
  travelers: Traveler[];
  activeTravelerId: string;
  onSelectActiveTraveler: (id: string) => void;
  onOpenTravelersModal: () => void;
  onOpenAlertSettings: () => void;
  onOpenAddTourModal: () => void;
  tours: Tour[];
  defaultAlertHours: number;
  syncState: CloudSyncState;
  onManualSync: () => void;
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  travelers,
  activeTravelerId,
  onSelectActiveTraveler,
  onOpenTravelersModal,
  onOpenAlertSettings,
  onOpenAddTourModal,
  tours,
  defaultAlertHours,
  syncState,
  onManualSync,
  activeTab,
  onChangeTab,
}) => {
  const safeTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : [];
  const safeTours = Array.isArray(tours) ? tours : [];
  const activeTraveler =
    safeTravelers.find((t) => t.id === activeTravelerId) ||
    safeTravelers[0] ||
    ({ id: 'u1', name: 'Viajero 1', avatarColor: '#2563eb' } as Traveler);

  const activeUserVisitedCount = safeTours.filter((t) =>
    (t.visitedByUserIds || []).includes(activeTravelerId)
  ).length;

  const totalTours = safeTours.length;
  const progressPercent = totalTours > 0 ? Math.round((activeUserVisitedCount / totalTours) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Trip Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* App Logo */}
              <div 
                onClick={() => onChangeTab('itinerary')}
                className="w-10 h-10 rounded-2xl bg-stone-900 border border-amber-400/40 p-1 flex items-center justify-center text-white shadow-xs overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                <img
                  src="/icon.svg"
                  alt="Costa Rica a España 2026 Logo"
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 
                    onClick={() => onChangeTab('itinerary')}
                    className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>TurMadrid</span>
                    <span className="text-xs font-normal text-stone-400">🇨🇷✈️🇪🇸</span>
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200/80">
                    13 Días • 5 Viajeros
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-stone-500 font-medium truncate max-w-[200px] sm:max-w-none">
                    Madrid, Toledo, Ávila, Segovia & Barcelona
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Cloud Status & Quick Buttons */}
            <div className="flex items-center gap-1.5 md:hidden">
              <CloudSyncBadge syncState={syncState} onManualSync={onManualSync} />
              <button
                type="button"
                onClick={onOpenAlertSettings}
                className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 relative"
                title="Alertas"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAddTourModal}
                className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs"
                title="Nuevo Tour"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => onChangeTab('itinerary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'itinerary'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Itinerario</span>
            </button>

            <button
              onClick={() => onChangeTab('flights')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'flights'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Vuelos</span>
            </button>

            <button
              onClick={() => onChangeTab('passports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'passports'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pasaportes</span>
            </button>

            <button
              onClick={() => onChangeTab('tickets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Entradas</span>
            </button>
          </div>

          {/* Center / Right: Traveler Switcher & Global Controls */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
            {/* 5 Travelers quick picker */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto max-w-full">
              <div className="text-[11px] font-bold text-stone-500 pl-1.5 pr-1 flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden lg:inline">Viajero:</span>
              </div>

              {travelers.map((traveler) => {
                const isSelected = traveler.id === activeTravelerId;
                return (
                  <button
                    key={traveler.id}
                    type="button"
                    onClick={() => onSelectActiveTraveler(traveler.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-300 font-bold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                    title={`Ver y marcar como ${traveler.name}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: traveler.avatarColor }}
                    />
                    <span className="max-w-[70px] sm:max-w-[90px] truncate">{traveler.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onOpenTravelersModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors ml-0.5"
                title="Editar nombres de los 5 viajeros"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Buttons: Cloudflare Status, PWA, Alertas + Agregar Tour */}
            <div className="hidden md:flex items-center gap-2">
              <CloudSyncBadge syncState={syncState} onManualSync={onManualSync} />
              <PWAInstallButton variant="nav" />

              <button
                type="button"
                onClick={onOpenAlertSettings}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Configurar avisos antes del tour"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>Alertas ({defaultAlertHours}h)</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddTourModal}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Progress Bar */}
        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">
              Progreso de <span style={{ color: activeTraveler.avatarColor }}>{activeTraveler.name}</span>:
            </span>
            <span className="font-mono font-bold text-stone-900">
              {activeUserVisitedCount} de {totalTours} lugares visitados
            </span>
            <span className="text-amber-600 font-bold">({progressPercent}%)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 w-36">
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: activeTraveler.avatarColor || '#f59e0b',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
