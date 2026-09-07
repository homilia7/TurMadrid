import React from 'react';
import { Cloud, RefreshCw, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { CloudSyncState } from '../types';

interface CloudSyncBadgeProps {
  syncState: CloudSyncState;
  onManualSync: () => void;
}

export const CloudSyncBadge: React.FC<CloudSyncBadgeProps> = ({
  syncState,
  onManualSync,
}) => {
  return (
    <div className="flex items-center gap-2">
      {syncState.status === 'syncing' && (
        <button
          disabled
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full"
        >
          <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
          <span>Sincronizando Online...</span>
        </button>
      )}

      {syncState.status === 'synced' && (
        <button
          onClick={onManualSync}
          title="Conectado y sincronizado online en tiempo real. Clic para actualizar."
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition shadow-xs cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Cloud className="w-3 h-3 text-emerald-600" />
          <span>Online</span>
        </button>
      )}

      {syncState.status === 'offline' && (
        <button
          onClick={onManualSync}
          title="Modo offline: los datos están guardados en tu dispositivo y se sincronizarán al volver la conexión."
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full"
        >
          <WifiOff className="w-3 h-3 text-amber-600" />
          <span>Modo Local</span>
        </button>
      )}

      {syncState.status === 'error' && (
        <button
          onClick={onManualSync}
          title="Sin conexión online. Clic para reintentar."
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full"
        >
          <RefreshCw className="w-3 h-3 text-rose-600" />
          <span>Reconectar</span>
        </button>
      )}
    </div>
  );
};
