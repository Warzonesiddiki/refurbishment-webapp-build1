export function BackupProgress({ progress, label }: { progress: number; label?: string }) {
  return (
    <div data-component="Backup-BackupProgress" data-testid="component-Backup-BackupProgress" className="space-y-1">
      <div className="flex justify-between text-xs"><span>{label ?? "Progress"}</span><span>{progress}%</span></div>
      <div className="h-2 rounded bg-cyan-500/10"><div className="h-2 rounded bg-cyan-400" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    </div>
  );
}
