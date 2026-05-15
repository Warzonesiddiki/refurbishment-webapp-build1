import { useMemo, useState } from "react";
import type { EntitySnapshot } from "@/store/types/SnapshotTypes";
import { computeDiff, formatDiffForDisplay } from "@/utils/diffCalculator";
import { DiffViewer } from "@/components/Audit/DiffViewer";

export function EntityHistory({ entityType, entityId, snapshots }: { entityType: string; entityId: string; snapshots: EntitySnapshot[] }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(Math.max(0, snapshots.length - 1));
  const diffs = useMemo(() => {
    const a = snapshots[left];
    const b = snapshots[right];
    if (!a || !b) return [];
    return formatDiffForDisplay(computeDiff(a.data, b.data));
  }, [left, right, snapshots]);

  return (
    <div data-component="Audit-EntityHistory" data-testid="component-Audit-EntityHistory" className="glass-card p-4 space-y-2">
      <h3 className="font-bold">Entity History: {entityType} / {entityId}</h3>
      <div className="flex gap-2">
        <select value={left} onChange={(e) => setLeft(Number(e.target.value))}>{snapshots.map((s, i) => <option key={s.id} value={i}>v{s.version}</option>)}</select>
        <select value={right} onChange={(e) => setRight(Number(e.target.value))}>{snapshots.map((s, i) => <option key={s.id} value={i}>v{s.version}</option>)}</select>
      </div>
      <DiffViewer diffs={diffs} />
    </div>
  );
}
