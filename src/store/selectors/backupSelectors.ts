import type { BackupState } from "@/store/reducers/backupReducer";
import type { BackupChain } from "@/store/types/IncrementalBackupTypes";

export const selectLastBackup = (state: BackupState) => state.lastBackup;
export const selectBackupHistory = (state: BackupState) => state.backupHistory;
export const selectChangesSinceBackup = (state: BackupState) => state.changeTracker.changesSinceBackup;
export const selectRollbackPoints = (state: BackupState) => state.rollbackPoints;
export const selectBackupSettings = (state: BackupState) => state.settings;

export const selectShouldRemindBackup = (state: BackupState) => {
  if (!state.settings.autoReminder) return { should: false, reason: null };
  if (state.settings.snoozeUntil && +new Date(state.settings.snoozeUntil) > Date.now()) return { should: false, reason: null };
  if (state.changeTracker.changesSinceBackup >= state.settings.reminderThreshold) return { should: true, reason: "Change threshold exceeded" };
  if (state.changeTracker.lastIncrementalBackupAt) {
    const days = (Date.now() - +new Date(state.changeTracker.lastIncrementalBackupAt)) / 86400000;
    if (days >= state.settings.reminderInterval) return { should: true, reason: "Time threshold exceeded" };
  }
  return { should: false, reason: null };
};

export const selectIncrementalChain = (state: BackupState): BackupChain | null => {
  const full = [...state.backupHistory].find((x) => x.type === "FULL");
  if (!full) return null;
  const incrementals = state.backupHistory.filter((x) => x.type === "INCREMENTAL").map((x) => ({ id: x.id, at: x.at, changeCount: 0 }));
  return { fullBackupId: full.id, fullBackupAt: full.at, incrementals, totalChanges: state.changeTracker.changesSinceBackup, chainValid: true };
};

export const selectBackupStorageUsage = (state: BackupState) => ({
  rollbackPoints: state.rollbackPoints.length,
  totalSize: JSON.stringify(state.rollbackPoints).length + JSON.stringify(state.backupHistory).length,
});
