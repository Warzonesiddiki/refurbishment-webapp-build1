import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { AppState } from "@/store/appState";
import type { BackupFile } from "@/store/types/BackupTypes";
import { createFullBackup, downloadBackup } from "@/utils/backup/createBackup";
import { validateBackupFile } from "@/utils/backup/validateBackup";
import { RestorePreview } from "@/components/Backup/RestorePreview";
import { PasswordInput } from "@/components/Backup/PasswordInput";
import { BackupProgress } from "@/components/Backup/BackupProgress";
import type { RestoreOptions, RestorePreview as RestorePreviewData } from "@/store/types/RestoreTypes";

type ValidationWarningItem = { code: string; message: string; severity: "low" | "medium" | "high" };

function toWarningItems(items: Array<{ code: string; message: string; severity: "low" | "medium" | "high" }>): ValidationWarningItem[] {
  return items.map((item) => ({ code: item.code, message: item.message, severity: item.severity }));
}

function normalizeValidationWarnings(items: ValidationWarningItem[]): ValidationWarningItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.code}:${item.message}:${item.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const EMPTY_PREVIEW: RestorePreviewData = {
  modules: [],
  totalChanges: { additions: 0, updates: 0, deletions: 0, conflicts: 0 },
  conflicts: [],
  sequenceUpdates: {},
  estimatedDuration: 100,
};

export function BackupRestoreModal({ open, mode, state, onClose, onRestore }: { open: boolean; mode: "EXPORT" | "IMPORT"; state: AppState; onClose: () => void; onRestore: (backup: BackupFile, options: RestoreOptions) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<BackupFile | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarningItem[]>([]);
  const [restorePreview, setRestorePreview] = useState<RestorePreviewData>(EMPTY_PREVIEW);
  const progress = useMemo(() => (busy ? 70 : 0), [busy]);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setBackup(null);
      setValidationError(null);
      setOperationError(null);
      setValidationWarnings([]);
      setRestorePreview(EMPTY_PREVIEW);
      setPassword("");
      return;
    }

    if (mode === "EXPORT") {
      setBackup(null);
      setValidationError(null);
      setOperationError(null);
      setValidationWarnings([]);
      setRestorePreview(EMPTY_PREVIEW);
    }
  }, [mode, open]);

  const createExport = async () => {
    setValidationError(null);
    setOperationError(null);
    setValidationWarnings([]);
    setBusy(true);
    try {
      const b = await createFullBackup(state, { encrypt: { enabled: Boolean(password), password: password || undefined } });
      downloadBackup(b);
    } catch {
      setOperationError("Unable to create backup. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setValidationError(null);
    setOperationError(null);
    setValidationWarnings([]);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const result = await validateBackupFile(file, password || undefined);
        if (!result.valid || !result.backup) {
          setValidationError(result.errors[0]?.message ?? "Invalid backup");
          setValidationWarnings(normalizeValidationWarnings(toWarningItems(result.warnings)));
          setBackup(null);
          setRestorePreview(EMPTY_PREVIEW);
        } else {
          setValidationError(null);
          setValidationWarnings(normalizeValidationWarnings(toWarningItems(result.warnings)));
          setBackup(result.backup);
          setRestorePreview(result.preview ?? EMPTY_PREVIEW);
        }
      } catch {
        setOperationError("Unable to import backup. Please try again.");
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };



  const warningToneClass = (severity: ValidationWarningItem["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-300";
      case "medium":
        return "text-yellow-300";
      default:
        return "text-cyan-300";
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "EXPORT" ? "Backup Export" : "Backup Import"}>
      <div className="space-y-3">
        <PasswordInput value={password} onChange={setPassword} label="Optional backup password" />
        {busy && <BackupProgress progress={progress} label={mode === "EXPORT" ? "Creating backup" : "Validating backup"} />}
        {validationError && <div className="text-red-400 text-sm">{validationError}</div>}
        {operationError && <div className="text-red-400 text-sm">{operationError}</div>}
        {validationWarnings.length > 0 && (
          <ul className="text-sm list-disc pl-5">
            {validationWarnings.map((warning) => (
              <li key={`${warning.code}:${warning.message}:${warning.severity}`} className={warningToneClass(warning.severity)}>{`[${warning.severity.toUpperCase()}] ${warning.message}`}</li>
            ))}
          </ul>
        )}

        {mode === "EXPORT" && <button className="btn-cyber" onClick={createExport}>Generate and Download</button>}
        {mode === "IMPORT" && !backup && <button className="btn-cyber" onClick={handleImport}>Select Backup File</button>}

        {mode === "IMPORT" && backup && (
          <RestorePreview
            backup={backup}
            preview={restorePreview}
            onCancel={onClose}
            onConfirm={(options) => {
              onRestore(backup, options);
              setBackup(null);
              setPassword("");
              setValidationWarnings([]);
              setRestorePreview(EMPTY_PREVIEW);
              onClose();
            }}
          />
        )}
      </div>
    </Modal>
  );
}
