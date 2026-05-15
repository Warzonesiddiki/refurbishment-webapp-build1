import type { ChangeTracker } from "@/store/types/IncrementalBackupTypes";
import { initChangeTracker, recordChange, resetTracker } from "@/utils/backup/incrementalTracker";

export type BackupHistoryEntry = { id: string; type: "FULL" | "INCREMENTAL"; at: string; checksum: string; modules: string[] };
export type RollbackPoint = { id: string; at: string; reason: string; snapshot: unknown };
export type BackupSettings = {
  autoReminder: boolean;
  reminderThreshold: number;
  reminderInterval: number;
  includeAuditInBackup: boolean;
  defaultEncryption: boolean;
  compressionEnabled: boolean;
  snoozeUntil: string | null;
};

export type BackupState = {
  lastBackup: BackupHistoryEntry | null;
  backupHistory: BackupHistoryEntry[];
  rollbackPoints: RollbackPoint[];
  changeTracker: ChangeTracker;
  settings: BackupSettings;
};

export type BackupAction =
  | { type: "RECORD_BACKUP"; payload: { id: string; type: "FULL" | "INCREMENTAL"; checksum: string; modules: string[] } }
  | { type: "CREATE_ROLLBACK_POINT"; payload: { reason: string; snapshot: unknown } }
  | { type: "EXECUTE_ROLLBACK"; payload: { rollbackId: string } }
  | { type: "DELETE_ROLLBACK_POINT"; payload: { rollbackId: string } }
  | { type: "UPDATE_BACKUP_SETTINGS"; payload: Partial<BackupSettings> }
  | { type: "TRACK_CHANGE"; payload: { entityType: string; entityId: string; changeType: "CREATE" | "UPDATE" | "DELETE" } }
  | { type: "DISMISS_BACKUP_REMINDER"; payload: { snoozeUntil?: string } };

export const createInitialBackupState = (): BackupState => ({
  lastBackup: null,
  backupHistory: [],
  rollbackPoints: [],
  changeTracker: initChangeTracker(),
  settings: {
    autoReminder: true,
    reminderThreshold: 100,
    reminderInterval: 7,
    includeAuditInBackup: false,
    defaultEncryption: false,
    compressionEnabled: false,
    snoozeUntil: null,
  },
});

export function backupReducer(state: BackupState, action: BackupAction): BackupState {
  switch (action.type) {
    case "RECORD_BACKUP": {
      const entry: BackupHistoryEntry = { ...action.payload, at: new Date().toISOString() };
      const tracker = structuredClone(state.changeTracker);
      resetTracker(tracker, action.payload.id, action.payload.type);
      return { ...state, lastBackup: entry, backupHistory: [entry, ...state.backupHistory].slice(0, 100), changeTracker: tracker };
    }
    case "CREATE_ROLLBACK_POINT": {
      const point: RollbackPoint = { id: crypto.randomUUID(), at: new Date().toISOString(), reason: action.payload.reason, snapshot: action.payload.snapshot };
      return { ...state, rollbackPoints: [point, ...state.rollbackPoints].slice(0, 5) };
    }
    case "EXECUTE_ROLLBACK":
      return state;
    case "DELETE_ROLLBACK_POINT":
      return { ...state, rollbackPoints: state.rollbackPoints.filter((x) => x.id !== action.payload.rollbackId) };
    case "UPDATE_BACKUP_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "TRACK_CHANGE": {
      const tracker = structuredClone(state.changeTracker);
      recordChange(tracker, action.payload.entityType, action.payload.entityId, action.payload.changeType);
      return { ...state, changeTracker: tracker };
    }
    case "DISMISS_BACKUP_REMINDER":
      return { ...state, settings: { ...state.settings, snoozeUntil: action.payload.snoozeUntil ?? null } };
    default:
      return state;
  }
}
