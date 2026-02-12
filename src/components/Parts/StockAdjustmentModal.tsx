import { useState } from "react";

type StockAdjustmentModalProps = {
  currentQty: number;
  onSubmit: (payload: { direction: "IN" | "OUT"; quantity: number; reason: string }) => void;
};

export function StockAdjustmentModal({ currentQty, onSubmit }: StockAdjustmentModalProps) {
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const invalid = quantity <= 0 || !reason || (direction === "OUT" && quantity > currentQty);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!invalid) onSubmit({ direction, quantity, reason }); }} className="space-y-2">
      <select aria-label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as "IN" | "OUT")}>
        <option value="IN">IN</option><option value="OUT">OUT</option>
      </select>
      <input aria-label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
      <input aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button type="submit" disabled={invalid}>Adjust</button>
    </form>
  );
}
