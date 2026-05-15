import { useMemo, useState } from "react";
import type { PartRecord } from "@/store/types/PartTypes";

type PartSearchProps = { parts: PartRecord[]; onSelect?: (part: PartRecord) => void };

export function PartSearch({ parts, onSelect }: PartSearchProps) {
  const [query, setQuery] = useState("");
  const result = useMemo(() => {
    if (query.length < 2) return [];
    return parts.filter((p) => [p.sku, p.name, p.barcode ?? ""].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [parts, query]);

  return (
    <div data-component="Parts-PartSearch" data-testid="component-Parts-PartSearch" className="space-y-2">
      <input aria-label="Part Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      {result.map((p) => <button key={p.id} onClick={() => onSelect?.(p)}>{p.sku} | {p.name} | {p.quantity}</button>)}
      {query.length >= 2 && result.length === 0 && <p>No parts found</p>}
    </div>
  );
}
