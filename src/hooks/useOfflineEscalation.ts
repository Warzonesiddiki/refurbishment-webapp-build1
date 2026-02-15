import { useCallback, useMemo } from "react";
import { acknowledgeEscalation, clearEscalationAck, shouldShowEscalation } from "@/utils/offlineEscalation";
import type { OfflineAction } from "@/utils/offlineQueue";

export function useOfflineEscalation(queue: OfflineAction[]) {
  const showEscalation = useMemo(() => shouldShowEscalation(queue), [queue]);

  const acknowledge = useCallback(() => {
    acknowledgeEscalation();
  }, []);

  const resetAck = useCallback(() => {
    clearEscalationAck();
  }, []);

  return { showEscalation, acknowledge, resetAck };
}
