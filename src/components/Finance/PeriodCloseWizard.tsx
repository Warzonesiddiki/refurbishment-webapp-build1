import { useState } from "react";

const checklistItems = ["All sales invoiced", "All purchases received", "Receipts recorded", "Payments recorded", "Inventory reconciled", "VAT return prepared", "Bank reconciled"];

export function PeriodCloseWizard({ onComplete }: { onComplete?: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const allDone = checked.length === checklistItems.length;
  return <div className="glass-card p-4"><h2 className="font-bold">Period Close Wizard</h2>{checklistItems.map((x) => <label key={x} className="block"><input type="checkbox" checked={checked.includes(x)} onChange={(e) => setChecked((prev) => e.target.checked ? [...prev, x] : prev.filter((v) => v !== x))} /> {x}</label>)}<button disabled={!allDone} onClick={onComplete}>Close Period</button></div>;
}
