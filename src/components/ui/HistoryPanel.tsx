type HistoryEntry = { ts: string; action: string; user?: string };

type Props = {
  title?: string;
  entries: HistoryEntry[];
};

export function HistoryPanel({ title = "History", entries }: Props) {
  return (
    <div className="glass-card p-4 border border-cyan-500/10">
      <h4 className="text-xs font-bold neon-text-cyan mb-3" style={{ fontFamily: "var(--font-heading)" }}>{title}</h4>
      {entries.length === 0 ? (
        <p className="text-xs text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>No history available.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500/40 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-cyan-100/70">{e.action}</p>
                <p className="text-[10px] text-cyan-500/25" style={{ fontFamily: "var(--font-mono)" }}>{e.ts}{e.user ? ` • ${e.user}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
