import { useCallback, useEffect, useState } from "react";
import {
  clearOfflineQueue,
  countOfflineConflicts,
  countRepeatedConflictExceptions,
  enqueueOfflineAction,
  OfflineAction,
  readOfflineQueue,
  removeOfflineAction,
  replayOfflineAction,
} from "@/utils/offlineQueue";
import { appendOfflineReplayAudit } from "@/utils/offlineReplayAudit";

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);

  const refresh = useCallback(() => {
    setQueue(readOfflineQueue());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enqueue = useCallback((action: Omit<OfflineAction, "id" | "ts" | "status" | "conflictKey">) => {
    setQueue(enqueueOfflineAction(action));
  }, []);

  const remove = useCallback((id: string) => {
    const current = readOfflineQueue();
    const target = current.find((item) => item.id === id);
    if (target) appendOfflineReplayAudit(target, "dismissed");
    setQueue(removeOfflineAction(id));
  }, []);

  const replay = useCallback((id: string) => {
    const replayed = replayOfflineAction(id);
    if (replayed) appendOfflineReplayAudit(replayed, "replayed");
    setQueue(readOfflineQueue());
    return replayed;
  }, []);

  const clear = useCallback(() => {
    clearOfflineQueue();
    setQueue([]);
  }, []);

  return {
    queue,
    refresh,
    enqueue,
    remove,
    replay,
    clear,
    conflictCount: countOfflineConflicts(queue),
    repeatedConflictExceptions: countRepeatedConflictExceptions(queue),
  };
}
