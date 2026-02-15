import type { OfflineAction } from "@/utils/offlineQueue";

export type OfflineConflictSeverity = "normal" | "warning" | "critical";

export const WARNING_CONFLICT_THRESHOLD = 2;
export const CRITICAL_CONFLICT_THRESHOLD = 5;

export function resolveOfflineConflictSeverity(queue: OfflineAction[]): OfflineConflictSeverity {
  const conflicts = queue.filter((item) => item.status === "conflict").length;
  if (conflicts >= CRITICAL_CONFLICT_THRESHOLD) return "critical";
  if (conflicts >= WARNING_CONFLICT_THRESHOLD) return "warning";
  return "normal";
}

export function shouldEscalateConflict(queue: OfflineAction[]): boolean {
  return resolveOfflineConflictSeverity(queue) === "critical";
}
