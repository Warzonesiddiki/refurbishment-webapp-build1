import type { AuditFilter, AuditLogRecord } from "@/store/types/AuditTypes";
import type { IntegrityRecord } from "@/store/types/IntegrityTypes";
import type { EntitySnapshot } from "@/store/types/SnapshotTypes";
import { computeChecksum } from "@/utils/integrityChecker";

export type AuditState = {
  logs: AuditLogRecord[];
  snapshots: Record<string, Record<string, EntitySnapshot[]>>;
  integrityRecords: Record<string, IntegrityRecord>;
  lastVerificationAt: string | null;
};

export type AuditAction =
  | { type: "APPEND_AUDIT_LOG"; payload: AuditLogRecord }
  | { type: "CREATE_ENTITY_SNAPSHOT"; payload: { entityType: string; entityId: string; data: Record<string, unknown>; auditLogId: string; description: string; createdBy?: string | null } }
  | { type: "RECORD_INTEGRITY_CHECK"; payload: { entityType: string; entityId: string; checksum: string; isValid: boolean } }
  | { type: "CLEAR_OLD_AUDIT_LOGS"; payload: { olderThan: string; keepMin?: number; hasOpenPeriod?: boolean } }
  | { type: "EXPORT_AUDIT_LOGS"; payload: { filter: Partial<AuditFilter> } };

export const createInitialAuditState = (): AuditState => ({
  logs: [],
  snapshots: {},
  integrityRecords: {},
  lastVerificationAt: null,
});

const MAX_LOGS = 10000;
const MAX_SNAPSHOTS_PER_ENTITY = 100;

export function auditReducer(state: AuditState, action: AuditAction): AuditState {
  switch (action.type) {
    case "APPEND_AUDIT_LOG": {
      const logs = [...state.logs, action.payload];
      return { ...state, logs: logs.slice(-MAX_LOGS) };
    }
    case "CREATE_ENTITY_SNAPSHOT": {
      const current = state.snapshots[action.payload.entityType]?.[action.payload.entityId] ?? [];
      const version = (current.at(-1)?.version ?? 0) + 1;
      // async checksum precomputed fallback to stable placeholder for reducer purity
      const checksum = `pending:${version}`;
      const snapshot: EntitySnapshot = {
        id: crypto.randomUUID(),
        entityType: action.payload.entityType,
        entityId: action.payload.entityId,
        version,
        data: action.payload.data,
        checksum,
        createdAt: new Date().toISOString(),
        createdBy: action.payload.createdBy ?? null,
        auditLogId: action.payload.auditLogId,
        changeDescription: action.payload.description,
      };
      const nextEntitySnapshots = [...current, snapshot].slice(-MAX_SNAPSHOTS_PER_ENTITY);
      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [action.payload.entityType]: {
            ...(state.snapshots[action.payload.entityType] ?? {}),
            [action.payload.entityId]: nextEntitySnapshots,
          },
        },
      };
    }
    case "RECORD_INTEGRITY_CHECK": {
      const key = `${action.payload.entityType}:${action.payload.entityId}`;
      const existing = state.integrityRecords[key];
      const next: IntegrityRecord = {
        entityType: action.payload.entityType,
        entityId: action.payload.entityId,
        checksum: action.payload.checksum,
        computedAt: existing?.computedAt ?? new Date().toISOString(),
        isValid: action.payload.isValid,
        lastVerifiedAt: new Date().toISOString(),
        verificationCount: (existing?.verificationCount ?? 0) + 1,
      };
      return { ...state, integrityRecords: { ...state.integrityRecords, [key]: next }, lastVerificationAt: next.lastVerifiedAt };
    }
    case "CLEAR_OLD_AUDIT_LOGS": {
      if (action.payload.hasOpenPeriod) throw new Error("Cannot clear logs from open financial period");
      const keepMin = action.payload.keepMin ?? 200;
      const filtered = state.logs.filter((l) => +new Date(l.timestamp) >= +new Date(action.payload.olderThan));
      return { ...state, logs: filtered.length >= keepMin ? filtered : state.logs.slice(-keepMin) };
    }
    case "EXPORT_AUDIT_LOGS":
      return state;
    default:
      return state;
  }
}

export async function finalizeSnapshotChecksum(snapshot: EntitySnapshot) {
  return { ...snapshot, checksum: await computeChecksum(snapshot.data) };
}
