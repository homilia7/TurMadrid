import React, { useState, useRef } from 'react';
import { Traveler } from '../types';
import { 
  ShieldCheck, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  FileText, 
  Calendar, 
  Globe, 
  Phone,
  Camera
} from 'lucide-react';

interface PassportSectionProps {
  travelers: Traveler[];
  onUpdateTraveler: (traveler: Traveler) => void;
  onAddTraveler: (name: string, color: string) => void;
  activeTravelerId: string;
  onSelectTraveler: (id: string) => void;
}

export const PassportSection: React.FC<PassportSectionProps> = ({
  travelers,
  onUpdateTraveler,
  activeTravelerId,
}) => {
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>(activeTravelerId || travelers[0]?.id || 'u1');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);

  const activeTraveler = travelers.find((t) => t.id === selectedTravelerId) || travelers[0];

  const [formName, setFormName] = useState(activeTraveler?.name || '');
  const [formPassportNumber, setFormPassportNumber] = useState(activeTraveler?.passportNumber || '');
  const [formPassportExpiry, setFormPassportExpiry] = useState(activeTraveler?.passportExpiry || '');
  const [formNationality, setFormNationality] = useState(activeTraveler?.nationality || 'Costarricense');
  const [formEmergencyContact, setFormEmergencyContact] = useState(activeTraveler?.emergencyContact || '');
  const [formNotes, setFormNotes] = useState(activeTraveler?.notes || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTraveler = (id: string) => {
    setSelectedTravelerId(id);
    const target = travelers.find((t) => t.id === id);
    if (target) {
      setFormName(target.name);
      setFormPassportNumber(target.passportNumber || '');
      setFormPassportExpiry(target.passportExpiry || '');
      setFormNationality(target.nationality || 'Costarricense');
      setFormEmergencyContact(target.emergencyContact || '');
      setFormNotes(target.notes || '');
      setIsEditing(false);
    }
  };

  const handleSaveDetails = () => {
    if (!activeTraveler) return;
    const updated: Traveler = {
      ...activeTraveler,
      name: formName.trim() || activeTraveler.name,
      passportNumber: formPassportNumber.trim(),
      passportExpiry: formPassportExpiry,
      nationality: formNationality.trim(),
      emergencyContact: formEmergencyContact.trim(),
      notes: formNotes.trim(),
    };
    onUpdateTraveler(updated);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTraveler) return;

    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    reader.onload = () => {
      const result = reader.result as string;
      const updated: Traveler = {
        ...activeTraveler,
        passportDocUrl: result,
        passportDocName: file.name,
        passportDocType: isPdf ? 'pdf' : 'image',
      };
      onUpdateTraveler(updated);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = () => {
    if (!activeTraveler) return;
    if (window.confirm(`¿Deseas eliminar el documento de pasaporte de ${activeTraveler.name}?`)) {
      const updated: Traveler = {
        ...activeTraveler,
        passportDocUrl: undefined,
        passportDocName: undefined,
        passportDocType: undefined,
      };
      onUpdateTraveler(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl">
            🛂
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Pasaportes y Documentos</h2>
            <p className="text-xs text-blue-200">
              Almacena copias digitales de pasaportes y datos de emergencia protegidos en Cloudflare D1
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {travelers.map((t) => {
          const isSelected = t.id === selectedTravelerId;
          const hasDoc = Boolean(t.passportDocUrl);
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTraveler(t.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: t.avatarColor }}
              >
                {t.name.charAt(0)}
              </div>
              <span>{t.name}</span>
              {hasDoc && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {activeTraveler && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md"
                style={{ backgroundColor: activeTraveler.avatarColor }}
              >
                {activeTraveler.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{activeTraveler.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Viajero Registrado
                </span>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Datos
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveDetails}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
                >
                  <Check className="w-3.5 h-3.5" /> Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-6">
            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">Número de Pasaporte</span>
                  <p className="text-sm font-bold text-gray-800 tracking-wider">
                    {activeTraveler.passportNumber || <span className="text-gray-400 font-normal italic">No registrado</span>}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">Vencimiento del Pasaporte</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-bold text-gray-800">
                      {activeTraveler.passportExpiry || <span className="text-gray-400 font-normal italic">No registrado</span>}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">Nacionalidad</span>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-800">
                      {activeTraveler.nationality || 'Costarricense'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">Contacto de Emergencia</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-rose-500" />
                    <p className="text-sm font-semibold text-gray-800">
                      {activeTraveler.emergencyContact || <span className="text-gray-400 font-normal italic">No registrado</span>}
                    </p>
                  </div>
                </div>

                {activeTraveler.notes && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <span className="text-xs font-semibold text-amber-800 block mb-1">Notas Médicas / Alimenticias / Seguro</span>
                    <p className="text-xs text-amber-900 leading-relaxed">{activeTraveler.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Jessica"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Número de Pasaporte</label>
                  <input
                    type="text"
                    value={formPassportNumber}
                    onChange={(e) => setFormPassportNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. 112340567"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formPassportExpiry}
                    onChange={(e) => setFormPassportExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={formNationality}
                    onChange={(e) => setFormNationality(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Costarricense"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contacto de Emergencia / Teléfono</label>
                  <input
                    type="text"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Juan Pérez (+506 8888-9999)"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Notas Adicionales (Alergias, Seguro, etc.)</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Póliza de seguro INS, intolerancia al gluten, etc."
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Copia Digital del Pasaporte (Foto / PDF)
              </h4>

              {activeTraveler.passportDocUrl ? (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {activeTraveler.passportDocType === 'pdf' ? 'PDF' : 'IMG'}
                    </div>
                    <div className="truncate max-w-[220px]">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {activeTraveler.passportDocName || `Pasaporte_${activeTraveler.name}`}
                      </p>
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Guardado y Disponible Offline
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setPreviewDoc({
                        url: activeTraveler.passportDocUrl!,
                        title: `Pasaporte - ${activeTraveler.name}`,
                        type: activeTraveler.passportDocType || 'image',
                      })}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </button>

                    <a
                      href={activeTraveler.passportDocUrl}
                      download={activeTraveler.passportDocName || `Pasaporte_${activeTraveler.name}`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </a>

                    <button
                      onClick={handleRemoveDocument}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    Subir foto o PDF del pasaporte de {activeTraveler.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Toma una foto con tu celular o selecciona archivo (JPG, PNG o PDF)
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Seleccionar Archivo
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm truncate">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.title}
                  className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-900/5 min-h-[300px]">
              {previewDoc.type === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[65vh] rounded-xl border border-gray-200"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
