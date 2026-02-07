import { createContext, useContext, useMemo, useState } from "react";
import type { UiFeedback } from "@/hooks/useUiActionFeedback";

export type ActionFeedbackContextValue = {
  feedback: UiFeedback | null;
  trigger: (tone: UiFeedback["tone"], message: string) => void;
  clear: () => void;
};

const ActionFeedbackContext = createContext<ActionFeedbackContextValue | null>(null);

export function ActionFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const trigger = (tone: UiFeedback["tone"], message: string) => {
    setFeedback({ open: true, tone, message });
    setTimeout(() => setFeedback((curr) => (curr && curr.message === message ? null : curr)), 2500);
  };

  const clear = () => setFeedback(null);

  const value = useMemo(() => ({ feedback, trigger, clear }), [feedback]);

  return <ActionFeedbackContext.Provider value={value}>{children}</ActionFeedbackContext.Provider>;
}

export function useActionFeedbackContext() {
  return useContext(ActionFeedbackContext);
}
