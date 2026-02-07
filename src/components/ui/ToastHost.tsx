import { Toast } from "@/components/ui/Toast";
import { useActionFeedbackContext } from "@/context/ActionFeedbackContext";

export function ToastHost() {
  const ctx = useActionFeedbackContext();
  if (!ctx?.feedback) return null;
  const { feedback, clear } = ctx;
  return <Toast open={feedback.open} tone={feedback.tone} message={feedback.message} onClose={clear} />;
}
