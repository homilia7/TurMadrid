import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.error('Clear storage error:', e);
    }
    window.location.href = window.location.pathname + '?ts=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">TurMadrid España 2026</h1>
            <p className="text-sm text-stone-400 mb-6">
              Se detectó un detalle al sincronizar los datos locales. Puedes recargar la aplicación para continuar con los datos actualizados de Cloudflare.
            </p>

            {this.state.error && (
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-left mb-6 overflow-x-auto">
                <p className="text-xs font-mono text-red-400 font-semibold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Aplicación
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Limpiar Caché y Forzar Sincronización
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
