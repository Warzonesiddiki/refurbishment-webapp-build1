import type { PartUsage } from "@/store/types/PartMovementTypes";

export function PartUsageTable({ usages }: { usages: PartUsage[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th>Date</th><th>Laptop</th><th>WIP</th><th>Qty</th><th>Cost</th></tr></thead>
      <tbody>{usages.map((u) => <tr key={u.id}><td>{u.usedAt}</td><td>{u.laptopId}</td><td>{u.wipId}</td><td>{u.quantity}</td><td>{u.totalCost}</td></tr>)}</tbody>
    </table>
  );
}
