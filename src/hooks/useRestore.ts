import { useState } from "react";
import type { BackupFile } from "@/store/types/BackupTypes";
import type { AppState } from "@/store/appState";
import type { RestoreOptions } from "@/store/types/RestoreTypes";
import { executeRestore } from "@/utils/backup/restoreEngine";

export function useRestore() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function restore(backup: BackupFile, state: AppState, options: RestoreOptions) {
    try {
      setRunning(true);
      setError(null);
      return await executeRestore(backup, state, options);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
      throw e;
    } finally {
      setRunning(false);
    }
  }

  return { restore, running, error };
}
