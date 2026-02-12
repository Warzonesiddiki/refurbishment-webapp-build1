import type { AppState } from "@/store/appState";

type RestorePreviewProps = {
  currentState: AppState;
  backupState: AppState;
  onConfirm: () => void;
  onCancel: () => void;
};

function countModuleDelta<T extends { id: string }>(current: T[], incoming: T[]) {
  const currentIds = new Set(current.map((r) => r.id));
  const incomingIds = new Set(incoming.map((r) => r.id));
  let add = 0;
  let remove = 0;
  incomingIds.forEach((id) => { if (!currentIds.has(id)) add += 1; });
  currentIds.forEach((id) => { if (!incomingIds.has(id)) remove += 1; });
  return { add, remove, update: Math.min(current.length, incoming.length) - remove };
}

export function RestorePreview({ currentState, backupState, onConfirm, onCancel }: RestorePreviewProps) {
  const modules = [
    ["Laptops", countModuleDelta(currentState.laptops, backupState.laptops)],
    ["Parts", countModuleDelta(currentState.parts, backupState.parts)],
    ["Sales", countModuleDelta(currentState.sales, backupState.sales)],
    ["Purchases", countModuleDelta(currentState.purchases, backupState.purchases)],
    ["WIP", countModuleDelta(currentState.wipJobs, backupState.wipJobs)],
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold neon-text-cyan">Restore Preview</h3>
      <div className="space-y-2 text-sm">
        {modules.map(([name, delta]) => (
          <div key={name} className="flex items-center justify-between">
            <span>{name}</span>
            <span className="text-cyan-200">+{delta.add} ~{Math.max(0, delta.update)} -{delta.remove}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-cyber" onClick={onConfirm}>Confirm Restore</button>
      </div>
    </div>
  );
}
