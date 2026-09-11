import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Traveler } from '../types';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Search,
  Receipt,
  TrendingUp,
  Euro,
  Share2,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Sparkles,
} from 'lucide-react';

interface ExpensesTrackerSectionProps {
  expenses: Expense[];
  travelers: Traveler[];
  activeTravelerId: string;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  onClearExpenses?: (travelerId?: string) => void;
}

export const ExpensesTrackerSection: React.FC<ExpensesTrackerSectionProps> = ({
  expenses = [],
  travelers = [],
  activeTravelerId,
  onAddExpense,
  onDeleteExpense,
  onClearExpenses,
}) => {
  // Current local date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const safeTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : [];

  // Selected Traveler for independent expenses view
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>(
    activeTravelerId || safeTravelers[0]?.id || 'u1'
  );

  useEffect(() => {
    if (activeTravelerId) {
      setSelectedTravelerId(activeTravelerId);
    }
  }, [activeTravelerId]);

  const currentTraveler = safeTravelers.find((t) => t.id === selectedTravelerId) || safeTravelers[0];

  // Scope: 'individual' (Mis Gastos del viajero seleccionado), 'all' (Todos los gastos del grupo), 'summary' (Resumen comparativo)
  const [expenseScope, setExpenseScope] = useState<'individual' | 'all' | 'summary'>('individual');

  // Modal State for Adding New Expense
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [formTravelerId, setFormTravelerId] = useState<string>(selectedTravelerId);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);

  // Feedback state
  const [justAdded, setJustAdded] = useState(false);
  const [justCleared, setJustCleared] = useState(false);

  // View mode inside scope: 'by-day' vs 'list'
  const [viewMode, setViewMode] = useState<'by-day' | 'list'>('by-day');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal State for Deletion
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Confirmation Modal State for Clearing All / Filtered Expenses
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearScopeOption, setClearScopeOption] = useState<'current' | 'all'>('current');

  // Open Add Modal
  const handleOpenAddModal = (targetTravelerId?: string) => {
    setFormTravelerId(targetTravelerId || selectedTravelerId);
    setTitle('');
    setAmount('');
    setDate(todayStr);
    setIsAddExpenseModalOpen(true);
  };

  // Handle Save Expense from Modal
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!cleanTitle || isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    const targetT = safeTravelers.find((t) => t.id === formTravelerId) || currentTraveler;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddExpense({
      title: cleanTitle,
      amount: numAmount,
      date: date || todayStr,
      time: timeStr,
      travelerId: targetT?.id,
      travelerName: targetT?.name || 'Viajero',
      category: 'otro',
    });

    // Reset and close modal
    setTitle('');
    setAmount('');
    setIsAddExpenseModalOpen(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  // Quick Amount Helper inside modal
  const handleAddQuickAmount = (extra: number) => {
    const current = parseFloat(amount.replace(',', '.')) || 0;
    setAmount((current + extra).toFixed(2));
  };

  // Filter expenses based on current scope
  const scopedExpenses = useMemo(() => {
    if (expenseScope === 'individual') {
      return expenses.filter((exp) => exp.travelerId === selectedTravelerId || (!exp.travelerId && selectedTravelerId === safeTravelers[0]?.id));
    }
    return expenses;
  }, [expenses, expenseScope, selectedTravelerId, safeTravelers]);

  // Search Filtered
  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return scopedExpenses;
    const term = searchTerm.toLowerCase();
    return scopedExpenses.filter(
      (exp) =>
        exp.title.toLowerCase().includes(term) ||
        (exp.travelerName && exp.travelerName.toLowerCase().includes(term))
    );
  }, [scopedExpenses, searchTerm]);

  // KPI Calculations (Specific to currently scoped view)
  const totalAccumulated = useMemo(() => {
    return scopedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [scopedExpenses]);

  const totalToday = useMemo(() => {
    return scopedExpenses
      .filter((exp) => exp.date === todayStr)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [scopedExpenses, todayStr]);

  const todayCount = useMemo(() => {
    return scopedExpenses.filter((exp) => exp.date === todayStr).length;
  }, [scopedExpenses, todayStr]);

  // Grouped by Day
  const groupedByDay = useMemo(() => {
    const groups: { [dateStr: string]: Expense[] } = {};
    filteredExpenses.forEach((exp) => {
      const d = exp.date || todayStr;
      if (!groups[d]) groups[d] = [];
      groups[d].push(exp);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((d) => {
      const dayExpenses = groups[d];
      const dayTotal = dayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      return {
        date: d,
        expenses: dayExpenses,
        total: dayTotal,
      };
    });
  }, [filteredExpenses, todayStr]);

  // Group Summary by Traveler
  const groupedByTraveler = useMemo(() => {
    const map: { [tId: string]: { name: string; color: string; total: number; count: number } } = {};
    safeTravelers.forEach((t) => {
      map[t.id] = { name: t.name, color: t.avatarColor, total: 0, count: 0 };
    });

    expenses.forEach((exp) => {
      const tId = exp.travelerId || safeTravelers[0]?.id || 'u1';
      if (!map[tId]) {
        map[tId] = { name: exp.travelerName || 'Viajero', color: '#f59e0b', total: 0, count: 0 };
      }
      map[tId].total += Number(exp.amount) || 0;
      map[tId].count += 1;
    });

    return Object.entries(map).map(([id, data]) => ({
      id,
      name: data.name,
      color: data.color,
      total: data.total,
      count: data.count,
    }));
  }, [expenses, safeTravelers]);

  // Format date helper in Spanish
  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) {
      return 'Hoy';
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
    return dateStr;
  };

  // Export summary to WhatsApp
  const handleShareSummary = () => {
    let text = `💶 *CONTROL DE GASTOS - TurEuropa*\n`;
    if (expenseScope === 'individual') {
      text += `👤 *Gastos de:* ${currentTraveler?.name}\n`;
      text += `📅 *Gastado Hoy:* €${totalToday.toFixed(2)} (${todayCount} gastos)\n`;
      text += `💰 *Total Acumulado:* €${totalAccumulated.toFixed(2)} (${scopedExpenses.length} gastos)\n\n`;
    } else {
      text += `👥 *Total General del Grupo:* €${totalAccumulated.toFixed(2)} (${scopedExpenses.length} gastos)\n\n`;
    }
    text += `*Últimos Gastos Registrados:*\n`;
    scopedExpenses.slice(0, 8).forEach((exp) => {
      text += `• ${exp.title}: €${Number(exp.amount).toFixed(2)} (${formatDateLabel(exp.date)})${exp.travelerName ? ` - ${exp.travelerName}` : ''}\n`;
    });
    text += `\nControlado en: https://tureuropa.pages.dev`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Calculations for Clearing Expenses Confirmation Modal
  const expensesForCurrentTraveler = useMemo(() => {
    return expenses.filter(
      (exp) =>
        exp.travelerId === selectedTravelerId ||
        (!exp.travelerId && selectedTravelerId === safeTravelers[0]?.id)
    );
  }, [expenses, selectedTravelerId, safeTravelers]);

  const totalCurrentTravelerAmount = useMemo(() => {
    return expensesForCurrentTraveler.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expensesForCurrentTraveler]);

  const totalAllExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  // Confirm and clear expenses handler
  const handleConfirmClearExpenses = () => {
    if (onClearExpenses) {
      onClearExpenses(clearScopeOption === 'current' ? selectedTravelerId : 'all');
    }
    setIsClearModalOpen(false);
    setJustCleared(true);
    setTimeout(() => setJustCleared(false), 3500);
  };

  // Confirm and delete single expense
  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner with Add Expense Button & Clear Button */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Control de Gastos
              </h2>
              <span className="text-[10px] font-black uppercase bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs">
                Euros (€)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Gastos independientes por viajero, acumulado de hoy e historial organizado por día.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto">
          {/* Botón Principal: Agregar Gasto */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black shadow-xl transition flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-200 ring-4 ring-amber-400/20 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="tracking-wide uppercase font-black">Agregar Gasto</span>
          </button>

          <button
            type="button"
            onClick={handleShareSummary}
            className="px-3.5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-bold backdrop-blur-md border border-white/30 shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            title="Compartir resumen de gastos por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compartir</span>
          </button>

          {/* Botón Limpiar Gastos */}
          {expenses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setClearScopeOption(expenseScope === 'all' ? 'all' : 'current');
                setIsClearModalOpen(true);
              }}
              className="px-3.5 py-3 rounded-2xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold backdrop-blur-md border border-rose-400/50 shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Limpiar registro de gastos"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar Gastos</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Success Feedback */}
      {justAdded && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>¡Gasto registrado con éxito en Euros (€)!</span>
          </div>
          <button
            type="button"
            onClick={() => setJustAdded(false)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Clear Feedback */}
      {justCleared && (
        <div className="bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>¡Gastos limpiados con éxito del registro!</span>
          </div>
          <button
            type="button"
            onClick={() => setJustCleared(false)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TRAVELER SELECTOR & SCOPE CONTROLS */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Scope buttons */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setExpenseScope('individual')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                expenseScope === 'individual'
                  ? 'bg-amber-500 text-stone-950 shadow-sm ring-1 ring-amber-600/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Mis Gastos</span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseScope('all')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                expenseScope === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-sm ring-1 ring-amber-600/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Todos los Gastos</span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseScope('summary')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                expenseScope === 'summary'
                  ? 'bg-amber-500 text-stone-950 shadow-sm ring-1 ring-amber-600/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Por Viajero</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold text-stone-500 block uppercase">
                {expenseScope === 'individual' ? `Gastos de ${currentTraveler?.name}` : 'Gastos del Grupo'}
              </span>
              <span className="text-sm font-black text-stone-900">
                {scopedExpenses.length} gastos registrados
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Gasto</span>
            </button>
          </div>
        </div>

        {/* Traveler Selection Pills (Active when viewing Mis Gastos or Adding) */}
        {safeTravelers.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-600 shrink-0">
              Seleccionar Viajero:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {safeTravelers.map((traveler) => {
                const isSelected = selectedTravelerId === traveler.id;
                return (
                  <button
                    key={traveler.id}
                    type="button"
                    onClick={() => {
                      setSelectedTravelerId(traveler.id);
                      if (expenseScope === 'summary') setExpenseScope('individual');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-sm ring-2 ring-amber-400'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ backgroundColor: traveler.avatarColor }}
                    >
                      {traveler.name.substring(0, 1)}
                    </div>
                    <span>{traveler.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards: Acumulado de Hoy, Total Acumulado, Promedio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Acumulado al de Hoy */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-stone-950 p-4 sm:p-5 rounded-2xl shadow-md relative overflow-hidden border border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950/80">
              Acumulado de Hoy
            </span>
            <span className="text-[10px] font-black bg-stone-950 text-amber-400 px-2 py-0.5 rounded-full">
              {todayCount} gastos
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950">
              €{totalToday.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] font-bold text-amber-950/80 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Fecha: {formatDateLabel(todayStr)} {expenseScope === 'individual' && `(${currentTraveler?.name})`}
          </p>
        </div>

        {/* Total Acumulado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-2xl shadow-md relative overflow-hidden border border-emerald-400/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Total Acumulado
            </span>
            <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">
              {scopedExpenses.length} gastos
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              €{totalAccumulated.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] font-bold text-emerald-100 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {expenseScope === 'individual' ? `Total de ${currentTraveler?.name}` : 'Total de todos los gastos juntos'}
          </p>
        </div>

        {/* Promedio y Días */}
        <div className="bg-stone-900 text-stone-100 p-4 sm:p-5 rounded-2xl shadow-md border border-stone-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">
              Promedio por Gasto
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-400">
              €{scopedExpenses.length > 0 ? (totalAccumulated / scopedExpenses.length).toFixed(2) : '0.00'}
            </div>
          </div>
          <div className="text-[11px] font-medium text-stone-400 mt-2 flex items-center justify-between">
            <span>Días con actividad:</span>
            <span className="font-bold text-white">{groupedByDay.length} días</span>
          </div>
        </div>
      </div>

      {/* VISTA COMPARATIVA: RESUMEN POR VIAJERO */}
      {expenseScope === 'summary' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h4 className="text-base font-black text-stone-900">
              Desglose y Balance por Cada Viajero
            </h4>
            <span className="text-xs font-bold text-stone-500">
              Total Viaje: €{expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {groupedByTraveler.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedTravelerId(item.id);
                  setExpenseScope('individual');
                }}
                className="bg-stone-50 hover:bg-amber-50/50 rounded-2xl border border-stone-200 hover:border-amber-300 p-4 flex items-center justify-between transition cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-stone-900 group-hover:text-amber-950">
                      {item.name}
                    </h5>
                    <span className="text-xs text-stone-500 font-medium">
                      {item.count} gasto(s) registrados
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">Total</span>
                  <span className="text-base sm:text-lg font-black text-stone-950">
                    €{item.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL POR DÍA O TODOS JUNTOS (INDIVIDUAL / ALL) */}
      {expenseScope !== 'summary' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View switcher */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('by-day')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  viewMode === 'by-day'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-black/5'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Historial por Día</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-black/5'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Todos los Gastos Juntos</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar gasto por nombre..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* VISTA 1: HISTORIAL POR DÍA */}
          {/* VISTA 1: HISTORIAL POR DÍA */}
          {viewMode === 'by-day' && (
            <div className="space-y-4">
              {groupedByDay.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200 text-stone-500 space-y-3">
                  <Receipt className="w-12 h-12 mx-auto text-stone-300" />
                  <h4 className="text-base font-black text-stone-800">
                    {expenseScope === 'individual'
                      ? `No hay gastos registrados para ${currentTraveler?.name}`
                      : 'No hay gastos registrados en el grupo'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Comienza agregando el primer gasto en euros (€) con el botón de abajo.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal()}
                    className="mt-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Agregar Primer Gasto</span>
                  </button>
                </div>
              ) : (
                groupedByDay.map((group) => {
                  const isTodayGroup = group.date === todayStr;
                  return (
                    <div
                      key={group.date}
                      className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3"
                    >
                      {/* Subtotal del Día */}
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              isTodayGroup
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-stone-900">
                                {formatDateLabel(group.date)}
                              </h4>
                              {isTodayGroup && (
                                <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.2 rounded-md">
                                  Hoy
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 font-medium">
                              {group.date} • {group.expenses.length} gasto(s)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-500 block uppercase">
                            Total del Día
                          </span>
                          <span className="text-base sm:text-lg font-black text-emerald-700">
                            €{group.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Lista de gastos individuales del día */}
                      <div className="divide-y divide-stone-200/70">
                        {group.expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="py-2.5 flex items-center justify-between gap-3 hover:bg-white/70 px-2 rounded-xl transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                                €
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-black text-stone-900 truncate">
                                  {exp.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                                  {exp.time && <span>{exp.time} hrs</span>}
                                  {exp.travelerName && (
                                    <span className="bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-bold">
                                      {exp.travelerName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm sm:text-base font-black text-stone-900">
                                €{Number(exp.amount).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpenseToDelete(exp)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VISTA 2: TODOS LOS GASTOS JUNTOS (LISTA COMPLETA) */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900">
                    Total Acumulado de la Lista:
                  </span>
                  <p className="text-[11px] text-emerald-700">
                    {filteredExpenses.length} gasto(s) encontrados
                  </p>
                </div>
                <span className="text-lg sm:text-xl font-black text-emerald-900">
                  €{filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0).toFixed(2)}
                </span>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500">
                  <Receipt className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <h4 className="text-sm font-black text-stone-700">No hay gastos que coincidan</h4>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 bg-stone-50 rounded-2xl border border-stone-200 p-2">
                  {filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-white rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">
                          €
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-black text-stone-900 truncate">
                            {exp.title}
                          </h5>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                            <span>{formatDateLabel(exp.date)}</span>
                            {exp.time && <span>• {exp.time} hrs</span>}
                            {exp.travelerName && (
                              <span className="bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-bold">
                                {exp.travelerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-base font-black text-stone-950">
                          €{Number(exp.amount).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: AGREGAR GASTO */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 relative animate-in zoom-in-95">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-2xl hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
                <Euro className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
                  Registrar Nuevo Gasto
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Ingresa el nombre del gasto y el monto en euros (€)
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-2">
              {/* Traveler Picker inside modal */}
              {safeTravelers.length > 0 && (
                <div>
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1.5">
                    ¿Para quién es este gasto?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {safeTravelers.map((t) => {
                      const isSelected = formTravelerId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormTravelerId(t.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-black border transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-amber-400'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ backgroundColor: t.avatarColor }}
                          >
                            {t.name.substring(0, 1)}
                          </div>
                          <span className="truncate">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Campo 1: Nombre del Gasto */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Nombre o Concepto del Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Almuerzo tapas, Taxi aeropuerto, Café, Museo..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 font-bold placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Campo 2: Monto en Euros */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Monto en Euros (€) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 font-black text-lg">
                    €
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setAmount(val);
                    }}
                    placeholder="0.00"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-stone-950 font-black text-xl placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-stone-500 mr-1">Rápido:</span>
                {[5, 10, 15, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuickAmount(val)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 rounded-xl text-xs font-black text-stone-700 transition cursor-pointer active:scale-95"
                  >
                    +{val}€
                  </button>
                ))}
              </div>

              {/* Fecha del gasto */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                  Fecha del gasto:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-bold text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Gasto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL TO DELETE EXPENSE */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 relative">
            <button
              type="button"
              onClick={() => setExpenseToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                  ¿Eliminar este gasto?
                </h4>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {/* Expense details summary */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-bold uppercase">Gasto:</span>
                <span className="text-xs font-black text-stone-900 truncate max-w-[200px]">
                  {expenseToDelete.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-bold uppercase">Monto:</span>
                <span className="text-base font-black text-rose-600">
                  €{Number(expenseToDelete.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-bold uppercase">Fecha:</span>
                <span className="text-xs font-bold text-stone-700">
                  {formatDateLabel(expenseToDelete.date)} {expenseToDelete.time && `• ${expenseToDelete.time} hrs`}
                </span>
              </div>
              {expenseToDelete.travelerName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-bold uppercase">Viajero:</span>
                  <span className="text-xs font-bold text-stone-800">
                    {expenseToDelete.travelerName}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN LIMPIAR GASTOS */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-2xl hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
                  ¿Limpiar Gastos?
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Selecciona el alcance de los gastos a eliminar:
                </p>
              </div>
            </div>

            {/* Selector de qué gastos limpiar */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 gap-2.5">
                {/* Opción 1: Solo gastos del viajero actual */}
                <button
                  type="button"
                  onClick={() => setClearScopeOption('current')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    clearScopeOption === 'current'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ backgroundColor: currentTraveler?.avatarColor || '#f59e0b' }}
                    >
                      {currentTraveler?.name?.substring(0, 1) || 'V'}
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-stone-900">
                        Solo gastos de {currentTraveler?.name}
                      </h5>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {expensesForCurrentTraveler.length} gasto(s) registrados
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-amber-700">
                    €{totalCurrentTravelerAmount.toFixed(2)}
                  </span>
                </button>

                {/* Opción 2: TODOS los gastos del grupo */}
                <button
                  type="button"
                  onClick={() => setClearScopeOption('all')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    clearScopeOption === 'all'
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      👥
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-stone-900">
                        TODOS los gastos del grupo
                      </h5>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {expenses.length} gasto(s) de todo el viaje
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-600">
                    €{totalAllExpensesAmount.toFixed(2)}
                  </span>
                </button>
              </div>
            </div>

            {/* Cuadro de advertencia informativa */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {clearScopeOption === 'current'
                    ? `Se eliminarán ${expensesForCurrentTraveler.length} gasto(s) de ${currentTraveler?.name} por un total de €${totalCurrentTravelerAmount.toFixed(2)}.`
                    : `Se eliminarán TODOS los ${expenses.length} gastos de todos los viajeros por un total de €${totalAllExpensesAmount.toFixed(2)}.`}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Esta acción no se puede deshacer. Los registros se borrarán permanentemente.
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearExpenses}
                className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Limpiar Gastos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
