import type { PartRecord } from "@/store/types/PartTypes";

export function PartDetail({ part }: { part: PartRecord }) {
  return (
    <div>
      <h2>{part.name}</h2>
      <p>{part.sku}</p>
      <p>Qty: {part.quantity}</p>
      <p>Available: {part.availableQty}</p>
    </div>
  );
}
