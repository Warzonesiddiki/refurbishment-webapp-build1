import type { BackupHistoryEntry, BackupSettings as BackupSettingsType, RollbackPoint } from "@/store/reducers/backupReducer";
import { BackupHistory } from "@/components/Backup/BackupHistory";
import { RollbackManager } from "@/components/Backup/RollbackManager";

export function BackupSettings({ settings, history, rollbackPoints, onSettingsChange, onFullBackup, onIncrementalBackup, onRollback, onDeleteRollback }: {
  settings: BackupSettingsType;
  history: BackupHistoryEntry[];
  rollbackPoints: RollbackPoint[];
  onSettingsChange: (next: Partial<BackupSettingsType>) => void;
  onFullBackup: () => void;
  onIncrementalBackup: () => void;
  onRollback: (id: string) => void;
  onDeleteRollback: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold neon-text-cyan">BACKUP SETTINGS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <label><input type="checkbox" checked={settings.autoReminder} onChange={(e) => onSettingsChange({ autoReminder: e.target.checked })} /> Auto reminder</label>
        <label><input type="checkbox" checked={settings.includeAuditInBackup} onChange={(e) => onSettingsChange({ includeAuditInBackup: e.target.checked })} /> Include audit logs</label>
        <label><input type="checkbox" checked={settings.compressionEnabled} onChange={(e) => onSettingsChange({ compressionEnabled: e.target.checked })} /> Compression</label>
        <label><input type="checkbox" checked={settings.defaultEncryption} onChange={(e) => onSettingsChange({ defaultEncryption: e.target.checked })} /> Default encryption</label>
      </div>
      <div className="flex gap-2"><button className="btn-cyber" onClick={onFullBackup}>Create Full Backup Now</button><button className="btn-ghost" onClick={onIncrementalBackup}>Create Incremental Backup</button></div>
      <BackupHistory items={history} />
      <RollbackManager points={rollbackPoints} onRollback={onRollback} onDelete={onDeleteRollback} />
    </div>
  );
}
