import { useMemo, useState } from "react";
import type { PartRecord } from "@/store/types/PartTypes";

type PartListProps = { parts: PartRecord[]; categoryId?: string; onEdit?: (id: string) => void };

export function PartList({ parts, categoryId, onEdit }: PartListProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => parts.filter((p) =>
    (!categoryId || p.categoryId === categoryId) &&
    [p.sku, p.name, p.barcode ?? "", p.location ?? ""].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [parts, categoryId, query]);

  return (
    <div data-component="Parts-PartList" data-testid="component-Parts-PartList" className="space-y-3">
      <input aria-label="Search parts" className="w-full px-3 py-2 rounded" value={query} onChange={(e) => setQuery(e.target.value)} />
      <table className="w-full text-sm">
        <thead><tr><th>SKU</th><th>Name</th><th>Qty</th><th>Available</th><th>Cost</th><th /></tr></thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td><td>{p.name}</td><td>{p.quantity}</td><td>{p.availableQty}</td><td>{p.unitCost}</td>
              <td><button onClick={() => onEdit?.(p.id)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
