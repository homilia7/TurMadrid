import React, { useState } from 'react';
import { Plane, Lock, Users, ArrowRight, ShieldCheck, Sparkles, Check, Heart, MessageSquare } from 'lucide-react';
import { Traveler } from '../types';

interface LandingGatewayProps {
  travelers: Traveler[];
  onLoginTraveler: (travelerId: string) => void;
  onContinueAsGuestFamily?: () => void;
}

export const LandingGateway: React.FC<LandingGatewayProps> = ({
  travelers,
  onLoginTraveler,
  onContinueAsGuestFamily,
}) => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>(travelers[0]?.id || 'u1');

  const validPins = ['777', '888', '123'];

  const handleVerifyPin = () => {
    if (validPins.includes(pinCode.trim())) {
      setPinError(false);
      onLoginTraveler(selectedTravelerId);
    } else {
      setPinError(true);
      setPinCode('');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pinCode.length < 3) {
      const next = pinCode + digit;
      setPinCode(next);
      setPinError(false);
      if (next.length === 3) {
        if (validPins.includes(next)) {
          onLoginTraveler(selectedTravelerId);
        } else {
          setPinError(true);
          setTimeout(() => setPinCode(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-slate-950 text-white overflow-hidden select-none">
      {/* Dynamic Animated Sky & Airplane Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand & Flags Header */}
      <header className="relative z-10 p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Plane className="w-5 h-5 rotate-[-20deg]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              TurEuropa Madrid
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                2026
              </span>
            </h1>
            <p className="text-xs text-slate-400">Madrid, Toledo, Ávila, Segovia & Barcelona</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
          <span className="text-lg">🇨🇷</span>
          <span className="text-xs font-bold text-slate-300">San José</span>
          <span className="text-amber-400 font-black">➔</span>
          <span className="text-xs font-bold text-slate-300">Madrid</span>
          <span className="text-lg">🇪🇸</span>
        </div>
      </header>

      {/* Hero Central Presentation */}
      <main className="relative z-10 max-w-md mx-auto w-full px-6 text-center my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-6 shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Itinerario 13 Días & Portal Familiar en Vivo</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight mb-3">
          Tu Aventura por <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400">España</span> Comienza Aquí
        </h2>

        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          Accede a tus billetes, itinerario en tiempo real, mapas, pasaportes y comunícate con tu familia en casa.
        </p>

        {/* 5 Travelers Avatars Preview */}
        <div className="flex items-center justify-center -space-x-2.5 mb-8">
          {travelers.map((t) => (
            <div
              key={t.id}
              className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-black text-white shadow-lg"
              style={{ backgroundColor: t.avatarColor }}
              title={t.name}
            >
              {t.name.charAt(0)}
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 text-slate-300 text-[10px] font-bold flex items-center justify-center shadow-lg">
            5 Pax
          </div>
        </div>

        {/* Big Action Button */}
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <Lock className="w-5 h-5" />
          <span>Ingresar al Viaje (PIN)</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Direct Chats Button */}
        {onContinueAsGuestFamily && (
          <button
            type="button"
            onClick={onContinueAsGuestFamily}
            className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border-2 border-amber-400 text-amber-300 font-black text-sm shadow-xl shadow-amber-400/10 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span>💬 Abrir Chats y Muro Familiar</span>
            <ArrowRight className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          </button>
        )}

        <p className="text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Acceso privado para los 5 viajeros y portal en vivo para familiares
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500 border-t border-white/5">
        <p>TurEuropa • Desarrollado con ❤️ para nuestro viaje familiar 2026</p>
      </footer>

      {/* Dynamic 3-Digit PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400"></div>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white">Ingresa tu Código de Viajero</h3>
            <p className="text-xs text-slate-400 mb-4">Código PIN de 3 dígitos (ej: 777 o 888)</p>

            {/* Traveler Selector */}
            <div className="mb-5 text-left">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">¿Quién eres?</label>
              <div className="grid grid-cols-5 gap-1.5">
                {travelers.map((t) => {
                  const isSel = t.id === selectedTravelerId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTravelerId(t.id)}
                      className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        isSel
                          ? 'border-amber-400 bg-amber-500/20 text-white'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: t.avatarColor }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold truncate max-w-full">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Indicator Dots */}
            <div className="flex items-center justify-center gap-3 my-4">
              {[0, 1, 2].map((idx) => {
                const filled = pinCode.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      filled
                        ? 'bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/50'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs font-bold text-rose-400 mb-3 animate-shake">
                ❌ Código incorrecto. Prueba con 777 o 888
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 font-bold text-lg text-white transition cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-400 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 font-bold text-lg text-white transition cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400 transition cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
