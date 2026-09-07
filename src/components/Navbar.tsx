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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Top Primary Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Subtitle */}
          <div 
            onClick={() => onChangeTab('itinerary')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 border border-amber-400/50 p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/icon.svg"
                alt="TurMadrid Logo"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-none">
                  TurMadrid
                </h1>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-200">
                  13 Días
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium leading-tight mt-0.5 hidden sm:block">
                Madrid, Toledo, Ávila, Segovia & Barcelona
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => onChangeTab('itinerary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'itinerary'
                  ? 'bg-white text-amber-700 shadow-2xs'
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
                  ? 'bg-white text-amber-700 shadow-2xs'
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
                  ? 'bg-white text-amber-700 shadow-2xs'
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
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Entradas</span>
            </button>
          </div>

          {/* Action Buttons: Status, Download Arrow, Alerts & Add Tour */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CloudSyncBadge syncState={syncState} onManualSync={onManualSync} />
            
            {/* Botón de la flechita para descargar la aplicación */}
            <PWAInstallButton variant="header-arrow" />

            <button
              type="button"
              onClick={onOpenTravelersModal}
              className="p-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 sm:hidden flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
              title="Configurar los 5 viajeros"
            >
              <Users className="w-3.5 h-3.5 text-stone-600" />
            </button>

            <button
              type="button"
              onClick={onOpenAlertSettings}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={`Alertas configuradas a ${defaultAlertHours}h antes`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-bold hidden md:inline">Alertas ({defaultAlertHours}h)</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddTourModal}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer text-xs"
              title="Agregar nueva actividad o tour"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Tour</span>
            </button>
          </div>
        </div>

        {/* Second Row: 5 Travelers Fully Visible + Quick Progress on larger screens */}
        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between gap-2">
          {/* 5 Travelers grid/flex taking full available width */}
          <div className="grid grid-cols-5 sm:flex sm:items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 shrink-0 mr-1 hidden md:inline">
              Viajero:
            </span>

            {safeTravelers.map((traveler) => {
              const isSelected = traveler.id === activeTravelerId;
              return (
                <button
                  key={traveler.id}
                  type="button"
                  onClick={() => onSelectActiveTraveler(traveler.id)}
                  className={`w-full sm:w-auto px-1 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 transition-all cursor-pointer min-w-0 ${
                    isSelected
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : 'bg-stone-100/90 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 font-medium'
                  }`}
                  title={`Cambiar a ${traveler.name}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: traveler.avatarColor }}
                  />
                  <span className="truncate max-w-full">{traveler.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenTravelersModal}
              className="hidden sm:flex p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
              title="Editar los 5 viajeros"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Progress Badge */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 text-right">
            <span className="text-[11px] font-bold text-stone-600">
              <span className="font-extrabold text-stone-900">{activeUserVisitedCount}</span>/{totalTours} ({progressPercent}%)
            </span>
            <div className="w-16 sm:w-20 bg-stone-200 rounded-full h-1.5 overflow-hidden">
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
