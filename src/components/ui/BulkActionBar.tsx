import { useState } from "react";

export type BulkAction = {
  id: string;
  label: string;
  variant?: "default" | "danger";
  onExecute: (ids: string[]) => Promise<{ success: number; failed: number; errors?: Array<{ id: string; error: string }> }>;
};

type BulkActionBarProps = {
  selectedCount: number;
  totalCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
};

export function BulkActionBar({ selectedCount, totalCount, selectedIds, actions, onClearSelection }: BulkActionBarProps) {
  const [busy, setBusy] = useState<string | null>(null);
  if (selectedCount === 0) return null;

  return (
    <div data-component="ui-BulkActionBar" data-testid="component-ui-BulkActionBar" className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-card p-3 flex items-center gap-2">
      <span>{selectedCount}/{totalCount} selected</span>
      {actions.map((a) => (
        <button key={a.id} disabled={!!busy} onClick={async () => { setBusy(a.id); await a.onExecute(selectedIds); setBusy(null); }}>
          {busy === a.id ? "..." : a.label}
        </button>
      ))}
      <button onClick={onClearSelection}>Clear</button>
    </div>
  );
}
