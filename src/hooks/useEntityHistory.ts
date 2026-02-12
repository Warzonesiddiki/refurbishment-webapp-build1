import { useMemo } from "react";
import type { EntitySnapshot } from "@/store/types/SnapshotTypes";

export function useEntityHistory(entityType: string, entityId: string, snapshots: EntitySnapshot[]) {
  return useMemo(() => {
    const filtered = snapshots.filter((s) => s.entityType === entityType && s.entityId === entityId).sort((a, b) => a.version - b.version);
    return { snapshots: filtered, currentVersion: filtered.at(-1)?.version ?? 0 };
  }, [entityType, entityId, snapshots]);
}
