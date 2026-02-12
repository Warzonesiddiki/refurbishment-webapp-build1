import { ToastProvider, useToastContext } from "@/components/Toast/ToastContext";

export type UiFeedback = {
  open: boolean;
  tone: "success" | "error" | "warn" | "info";
  message: string;
};

export type ActionFeedbackContextValue = {
  feedback: UiFeedback | null;
  trigger: (tone: UiFeedback["tone"], message: string) => void;
  clear: () => void;
};

export function ActionFeedbackProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function useActionFeedbackContext(): ActionFeedbackContextValue | null {
  const ctx = useToastContext();
  if (!ctx) return null;
  const feedback = ctx.toasts[0] ? { open: true, tone: ctx.toasts[0].tone, message: ctx.toasts[0].message } : null;
  return {
    feedback,
    trigger: (tone, message) => ctx.push(tone, message),
    clear: () => ctx.clear(),
  };
}
