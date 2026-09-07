import React from 'react';
import { Calendar, Plane, ShieldCheck, Ticket, Users } from 'lucide-react';

export type MainTabType = 'itinerary' | 'flights' | 'passports' | 'tickets' | 'travelers';

interface MobileBottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  ticketCount: number;
  flightCount: number;
  passportCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  ticketCount,
  flightCount,
  passportCount,
}) => {
  const tabs = [
    { id: 'itinerary' as MainTabType, label: 'Itinerario', icon: Calendar, badge: null },
    { id: 'flights' as MainTabType, label: 'Vuelos', icon: Plane, badge: flightCount > 0 ? flightCount : null },
    { id: 'passports' as MainTabType, label: 'Pasaportes', icon: ShieldCheck, badge: passportCount > 0 ? passportCount : null },
    { id: 'tickets' as MainTabType, label: 'Entradas', icon: Ticket, badge: ticketCount > 0 ? ticketCount : null },
    { id: 'travelers' as MainTabType, label: 'Grupo', icon: Users, badge: null },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-gray-500 font-medium hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
