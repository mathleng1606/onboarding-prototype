import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toast';

/** Short message at the bottom of the screen (e.g. « Pas inclus dans ce prototype »). Use it with useToast(). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] py-2.5 px-4 rounded-md bg-brand-900 text-white text-sm shadow-lg"
        >
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
