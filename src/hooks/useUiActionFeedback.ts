import { useState, useCallback } from "react";

export type UiFeedback = {
  open: boolean;
  tone: "success" | "error" | "info";
  message: string;
};

export function useUiActionFeedback() {
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const trigger = useCallback((tone: UiFeedback["tone"], message: string) => {
    setFeedback({ open: true, tone, message });
    setTimeout(() => setFeedback((curr) => (curr && curr.message === message ? null : curr)), 2500);
  }, []);

  return { feedback, trigger };
}
