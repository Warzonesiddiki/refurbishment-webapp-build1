import type { StockTake } from "@/store/types/StockTakeTypes";

export function StockTakeWizard({ stockTake }: { stockTake: StockTake }) {
  const counted = stockTake.items.filter((i) => i.status !== "PENDING").length;
  return (
    <div className="space-y-2">
      <h3>{stockTake.name}</h3>
      <p>{counted}/{stockTake.items.length} counted</p>
    </div>
  );
}
