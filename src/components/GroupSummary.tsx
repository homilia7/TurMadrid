import React from 'react';
import { Traveler, Tour } from '../types';
import { Users, Award } from 'lucide-react';

interface GroupSummaryProps {
  travelers: Traveler[];
  tours: Tour[];
  activeTravelerId: string;
  onSelectActiveTraveler: (id: string) => void;
}

export const GroupSummary: React.FC<GroupSummaryProps> = ({
  travelers,
  tours,
  activeTravelerId,
  onSelectActiveTraveler,
}) => {
  const safeTours = Array.isArray(tours) ? tours : [];
  const safeTravelers = Array.isArray(travelers) ? travelers : [];
  const totalTours = safeTours.length;

  const travelerStats = safeTravelers.map((traveler) => {
    const visited = safeTours.filter((t) => (t.visitedByUserIds || []).includes(traveler.id)).length;
    const percent = totalTours > 0 ? Math.round((visited / totalTours) * 100) : 0;
    return {
      traveler,
      visited,
      percent,
    };
  });

  const allVisitedTours = safeTours.filter((t) => (t.visitedByUserIds || []).length === 5);

  return (
    <div id="group-summary-card" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Progreso Grupal de los 5 Viajeros
          </h3>
          <p className="text-xs text-stone-500">
            Seguimiento en tiempo real de los lugares visitados por cada integrante
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>
            {allVisitedTours.length} de {totalTours} lugares completados por los 5
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
        {travelerStats.map(({ traveler, visited, percent }) => {
          const isActive = traveler.id === activeTravelerId;
          return (
            <div
              key={traveler.id}
              onClick={() => onSelectActiveTraveler(traveler.id)}
              className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                isActive
                  ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                  : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm shadow-xs mb-2"
                style={{ backgroundColor: traveler.avatarColor }}
              >
                {traveler.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="text-xs font-bold text-stone-900 truncate" title={traveler.name}>
                {traveler.name}
              </div>

              <div className="text-[11px] font-semibold text-stone-500 mt-1">
                {visited} / {totalTours}
              </div>

              <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: traveler.avatarColor,
                  }}
                />
              </div>

              <div className="text-[10px] font-bold text-stone-600 mt-1">{percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
