import { useEffect } from "react";

export function useUnsavedChanges(isDirty: boolean, message = "You have unsaved changes") {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);
}
