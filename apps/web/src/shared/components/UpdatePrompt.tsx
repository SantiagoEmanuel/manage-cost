import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            <RefreshCw className="h-5 w-5 text-violet-400" />
          </div>
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-100">Nueva versión disponible</h2>
          <p className="text-sm text-slate-400 mt-1">
            Hay una actualización de ManageCost lista para instalar. Actualizá ahora para acceder a las últimas mejoras.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setNeedRefresh(false)}
            className="flex-1"
          >
            Más tarde
          </Button>
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            className="flex-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
