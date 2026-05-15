import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "warn" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (tone: ToastTone, message: string, action?: ToastAction) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback((tone: ToastTone, message: string, action?: ToastAction) => {
    const id = toastId();
    setToasts((curr) => [{ id, tone, message, action }, ...curr].slice(0, 5));
    timers.current[id] = window.setTimeout(() => dismiss(id), 5000);
    return id;
  }, [dismiss]);

  const clear = useCallback(() => {
    Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    timers.current = {};
    setToasts([]);
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss, clear }), [toasts, push, dismiss, clear]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  return useContext(ToastContext);
}
