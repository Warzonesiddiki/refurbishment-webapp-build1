import { useCallback, useEffect, useState } from "react";
import {
  appendOfflineReplayAudit,
  clearOfflineReplayAudit,
  OfflineReplayAuditRecord,
  readOfflineReplayAudit,
  replayAuditToCsv,
} from "@/utils/offlineReplayAudit";
import type { OfflineAction } from "@/utils/offlineQueue";

export function useOfflineReplayAudit() {
  const [records, setRecords] = useState<OfflineReplayAuditRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(readOfflineReplayAudit());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const append = useCallback((action: Pick<OfflineAction, "type" | "summary">, outcome: OfflineReplayAuditRecord["outcome"]) => {
    setRecords(appendOfflineReplayAudit(action, outcome));
  }, []);

  const clear = useCallback(() => {
    clearOfflineReplayAudit();
    setRecords([]);
  }, []);

  const toCsv = useCallback(() => replayAuditToCsv(records), [records]);

  return { records, refresh, append, clear, toCsv };
}
