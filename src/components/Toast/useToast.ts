import { useToastContext } from "@/components/Toast/ToastContext";

export function useToast() {
  const ctx = useToastContext();
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return {
    toasts: ctx.toasts,
    toast: ctx.push,
    dismissToast: ctx.dismiss,
    clearToasts: ctx.clear,
  };
}
