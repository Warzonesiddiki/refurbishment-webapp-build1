import { useEffect } from "react";

export function useAnnouncer(message: string) {
  useEffect(() => {
    if (!message) return;
    const node = document.getElementById("route-announcer");
    if (node) node.textContent = message;
  }, [message]);
}
