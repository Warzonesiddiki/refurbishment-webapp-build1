import type { UnitCostBreakdown } from "@/store/types/CostTypes";

export function CostBreakdown({ cost }: { cost: UnitCostBreakdown }) {
  return <div className="glass-card p-4"><h2 className="font-bold">Cost Breakdown</h2><div>Total: {cost.totalCost}</div><div>{cost.costFrozenAt ? "Frozen" : "Open"}</div><ul>{cost.components.map((c) => <li key={c.id}>{c.type}: {c.amount}</li>)}</ul></div>;
}
