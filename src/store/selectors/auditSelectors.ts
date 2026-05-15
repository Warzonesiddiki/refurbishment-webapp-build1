import type { AuditFilter, AuditLogRecord } from "@/store/types/AuditTypes";
import type { EntitySnapshot } from "@/store/types/SnapshotTypes";
import type { AuditState } from "@/store/reducers/auditReducer";

export function selectAuditLogs(state: AuditState, filter: Partial<AuditFilter> = {}): AuditLogRecord[] {
  const term = filter.searchTerm?.toLowerCase();
  return state.logs
    .filter((log) => {
      if (filter.result && log.result !== filter.result) return false;
      if (filter.actions?.length && !filter.actions.includes(log.action)) return false;
      if (filter.categories?.length && !filter.categories.includes(log.category)) return false;
      if (filter.entityTypes?.length && !filter.entityTypes.includes(log.entityType)) return false;
      if (filter.entityId && log.entityId !== filter.entityId) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.startDate && +new Date(log.timestamp) < +new Date(filter.startDate)) return false;
      if (filter.endDate && +new Date(log.timestamp) > +new Date(filter.endDate)) return false;
      if (term) {
        const hay = `${log.action} ${log.entityRef ?? ""} ${log.entityType} ${log.userName ?? ""} ${log.errorMessage ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export const selectAuditLogsByEntity = (state: AuditState, entityType: string, entityId: string) =>
  state.logs.filter((l) => l.entityType === entityType && l.entityId === entityId);

export const selectEntitySnapshots = (state: AuditState, entityType: string, entityId: string): EntitySnapshot[] =>
  state.snapshots[entityType]?.[entityId] ?? [];

export const selectLatestSnapshot = (state: AuditState, entityType: string, entityId: string) =>
  selectEntitySnapshots(state, entityType, entityId).at(-1) ?? null;

export const selectSnapshotAtVersion = (state: AuditState, entityType: string, entityId: string, version: number) =>
  selectEntitySnapshots(state, entityType, entityId).find((s) => s.version === version) ?? null;

export const selectIntegrityStatus = (state: AuditState) => {
  const values = Object.values(state.integrityRecords);
  return {
    valid: values.filter((v) => v.isValid).length,
    invalid: values.filter((v) => !v.isValid).length,
    pending: Math.max(0, state.logs.length - values.length),
  };
};

export const selectRecentActivity = (state: AuditState, limit = 20) => [...state.logs].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, limit);

export const selectAuditStats = (state: AuditState, period: "day" | "week" | "month") => {
  const ms = period === "day" ? 86400000 : period === "week" ? 7 * 86400000 : 30 * 86400000;
  const cutoff = Date.now() - ms;
  const logs = state.logs.filter((l) => +new Date(l.timestamp) >= cutoff);
  const byCategory: Record<string, number> = {};
  const byUser: Record<string, number> = {};
  const byResult = { success: 0, failure: 0, blocked: 0 };
  const actionMap = new Map<string, number>();
  logs.forEach((l) => {
    byCategory[l.category] = (byCategory[l.category] ?? 0) + 1;
    if (l.userId) byUser[l.userId] = (byUser[l.userId] ?? 0) + 1;
    if (l.result === "SUCCESS") byResult.success += 1;
    if (l.result === "FAILURE") byResult.failure += 1;
    if (l.result === "BLOCKED") byResult.blocked += 1;
    actionMap.set(l.action, (actionMap.get(l.action) ?? 0) + 1);
  });
  const topActions = [...actionMap.entries()].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  return { totalActions: logs.length, byCategory, byResult, byUser, topActions };
};

export const selectFailedActions = (state: AuditState, since?: string) =>
  state.logs.filter((l) => l.result === "FAILURE" && (!since || +new Date(l.timestamp) >= +new Date(since)));
