import type { PartUsage } from "@/store/types/PartMovementTypes";
import type { PartMovement } from "@/store/types/PartMovementTypes";
import type { PartRecord, ValuationMethod } from "@/store/types/PartTypes";

export function calculateFIFOCost(movements: PartMovement[], quantityToValue: number) {
  const inbound = movements.filter((m) => m.direction === "IN").sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  let remaining = quantityToValue;
  let totalCost = 0;
  for (const batch of inbound) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.quantity);
    totalCost += take * batch.unitCost;
    remaining -= take;
  }
  return { unitCost: quantityToValue > 0 ? totalCost / quantityToValue : 0, totalCost };
}

export function calculateWeightedAvgCost(currentQty: number, currentCost: number, receiveQty: number, receiveCost: number) {
  const totalQty = currentQty + receiveQty;
  if (totalQty <= 0) return currentCost;
  return (currentQty * currentCost + receiveQty * receiveCost) / totalQty;
}

export function calculateInventoryValue(parts: PartRecord[], _method: ValuationMethod) {
  const breakdown = new Map<string, number>();
  let totalValue = 0;
  parts.forEach((p) => {
    const value = p.quantity * p.unitCost;
    breakdown.set(p.id, value);
    totalValue += value;
  });
  return { totalValue, breakdown };
}

export function calculateCOGS(usages: PartUsage[], _method: ValuationMethod) {
  return usages.reduce((sum, u) => sum + u.totalCost, 0);
}

export function projectStockDepletion(_partId: string, usageHistory: PartMovement[]) {
  const outs = usageHistory.filter((m) => m.direction === "OUT");
  if (outs.length < 2) return null;
  const first = new Date(outs[outs.length - 1].timestamp).getTime();
  const last = new Date(outs[0].timestamp).getTime();
  if (last <= first) return null;
  const days = (last - first) / (1000 * 60 * 60 * 24);
  const rate = outs.reduce((s, m) => s + m.quantity, 0) / days;
  if (rate <= 0) return null;
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
