import { useOfflineReplayAudit } from "@/hooks/useOfflineReplayAudit";
import { cn } from "@/utils/cn";

type OfflineReplayAuditPanelProps = {
  theme?: "cyber" | "pro";
};

export function OfflineReplayAuditPanel({ theme = "cyber" }: OfflineReplayAuditPanelProps) {
  const { records, clear, toCsv } = useOfflineReplayAudit();

  if (records.length === 0) return null;

  const exportCsv = () => {
    const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offline-replay-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-xs",
        theme === "pro" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-cyan-500/20 bg-cyan-500/5 text-cyan-200"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Replay audit: {records.length}</p>
        <div className="flex items-center gap-1">
          <button className="btn-ghost text-[11px]" onClick={exportCsv}>Export CSV</button>
          <button className="btn-ghost text-[11px]" onClick={clear}>Clear</button>
        </div>
      </div>
      <p className="opacity-80 mt-1">Tracks replayed/dismissed offline actions for audit handoff.</p>
    </div>
  );
}
