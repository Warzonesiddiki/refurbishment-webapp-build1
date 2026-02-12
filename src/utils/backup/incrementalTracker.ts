import type { ChangeTracker } from "@/store/types/IncrementalBackupTypes";

export type BackupReminderConfig = {
  changeThreshold: number;
  timeThresholdMs: number;
  criticalChangeTypes: string[];
};

export function initChangeTracker(): ChangeTracker {
  return {
    lastFullBackupAt: null,
    lastIncrementalBackupAt: null,
    lastBackupId: null,
    changesSinceBackup: 0,
    changedEntities: {},
    deletedEntities: {},
    sequenceChanges: {},
  };
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

export function recordChange(
  tracker: ChangeTracker,
  entityType: string,
  entityId: string,
  changeType: "CREATE" | "UPDATE" | "DELETE"
) {
  tracker.changesSinceBackup += 1;
  if (changeType === "DELETE") {
    tracker.deletedEntities[entityType] = tracker.deletedEntities[entityType] ?? [];
    pushUnique(tracker.deletedEntities[entityType], entityId);
  } else {
    tracker.changedEntities[entityType] = tracker.changedEntities[entityType] ?? [];
    pushUnique(tracker.changedEntities[entityType], entityId);
  }
}

export function getChangesSinceBackup(tracker: ChangeTracker) {
  return { changes: tracker.changesSinceBackup, entities: tracker.changedEntities };
}

export function resetTracker(tracker: ChangeTracker, backupId: string, backupType: "FULL" | "INCREMENTAL") {
  const now = new Date().toISOString();
  tracker.lastBackupId = backupId;
  if (backupType === "FULL") tracker.lastFullBackupAt = now;
  tracker.lastIncrementalBackupAt = now;
  tracker.changesSinceBackup = 0;
  tracker.changedEntities = {};
  tracker.deletedEntities = {};
  tracker.sequenceChanges = {};
}

export function shouldSuggestBackup(tracker: ChangeTracker, config: BackupReminderConfig) {
  const now = Date.now();
  const last = tracker.lastIncrementalBackupAt ? +new Date(tracker.lastIncrementalBackupAt) : 0;
  const criticalTouched = config.criticalChangeTypes.some((type) => (tracker.changedEntities[type]?.length ?? 0) > 0);
  return (
    tracker.changesSinceBackup >= config.changeThreshold ||
    (last > 0 && now - last >= config.timeThresholdMs) ||
    criticalTouched
  );
}
