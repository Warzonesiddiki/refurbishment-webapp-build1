import { cn } from "@/utils/cn";
import { useToast } from "@/components/Toast/useToast";

const toneStyles = {
  success: "border-green-500/40 text-green-300",
  error: "border-red-500/40 text-red-300",
  warn: "border-yellow-500/40 text-yellow-300",
  info: "border-cyan-500/40 text-cyan-300",
} as const;

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex w-[22rem] max-w-[92vw] flex-col gap-2" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "animate-slide-up rounded-xl border bg-black/75 px-4 py-3 shadow-lg backdrop-blur-sm",
            toneStyles[toast.tone]
          )}
          role="status"
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm">{toast.message}</p>
            {toast.action && (
              <button className="text-xs underline" onClick={toast.action.onClick}>
                {toast.action.label}
              </button>
            )}
            <button aria-label="Dismiss toast" className="text-xs opacity-80" onClick={() => dismissToast(toast.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
