import { useState } from "react";
import type { AuditLogRecord } from "@/store/types/AuditTypes";
import { StateInspector } from "@/components/DevTools/StateInspector";

export function ActionReplay({ logs }: { logs: AuditLogRecord[] }) {
  const [index, setIndex] = useState(0);
  const current = logs[index] ?? null;
  const dev = import.meta.env.DEV;
  if (!dev) return null;
  return (
    <div data-component="DevTools-ActionReplay" data-testid="component-DevTools-ActionReplay" className="glass-card p-4 space-y-2">
      <h3 className="font-bold">Action Replay (Dev Only)</h3>
      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))}>Step back</button>
        <button className="btn-ghost" onClick={() => setIndex((i) => Math.min(logs.length - 1, i + 1))}>Step forward</button>
      </div>
      <div>{index + 1} / {logs.length}</div>
      <StateInspector state={current} />
    </div>
  );
}
