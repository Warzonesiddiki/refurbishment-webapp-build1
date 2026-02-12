import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { AppState } from "@/store/appState";
import type { BackupFile } from "@/store/types/BackupTypes";
import { createFullBackup, downloadBackup } from "@/utils/backup/createBackup";
import { validateBackupFile } from "@/utils/backup/validateBackup";
import { RestorePreview } from "@/components/Backup/RestorePreview";
import { PasswordInput } from "@/components/Backup/PasswordInput";
import { BackupProgress } from "@/components/Backup/BackupProgress";

export function BackupRestoreModal({ open, mode, state, onClose, onRestore }: { open: boolean; mode: "EXPORT" | "IMPORT"; state: AppState; onClose: () => void; onRestore: (backup: BackupFile) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<BackupFile | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const progress = useMemo(() => (busy ? 70 : 0), [busy]);

  const createExport = async () => {
    setBusy(true);
    const b = await createFullBackup(state, { encrypt: { enabled: Boolean(password), password: password || undefined } });
    downloadBackup(b);
    setBusy(false);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      const result = await validateBackupFile(file, password || undefined);
      if (!result.valid || !result.backup) {
        setValidationError(result.errors[0]?.message ?? "Invalid backup");
      } else {
        setBackup(result.backup);
      }
      setBusy(false);
    };
    input.click();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "EXPORT" ? "Backup Export" : "Backup Import"}>
      <div className="space-y-3">
        <PasswordInput value={password} onChange={setPassword} label="Optional backup password" />
        {busy && <BackupProgress progress={progress} label={mode === "EXPORT" ? "Creating backup" : "Validating backup"} />}
        {validationError && <div className="text-red-400 text-sm">{validationError}</div>}

        {mode === "EXPORT" && <button className="btn-cyber" onClick={createExport}>Generate and Download</button>}
        {mode === "IMPORT" && !backup && <button className="btn-cyber" onClick={handleImport}>Select Backup File</button>}

        {mode === "IMPORT" && backup && (
          <RestorePreview
            backup={backup}
            preview={{ modules: [], totalChanges: { additions: 0, updates: 0, deletions: 0, conflicts: 0 }, conflicts: [], sequenceUpdates: {}, estimatedDuration: 100 }}
            onCancel={onClose}
            onConfirm={() => {
              onRestore(backup);
              onClose();
            }}
          />
        )}
      </div>
    </Modal>
  );
}
