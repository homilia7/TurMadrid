import React, { useState, useRef } from 'react';
import { Traveler, DocumentItem } from '../types';
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
  Camera,
  Hotel,
  TramFront,
  Train,
  Plus,
  Lock,
  AlertTriangle,
  MapPin,
  Clock,
  QrCode,
  FileImage,
  Sparkles,
  Users
} from 'lucide-react';
import { optimizeImageForUpload } from '../utils/imageUtils';
import { formatCleanReference } from '../utils/ticketGenerator';
import { formatDateWithDay } from '../utils/dateUtils';

interface PassportSectionProps {
  travelers: Traveler[];
  documents?: DocumentItem[];
  onUpdateTraveler: (traveler: Traveler) => void;
  onAddDocument?: (doc: DocumentItem) => void;
  onDeleteDocument?: (id: string) => void;
  onAddTraveler?: (name: string, color: string) => void;
  activeTravelerId?: string;
  onSelectTraveler?: (id: string) => void;
}

type SubTabType = 'passports' | 'hotel' | 'teleferico' | 'metro';

export const PassportSection: React.FC<PassportSectionProps> = ({
  travelers,
  documents = [],
  onUpdateTraveler,
  onAddDocument,
  onDeleteDocument,
  activeTravelerId,
}) => {
  const safeTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('passports');

  // Selected traveler for passport tab
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>(
    activeTravelerId || safeTravelers[0]?.id || 'u1'
  );
  const [isEditingPassport, setIsEditingPassport] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);

  // Security deletion state (code: 8888)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; type: 'passport' | 'doc' } | null>(null);
  const [deletePin, setDeletePin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Filtered documents by category
  const hotelDocs = safeDocs.filter((d) => d.category === 'hotel' || d.category === 'reserva');
  const telefericoDocs = safeDocs.filter((d) => d.category === 'teleferico');
  const metroDocs = safeDocs.filter((d) => d.category === 'metro');

  // Active Traveler details for passport form
  const activeTraveler =
    safeTravelers.find((t) => t.id === selectedTravelerId) ||
    safeTravelers[0] ||
    ({ id: 'u1', name: 'Viajero 1', avatarColor: '#2563eb' } as Traveler);

  const [formName, setFormName] = useState(activeTraveler?.name || '');
  const [formPassportNumber, setFormPassportNumber] = useState(activeTraveler?.passportNumber || '');
  const [formPassportExpiry, setFormPassportExpiry] = useState(activeTraveler?.passportExpiry || '');
  const [formNationality, setFormNationality] = useState(activeTraveler?.nationality || 'Costarricense');
  const [formEmergencyContact, setFormEmergencyContact] = useState(activeTraveler?.emergencyContact || '');
  const [formNotes, setFormNotes] = useState(activeTraveler?.notes || '');

  const passportFileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for Adding New Documents (Hotel / Teleférico / Metro)
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState<boolean>(false);
  const [modalCategory, setModalCategory] = useState<'hotel' | 'teleferico' | 'metro'>('hotel');
  const [docTitle, setDocTitle] = useState<string>('');
  const [docReference, setDocReference] = useState<string>('');
  const [docTravelerId, setDocTravelerId] = useState<string>('group');
  const [docDateStart, setDocDateStart] = useState<string>('');
  const [docDateEnd, setDocDateEnd] = useState<string>('');
  const [docLocation, setDocLocation] = useState<string>('');
  const [docNotes, setDocNotes] = useState<string>('');
  const [docUploadedFile, setDocUploadedFile] = useState<{
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'digital';
    fileSize: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const docFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTraveler = (id: string) => {
    setSelectedTravelerId(id);
    const target = safeTravelers.find((t) => t.id === id);
    if (target) {
      setFormName(target.name);
      setFormPassportNumber(target.passportNumber || '');
      setFormPassportExpiry(target.passportExpiry || '');
      setFormNationality(target.nationality || 'Costarricense');
      setFormEmergencyContact(target.emergencyContact || '');
      setFormNotes(target.notes || '');
      setIsEditingPassport(false);
    }
  };

  const handleSavePassportDetails = () => {
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
    setIsEditingPassport(false);
  };

  const handlePassportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTraveler) return;

    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    reader.onload = async () => {
      let result = reader.result as string;
      if (!isPdf && result.startsWith('data:image')) {
        const optimized = await optimizeImageForUpload(result);
        result = optimized.dataUrl;
      }
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

  // Open Add Document Modal
  const handleOpenAddDoc = (category: 'hotel' | 'teleferico' | 'metro') => {
    setModalCategory(category);
    setDocUploadedFile(null);
    setDocTravelerId('group');
    setDocNotes('');

    if (category === 'hotel') {
      setDocTitle('Reserva Hotel Riu Plaza España');
      setDocLocation('Calle Gran Vía 84, Madrid');
      setDocReference('HTL-MAD-' + Math.floor(100000 + Math.random() * 900000));
      setDocDateStart('2026-09-11');
      setDocDateEnd('2026-09-18');
      setDocNotes('Habitaciones para el grupo (5 personas). Desayuno incluido.');
    } else if (category === 'teleferico') {
      setDocTitle('Entrada Teleférico de Madrid');
      setDocLocation('Paseo del Pintor Rosales s/n');
      setDocReference('TLF-' + Math.floor(100000 + Math.random() * 900000));
      setDocDateStart('2026-09-12');
      setDocDateEnd('');
      setDocNotes('Pase de Ida y Vuelta - Cabina panorámica hacia Casa de Campo.');
    } else {
      setDocTitle('Tarjeta Multi Transporte Metro Madrid');
      setDocLocation('Red de Metro y Autobuses EMT Madrid');
      setDocReference('MTR-' + Math.floor(100000 + Math.random() * 900000));
      setDocDateStart('');
      setDocDateEnd('');
      setDocNotes('Tarjeta de 10 viajes / Abono turístico Zona A válido para Metro.');
    }

    setIsAddDocModalOpen(true);
  };

  // Upload file for generic document
  const handleDocFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        let result = reader.result as string;
        let finalSize = `${(file.size / 1024).toFixed(1)} KB`;
        if (!isPdf && result.startsWith('data:image')) {
          const optimized = await optimizeImageForUpload(result);
          result = optimized.dataUrl;
          finalSize = optimized.fileSize;
        }
        setDocUploadedFile({
          name: file.name,
          url: result,
          type: isPdf ? 'pdf' : 'image',
          fileSize: finalSize,
        });
      } catch (err) {
        console.warn('Error reading document file:', err);
      } finally {
        setIsUploadingFile(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Save new generic document (Hotel / Teleférico / Metro)
  const handleSaveNewDocument = () => {
    if (!docTitle.trim()) return;

    const newDoc: DocumentItem = {
      id: `${modalCategory}-${Date.now()}`,
      category: modalCategory,
      title: docTitle.trim(),
      fileName: docUploadedFile?.name || `${docTitle.trim()}.png`,
      fileType: docUploadedFile?.type || 'digital',
      dataUrl: docUploadedFile?.url || '',
      fileSize: docUploadedFile?.fileSize || 'Digital',
      referenceNumber: docReference.trim(),
      travelerId: docTravelerId === 'group' ? undefined : docTravelerId,
      departureTime: docDateStart || undefined,
      arrivalTime: docDateEnd || undefined,
      origin: docLocation.trim() || undefined,
      notes: docNotes.trim() || undefined,
      uploadedAt: new Date().toISOString(),
    };

    if (onAddDocument) {
      onAddDocument(newDoc);
    }

    setIsAddDocModalOpen(false);
    setDocUploadedFile(null);
  };

  // Confirm delete with 8888 PIN
  const handleConfirmDelete = () => {
    if (deletePin.trim() !== '8888') {
      setPinError(true);
      return;
    }

    if (itemToDelete) {
      if (itemToDelete.type === 'passport') {
        const target = safeTravelers.find((t) => t.id === itemToDelete.id);
        if (target) {
          onUpdateTraveler({
            ...target,
            passportDocUrl: undefined,
            passportDocName: undefined,
            passportDocType: undefined,
          });
        }
      } else {
        if (onDeleteDocument) {
          onDeleteDocument(itemToDelete.id);
        }
      }
    }

    setItemToDelete(null);
    setDeletePin('');
    setPinError(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl shadow-inner">
            🛂
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">Pasaportes y Documentos</h2>
              <span className="text-xs bg-blue-400/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full font-bold">
                Online & Offline
              </span>
            </div>
            <p className="text-xs text-blue-200">
              Almacena pasaportes, reservas de hotel, entradas al teleférico y billetes de metro protegidos
            </p>
          </div>
        </div>

        {/* Quick Add Button depending on subtab */}
        {activeSubTab !== 'passports' && (
          <button
            type="button"
            onClick={() => handleOpenAddDoc(activeSubTab)}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeSubTab === 'hotel'
                ? 'Subir Reserva Hotel'
                : activeSubTab === 'teleferico'
                ? 'Subir Entrada Teleférico'
                : 'Subir Ticket Metro'}
            </span>
          </button>
        )}
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-200/80 p-1.5 rounded-2xl border border-stone-300 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubTab('passports')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'passports'
              ? 'bg-white text-blue-900 shadow-sm border border-blue-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Pasaportes ({safeTravelers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('hotel')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'hotel'
              ? 'bg-white text-amber-900 shadow-sm border border-amber-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Hotel className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">Reserva Hotel ({hotelDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('teleferico')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'teleferico'
              ? 'bg-white text-emerald-900 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <TramFront className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Teleférico ({telefericoDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('metro')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'metro'
              ? 'bg-white text-rose-900 shadow-sm border border-rose-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Train className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="truncate">Tickets Metro ({metroDocs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PASAPORTES INDIVIDUALES (5 VIAJEROS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'passports' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Horizontal Traveler Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {safeTravelers.map((t) => {
              const isSelected = t.id === selectedTravelerId;
              const hasDoc = Boolean(t.passportDocUrl);
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTraveler(t.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-xs shrink-0"
                    style={{ backgroundColor: t.avatarColor }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <span>{t.name}</span>
                  {hasDoc && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTraveler && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-sm"
                    style={{ backgroundColor: activeTraveler.avatarColor }}
                  >
                    {activeTraveler.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{activeTraveler.name}</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Viajero Registrado
                    </span>
                  </div>
                </div>

                {!isEditingPassport ? (
                  <button
                    onClick={() => setIsEditingPassport(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar Datos
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSavePassportDetails}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingPassport(false)}
                      className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-6">
                {!isEditingPassport ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-xs font-semibold text-stone-400 block mb-1">Número de Pasaporte</span>
                      <p className="text-sm font-bold text-stone-800 tracking-wider">
                        {activeTraveler.passportNumber || <span className="text-stone-400 font-normal italic">No registrado</span>}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-xs font-semibold text-stone-400 block mb-1">Vencimiento del Pasaporte</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-bold text-stone-800">
                          {activeTraveler.passportExpiry || <span className="text-stone-400 font-normal italic">No registrado</span>}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-xs font-semibold text-stone-400 block mb-1">Nacionalidad</span>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-stone-800">
                          {activeTraveler.nationality || 'Costarricense'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-xs font-semibold text-stone-400 block mb-1">Contacto de Emergencia</span>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-rose-500" />
                        <p className="text-sm font-semibold text-stone-800">
                          {activeTraveler.emergencyContact || <span className="text-stone-400 font-normal italic">No registrado</span>}
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
                      <label className="text-xs font-bold text-stone-700 block mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ej. Jessica"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Número de Pasaporte</label>
                      <input
                        type="text"
                        value={formPassportNumber}
                        onChange={(e) => setFormPassportNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ej. 112340567"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={formPassportExpiry}
                        onChange={(e) => setFormPassportExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Nacionalidad</label>
                      <input
                        type="text"
                        value={formNationality}
                        onChange={(e) => setFormNationality(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Costarricense"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-700 block mb-1">Contacto de Emergencia / Teléfono</label>
                      <input
                        type="text"
                        value={formEmergencyContact}
                        onChange={(e) => setFormEmergencyContact(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ej. Juan Pérez (+506 8888-9999)"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-700 block mb-1">Notas Adicionales (Alergias, Seguro, etc.)</label>
                      <textarea
                        rows={2}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Póliza de seguro INS, intolerancia al gluten, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Passport Document File Box */}
                <div className="pt-4 border-t border-stone-100">
                  <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Copia Digital del Pasaporte (Foto / PDF)
                  </h4>

                  {activeTraveler.passportDocUrl ? (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {activeTraveler.passportDocType === 'pdf' ? 'PDF' : 'IMG'}
                        </div>
                        <div className="truncate max-w-[220px]">
                          <p className="text-sm font-bold text-stone-800 truncate">
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
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>

                        <a
                          href={activeTraveler.passportDocUrl}
                          download={activeTraveler.passportDocName || `Pasaporte_${activeTraveler.name}`}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>

                        <button
                          onClick={() => {
                            setItemToDelete({
                              id: activeTraveler.id,
                              title: `Pasaporte de ${activeTraveler.name}`,
                              type: 'passport',
                            });
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                          title="Eliminar (Requiere código 8888)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer"
                      onClick={() => passportFileInputRef.current?.click()}
                    >
                      <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-800">
                        Subir foto o PDF del pasaporte de {activeTraveler.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Toma una foto con tu celular o selecciona archivo (JPG, PNG o PDF)
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Seleccionar Archivo
                      </button>
                    </div>
                  )}

                  <input
                    ref={passportFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handlePassportFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: RESERVAS DE HOTEL */}
      {/* ========================================================================= */}
      {activeSubTab === 'hotel' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-amber-600" />
                Comprobantes y Reservas de Hotel
              </h3>
              <p className="text-xs text-stone-500">
                Sube la foto del voucher o PDF de confirmación de tu alojamiento
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddDoc('hotel')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Hotel</span>
            </button>
          </div>

          {hotelDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-amber-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shadow-xs">
                🏨
              </div>
              <h4 className="text-base font-bold text-stone-800">Aún no hay reservas de hotel subidas</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Guarda los comprobantes de reserva de Booking, Airbnb o web oficial del hotel para tenerlos disponibles offline.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddDoc('hotel')}
                className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition cursor-pointer"
              >
                ➕ Subir Foto o PDF de la Reserva
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotelDocs.map((doc) => {
                const assignedTraveler = doc.travelerId ? safeTravelers.find((t) => t.id === doc.travelerId) : null;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between gap-3 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <Hotel className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Reserva de Hotel
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 mt-0.5">{doc.title}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'doc' })}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar reserva (Código 8888)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                        {doc.origin && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{doc.origin}</span>
                          </div>
                        )}

                        {(doc.departureTime || doc.arrivalTime) && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {doc.departureTime ? formatDateWithDay(doc.departureTime) : 'Check-in'} 
                              {doc.arrivalTime ? ` ➜ ${formatDateWithDay(doc.arrivalTime)}` : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                            Ref: {formatCleanReference(doc.referenceNumber)}
                          </span>
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            {assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Pax)'}
                          </span>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 mt-2">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium truncate">
                        {doc.fileName || 'Comprobante digital'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              url: doc.dataUrl,
                              title: doc.title,
                              type: doc.fileType,
                            })}
                            className="px-2.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Foto</span>
                          </button>
                        )}

                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.title}.png`}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ENTRADAS AL TELEFÉRICO */}
      {/* ========================================================================= */}
      {activeSubTab === 'teleferico' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <TramFront className="w-5 h-5 text-emerald-600" />
                Entradas al Teleférico
              </h3>
              <p className="text-xs text-stone-500">
                Guarda los pases, billetes y códigos QR para el Teleférico
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddDoc('teleferico')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Entrada</span>
            </button>
          </div>

          {telefericoDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-emerald-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-xs">
                🚡
              </div>
              <h4 className="text-base font-bold text-stone-800">Aún no hay entradas al teleférico subidas</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Sube las fotos o PDFs de los pases del Teleférico de Madrid para tener tus billetes listos al abordar.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddDoc('teleferico')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                ➕ Subir Boleto del Teleférico
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {telefericoDocs.map((doc) => {
                const assignedTraveler = doc.travelerId ? safeTravelers.find((t) => t.id === doc.travelerId) : null;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <TramFront className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Pase Teleférico
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 mt-0.5">{doc.title}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'doc' })}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar entrada (Código 8888)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                        {doc.origin && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{doc.origin}</span>
                          </div>
                        )}

                        {doc.departureTime && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{formatDateWithDay(doc.departureTime)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                            Ref: {formatCleanReference(doc.referenceNumber)}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Pax)'}
                          </span>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 mt-2">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium truncate">
                        {doc.fileName || 'Entrada digital'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              url: doc.dataUrl,
                              title: doc.title,
                              type: doc.fileType,
                            })}
                            className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Entrada</span>
                          </button>
                        )}

                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.title}.png`}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: TICKETS DEL METRO */}
      {/* ========================================================================= */}
      {activeSubTab === 'metro' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Train className="w-5 h-5 text-rose-600" />
                Tickets y Tarjetas del Metro
              </h3>
              <p className="text-xs text-stone-500">
                Almacena fotos de tu Tarjeta Multi, billetes de 10 viajes y abonos de transporte
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddDoc('metro')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Ticket Metro</span>
            </button>
          </div>

          {metroDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-rose-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shadow-xs">
                🚇
              </div>
              <h4 className="text-base font-bold text-stone-800">Aún no hay billetes de metro subidos</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Toma una foto a tu Tarjeta Multi de Metro Madrid o sube el comprobante digital para llevar el control de tus viajes.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddDoc('metro')}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                ➕ Subir Billete o Tarjeta Multi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metroDocs.map((doc) => {
                const assignedTraveler = doc.travelerId ? safeTravelers.find((t) => t.id === doc.travelerId) : null;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-rose-400 transition-all flex flex-col justify-between gap-3 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <Train className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Transporte Metro
                            </span>
                            <h4 className="text-sm font-bold text-stone-900 mt-0.5">{doc.title}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: doc.id, title: doc.title, type: 'doc' })}
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar ticket (Código 8888)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                        {doc.origin && (
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{doc.origin}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                            Nº Serie: {formatCleanReference(doc.referenceNumber)}
                          </span>
                          <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-rose-600" />
                            {assignedTraveler ? assignedTraveler.name : 'Pase Grupal (5 Pax)'}
                          </span>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 mt-2">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium truncate">
                        {doc.fileName || 'Tarjeta digital'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              url: doc.dataUrl,
                              title: doc.title,
                              type: doc.fileType,
                            })}
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Billete</span>
                          </button>
                        )}

                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.title}.png`}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBIR NUEVO DOCUMENTO (HOTEL / TELEFÉRICO / METRO) */}
      {/* ========================================================================= */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${
                  modalCategory === 'hotel' ? 'bg-amber-500 text-stone-950' : modalCategory === 'teleferico' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {modalCategory === 'hotel' ? <Hotel className="w-5 h-5" /> : modalCategory === 'teleferico' ? <TramFront className="w-5 h-5" /> : <Train className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    {modalCategory === 'hotel' ? 'Subir Reserva de Hotel' : modalCategory === 'teleferico' ? 'Subir Entrada al Teleférico' : 'Subir Ticket del Metro'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Completa los detalles y adjunta la foto o PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Título o Nombre:
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ej. Hotel Riu Plaza España / Teleférico Madrid"
                  className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Número de Referencia / Localizador:
                  </label>
                  <input
                    type="text"
                    value={docReference}
                    onChange={(e) => setDocReference(e.target.value)}
                    placeholder="Ej. BK-99482 / MTR-102"
                    className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Asignar a:
                  </label>
                  <select
                    value={docTravelerId}
                    onChange={(e) => setDocTravelerId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="group">Pase Grupal (5 Viajeros)</option>
                    {safeTravelers.map((t) => (
                      <option key={t.id} value={t.id}>
                        Viajero: {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {modalCategory === 'hotel' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Fecha Check-in:
                    </label>
                    <input
                      type="date"
                      value={docDateStart}
                      onChange={(e) => setDocDateStart(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Fecha Check-out:
                    </label>
                    <input
                      type="date"
                      value={docDateEnd}
                      onChange={(e) => setDocDateEnd(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : modalCategory === 'teleferico' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Fecha de Visita:
                  </label>
                  <input
                    type="date"
                    value={docDateStart}
                    onChange={(e) => setDocDateStart(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Ubicación / Dirección:
                </label>
                <input
                  type="text"
                  value={docLocation}
                  onChange={(e) => setDocLocation(e.target.value)}
                  placeholder="Ej. Calle Gran Vía 84 / Estación Pintor Rosales"
                  className="w-full text-xs font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Notas Adicionales:
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Ej. Incluye desayuno buffet, 2 habitaciones dobles..."
                  className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload File Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Foto o PDF del Comprobante:
                </label>
                {docUploadedFile ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileImage className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-950 truncate">{docUploadedFile.name}</p>
                        <span className="text-[10px] text-emerald-700 font-semibold">{docUploadedFile.fileSize}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocUploadedFile(null)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => docFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-blue-500 p-4 rounded-xl text-center cursor-pointer transition hover:bg-blue-50/20"
                  >
                    <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-stone-700">Toca para tomar foto o seleccionar archivo</p>
                    <p className="text-[10px] text-stone-400">Formatos: JPG, PNG, PDF</p>
                  </div>
                )}
                <input
                  ref={docFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleDocFilePicked}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUploadingFile || !docTitle.trim()}
                onClick={handleSaveNewDocument}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4-DIGIT PIN SECURITY MODAL FOR DELETING (CODE: 8888) */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div
          id="delete-doc-pin-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setItemToDelete(null)}
        >
          <div
            id="delete-doc-pin-card"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-200 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-stone-900">
              Confirmar Borrado de Documento
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Para eliminar <strong className="text-stone-900">"{itemToDelete.title}"</strong>, introduce el código de seguridad de 4 dígitos:
            </p>

            <div className="my-4">
              <input
                id="input-delete-passport-pin"
                type="password"
                maxLength={4}
                autoFocus
                value={deletePin}
                onChange={(e) => {
                  setDeletePin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDelete();
                  }
                }}
                placeholder="••••"
                className={`w-36 text-center text-2xl font-mono font-black tracking-widest py-2 px-3 rounded-xl border ${
                  pinError
                    ? 'border-red-500 bg-red-50 text-red-600 ring-2 ring-red-300'
                    : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200'
                } focus:outline-none transition-all`}
              />

              {pinError && (
                <p className="text-xs text-red-600 font-bold mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Código incorrecto.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-delete-doc"
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIGH RESOLUTION LIGHTBOX PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm truncate pr-2">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.title}
                  className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-stone-900/5 min-h-[300px]">
              {previewDoc.type === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[68vh] rounded-xl border border-stone-200"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

