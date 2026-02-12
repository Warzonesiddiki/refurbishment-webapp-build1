import { useState } from "react";

type ClearDataModalProps = {
  onBackupFirst?: () => void;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export function ClearDataModal({ onBackupFirst, onConfirm, onCancel }: ClearDataModalProps) {
  const [ack, setAck] = useState(false);
  const [typed, setTyped] = useState("");
  const canClear = ack && typed === "DELETE";

  return (
    <div className="space-y-4">
      <p className="text-sm text-red-300">This action permanently deletes all data.</p>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        I understand this cannot be undone
      </label>
      <input className="w-full px-3 py-2 rounded" placeholder="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} />
      <div className="flex justify-between gap-2">
        {onBackupFirst && <button className="btn-ghost" onClick={onBackupFirst}>Backup First</button>}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-cyber" disabled={!canClear} onClick={() => void onConfirm()}>Clear Data</button>
        </div>
      </div>
    </div>
  );
}
