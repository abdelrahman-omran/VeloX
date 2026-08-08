import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ToastContext } from './toast-context';

type ToastItem = {
  id: string;
  message: string;
};

const TOAST_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_MS);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast-in pointer-events-auto rounded-md border border-velox-border bg-velox-card px-4 py-3 text-sm text-velox-text shadow-lg"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
