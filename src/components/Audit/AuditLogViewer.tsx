import { useMemo, useState } from "react";
import type { AuditLogRecord } from "@/store/types/AuditTypes";
import { AuditSearch } from "@/components/Audit/AuditSearch";
import { AuditDetailModal } from "@/components/Audit/AuditDetailModal";

export function AuditLogViewer({ logs }: { logs: AuditLogRecord[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  const filtered = useMemo(() => logs.filter((l) => `${l.action} ${l.entityType} ${l.entityRef ?? ""}`.toLowerCase().includes(search.toLowerCase())), [logs, search]);

  return (
    <div className="glass-card p-4 space-y-3">
      <h2 className="text-lg font-bold">Audit Log Viewer</h2>
      <AuditSearch value={search} onChange={setSearch} />
      <div className="max-h-[300px] overflow-auto">
        <table className="w-full text-sm">
          <thead><tr><th>Timestamp</th><th>Action</th><th>Category</th><th>Entity</th><th>Result</th></tr></thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} onDoubleClick={() => setSelected(log)} className="cursor-pointer">
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.category}</td>
                <td>{log.entityRef ?? log.entityType}</td>
                <td>{log.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AuditDetailModal entry={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
