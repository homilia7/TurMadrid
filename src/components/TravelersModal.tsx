import React, { useState } from 'react';
import { Traveler } from '../types';
import { Users, Check, X, Palette } from 'lucide-react';

interface TravelersModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelers: Traveler[];
  onSave: (travelers: Traveler[]) => void;
  activeTravelerId: string;
  onSelectActiveTraveler: (id: string) => void;
}

const COLOR_OPTIONS = [
  '#2563eb', // Blue
  '#16a34a', // Green
  '#d97706', // Amber/Orange
  '#9333ea', // Purple
  '#e11d48', // Rose/Red
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#c026d3', // Fuchsia
  '#ea580c', // Orange
];

export const TravelersModal: React.FC<TravelersModalProps> = ({
  isOpen,
  onClose,
  travelers,
  onSave,
  activeTravelerId,
  onSelectActiveTraveler,
}) => {
  const [editedTravelers, setEditedTravelers] = useState<Traveler[]>(travelers);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...editedTravelers];
    updated[index] = { ...updated[index], name: newName };
    setEditedTravelers(updated);
  };

  const handleColorSelect = (index: number, color: string) => {
    const updated = [...editedTravelers];
    updated[index] = { ...updated[index], avatarColor: color };
    setEditedTravelers(updated);
    setEditingColorIndex(null);
  };

  const handleSave = () => {
    onSave(editedTravelers);
    onClose();
  };

  const handlePresetNames = (preset: 'grupo' | 'familia' | 'numeros') => {
    let names: string[] = [];
    if (preset === 'grupo') {
      names = ['Jessica', 'Mayela', 'Vilma', 'Mercedes', 'Angelica'];
    } else if (preset === 'familia') {
      names = ['Papá', 'Mamá', 'Hijo/a 1', 'Hijo/a 2', 'Abuelo/a'];
    } else {
      names = ['Jessica', 'Mayela', 'Vilma', 'Mercedes', 'Angelica'];
    }

    const updated = editedTravelers.map((t, idx) => ({
      ...t,
      name: names[idx] || t.name,
    }));
    setEditedTravelers(updated);
  };

  return (
    <div id="travelers-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div id="travelers-modal-card" className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Configurar los 5 Viajeros</h3>
              <p className="text-xs text-stone-500">Personaliza el nombre y color de cada uno de los 5 integrantes del viaje</p>
            </div>
          </div>
          <button
            id="close-travelers-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick presets */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Plantillas rápidas:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetNames('grupo')}
                className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
              >
                Grupo España
              </button>
              <button
                type="button"
                onClick={() => handlePresetNames('familia')}
                className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
              >
                Familia
              </button>
              <button
                type="button"
                onClick={() => handlePresetNames('numeros')}
                className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
              >
                Viajero 1-5
              </button>
            </div>
          </div>

          {/* List of 5 travelers */}
          <div className="space-y-3">
            {editedTravelers.map((traveler, index) => {
              const isActive = traveler.id === activeTravelerId;
              return (
                <div
                  key={traveler.id}
                  id={`traveler-row-${traveler.id}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive ? 'border-amber-400 bg-amber-50/40' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar Circle / Color Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEditingColorIndex(editingColorIndex === index ? null : index)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs transition-transform active:scale-95"
                        style={{ backgroundColor: traveler.avatarColor }}
                        title="Cambiar color"
                      >
                        {traveler.name ? traveler.name.substring(0, 2).toUpperCase() : `V${index + 1}`}
                      </button>

                      {editingColorIndex === index && (
                        <div className="absolute top-12 left-0 z-20 bg-white p-2 rounded-xl shadow-xl border border-stone-200 flex flex-wrap gap-1.5 w-44">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleColorSelect(index, c)}
                              className="w-6 h-6 rounded-full border border-white shadow-xs transition-transform hover:scale-110"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Name input */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                        Viajero #{index + 1}
                      </label>
                      <input
                        id={`input-traveler-name-${traveler.id}`}
                        type="text"
                        value={traveler.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder={`Nombre del Viajero ${index + 1}`}
                        className="w-full text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                      />
                    </div>

                    {/* Active toggle button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectActiveTraveler(traveler.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        title="Elegir como usuario activo en la pantalla principal"
                      >
                        {isActive ? 'Activo' : 'Seleccionar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            id="save-travelers-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
