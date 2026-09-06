import React from 'react';
import { Traveler, Tour } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Users,
  Bell,
  Plus,
  MapPin,
  CheckCircle2,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface NavbarProps {
  travelers: Traveler[];
  activeTravelerId: string;
  onSelectActiveTraveler: (id: string) => void;
  onOpenTravelersModal: () => void;
  onOpenAlertSettings: () => void;
  onOpenAddTourModal: () => void;
  tours: Tour[];
  defaultAlertHours: number;
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
}) => {
  const activeTraveler = travelers.find((t) => t.id === activeTravelerId) || travelers[0];
  const activeUserVisitedCount = tours.filter((t) =>
    t.visitedByUserIds.includes(activeTravelerId)
  ).length;

  const totalTours = tours.length;
  const progressPercent = totalTours > 0 ? Math.round((activeUserVisitedCount / totalTours) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Trip Title with Costa Rica & Spain Airplane Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* App Logo: Airplane with CR & ES Flags */}
              <div className="w-11 h-11 rounded-2xl bg-stone-900 border border-amber-400/40 p-1 flex items-center justify-center text-white shadow-xs overflow-hidden shrink-0 group hover:scale-105 transition-transform">
                <img
                  src="/icon.svg"
                  alt="Costa Rica a España 2026 Logo"
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-1.5">
                    <span>España 2026</span>
                    <span className="text-xs font-normal text-stone-400">🇨🇷✈️🇪🇸</span>
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200/80">
                    13 Días • 5 Viajeros
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  Madrid, Toledo, Ávila, Segovia & Barcelona
                </p>
              </div>
            </div>

            {/* Mobile action shortcuts */}
            <div className="flex items-center gap-1.5 md:hidden">
              <PWAInstallButton variant="nav" />
              <button
                type="button"
                onClick={onOpenAlertSettings}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 relative"
                title="Alertas"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              </button>
              <button
                type="button"
                onClick={onOpenAddTourModal}
                className="p-2 rounded-xl bg-amber-500 text-white shadow-xs"
                title="Nuevo Tour"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center / Right: Traveler Switcher (5 users) and Global Controls */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
            {/* 5 Travelers quick picker */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto max-w-full">
              <div className="text-[11px] font-bold text-stone-500 pl-1.5 pr-1 flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Viajero:</span>
              </div>

              {travelers.map((traveler) => {
                const isSelected = traveler.id === activeTravelerId;
                return (
                  <button
                    key={traveler.id}
                    type="button"
                    onClick={() => onSelectActiveTraveler(traveler.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
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
                    <span className="max-w-[75px] sm:max-w-[100px] truncate">{traveler.name}</span>
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

            {/* Desktop Buttons: PWA Download, Alertas + Agregar Tour */}
            <div className="hidden md:flex items-center gap-2">
              <PWAInstallButton variant="nav" />

              <button
                id="btn-nav-alert-settings"
                type="button"
                onClick={onOpenAlertSettings}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Configurar avisos antes del tour"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>Alertas ({defaultAlertHours}h)</span>
              </button>

              <button
                id="btn-nav-add-tour"
                type="button"
                onClick={onOpenAddTourModal}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Tour</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Progress Bar */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">
              Progreso de <span style={{ color: activeTraveler.avatarColor }}>{activeTraveler.name}</span>:
            </span>
            <span className="font-mono font-bold text-stone-900">
              {activeUserVisitedCount} de {totalTours} lugares visitados
            </span>
            <span className="text-amber-600 font-bold">({progressPercent}%)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 w-40">
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
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
