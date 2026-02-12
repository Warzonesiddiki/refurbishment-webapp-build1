import { useMemo, useState } from "react";
import type { BackupState } from "@/store/reducers/backupReducer";
import { selectShouldRemindBackup } from "@/store/selectors/backupSelectors";

export function useBackupReminder(state: BackupState) {
  const [dismissed, setDismissed] = useState(false);
  const status = useMemo(() => selectShouldRemindBackup(state), [state]);
  return {
    shouldBackup: !dismissed && status.should,
    reason: dismissed ? null : status.reason,
    lastBackupAt: state.lastBackup?.at ?? null,
    changesSinceBackup: state.changeTracker.changesSinceBackup,
    dismiss: () => setDismissed(true),
    snooze: (_duration: number) => setDismissed(true),
    triggerBackup: () => setDismissed(false),
  };
}
