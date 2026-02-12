import { useState, useCallback } from "react";
import { useActionFeedbackContext } from "@/context/ActionFeedbackContext";

export type UiFeedback = {
  open: boolean;
  tone: "success" | "error" | "warn" | "info";
  message: string;
};

export function useUiActionFeedback() {
  const ctx = useActionFeedbackContext();
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const triggerFallback = useCallback((tone: UiFeedback["tone"], message: string) => {
    setFeedback({ open: true, tone, message });
    setTimeout(() => setFeedback((curr) => (curr && curr.message === message ? null : curr)), 2500);
  }, []);

  if (ctx) {
    return {
      feedback: ctx.feedback,
      trigger: ctx.trigger,
    };
  }

  return { feedback, trigger: triggerFallback };
}
