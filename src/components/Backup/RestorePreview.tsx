import { useState } from "react";
import type { BackupFile, BackupModule } from "@/store/types/BackupTypes";
import type { RestoreOptions, RestorePreview as RestorePreviewType } from "@/store/types/RestoreTypes";
import { PartialRestoreSelector } from "@/components/Backup/PartialRestoreSelector";

export function RestorePreview({ backup, preview, onConfirm, onCancel }: { backup: BackupFile; preview: RestorePreviewType; onConfirm: (options: RestoreOptions) => void; onCancel: () => void }) {
  const [modules, setModules] = useState<BackupModule[]>(backup.metadata.modules);
  const [conflictResolution, setConflictResolution] = useState<RestoreOptions["conflictResolution"]>("ASK");
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Restore Preview</h3>
      <div className="text-sm">Backup: {backup.backupType} • v{backup.version} • {new Date(backup.exportedAt).toLocaleString()} • {backup.encrypted ? "Encrypted" : "Unencrypted"}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-green-500/10">Additions: {preview.totalChanges.additions}</div>
        <div className="p-2 rounded bg-yellow-500/10">Updates: {preview.totalChanges.updates}</div>
        <div className="p-2 rounded bg-red-500/10">Deletions: {preview.totalChanges.deletions}</div>
        <div className="p-2 rounded bg-orange-500/10">Conflicts: {preview.conflicts.length}</div>
      </div>
      <PartialRestoreSelector available={backup.metadata.modules} selected={modules} onChange={setModules} />
      <select value={conflictResolution} onChange={(e) => setConflictResolution(e.target.value as RestoreOptions["conflictResolution"])}>
        <option value="ASK">ASK</option><option value="KEEP_CURRENT">KEEP_CURRENT</option><option value="USE_BACKUP">USE_BACKUP</option>
      </select>
      <input className="w-full px-3 py-2 rounded" placeholder="Type RESTORE" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
      <div className="flex gap-2"><button className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-cyber" disabled={confirmText !== "RESTORE"} onClick={() => onConfirm({ modules, conflictResolution, preserveSequences: false, dryRun: false, createRollbackPoint: true })}>Restore Selected Modules</button></div>
    </div>
  );
}
