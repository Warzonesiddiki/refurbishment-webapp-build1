import type { AuditLogRecord } from "@/store/types/AuditTypes";

export function AuditTimeline({ logs }: { logs: AuditLogRecord[] }) {
  return (
    <div data-component="Audit-AuditTimeline" data-testid="component-Audit-AuditTimeline" className="glass-card p-4">
      <h3 className="font-bold mb-2">Audit Timeline</h3>
      <div className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="border-l-2 border-cyan-500/30 pl-3">
            <div className="text-xs text-cyan-500/60">{new Date(l.timestamp).toLocaleString()}</div>
            <div className="text-sm">{l.action} • {l.category} • {l.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
