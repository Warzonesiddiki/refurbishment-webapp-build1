import type { BackupHistoryEntry } from "@/store/reducers/backupReducer";

export function BackupHistory({ items }: { items: BackupHistoryEntry[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold">Backup History</h4>
      <ul className="space-y-1 text-xs">
        {items.map((x) => <li key={x.id} className="flex justify-between"><span>{x.type} • {new Date(x.at).toLocaleString()}</span><span>{x.modules.join(", ")}</span></li>)}
      </ul>
    </div>
  );
}
