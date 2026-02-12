import { useMemo, useState } from "react";
import type { PartRecord } from "@/store/types/PartTypes";
import { calculateStockAlerts } from "@/store/alerts/stockAlerts";

export function useStockAlerts(parts: PartRecord[]) {
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());
  const alerts = useMemo(() => calculateStockAlerts(parts).map((a) => ({ ...a, acknowledgedAt: ackIds.has(a.id) ? new Date().toISOString() : undefined })), [parts, ackIds]);

  return {
    alerts,
    acknowledge: (id: string) => setAckIds((curr) => new Set([...curr, id])),
    dismissAll: () => setAckIds(new Set(alerts.map((a) => a.id))),
    unacknowledgedCount: alerts.filter((a) => !ackIds.has(a.id)).length,
  };
}
