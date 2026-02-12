import type { RollbackPoint } from "@/store/reducers/backupReducer";

export function RollbackManager({ points, onRollback, onDelete }: { points: RollbackPoint[]; onRollback: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold">Rollback Points</h4>
      {points.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-2 rounded border border-cyan-500/20 text-xs">
          <div><div>{p.reason}</div><div className="text-cyan-500/50">{new Date(p.at).toLocaleString()}</div></div>
          <div className="flex gap-2"><button className="btn-ghost" onClick={() => onRollback(p.id)}>Rollback</button><button className="btn-ghost" onClick={() => onDelete(p.id)}>Delete</button></div>
        </div>
      ))}
    </div>
  );
}
