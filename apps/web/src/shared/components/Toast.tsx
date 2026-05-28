import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type ToastType = 'success' | 'error';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let toastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  toastFn?.(type, message);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastFn = (type, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
    return () => { toastFn = null; };
  }, []);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm animate-in slide-in-from-right',
            t.type === 'success' ? 'bg-slate-900 border-green-700 text-green-300' : 'bg-slate-900 border-red-700 text-red-300'
          )}>
            {t.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
