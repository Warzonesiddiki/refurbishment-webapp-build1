import type { AppliedBOM, BOMTemplate } from "@/store/types/BOMTypes";
import type { PartMovement, PartUsage } from "@/store/types/PartMovementTypes";
import type { PartRecord, ValuationMethod } from "@/store/types/PartTypes";
import type { StockTake } from "@/store/types/StockTakeTypes";
import { calculateInventoryValue } from "@/utils/stockValuation";

export function selectPartsWithStock(parts: PartRecord[]) {
  return parts.filter((p) => p.quantity > 0 && p.isActive);
}

export function selectLowStockParts(parts: PartRecord[]) {
  return parts.filter((p) => p.quantity <= p.minStock && p.isActive);
}

export function selectPartsByCategory(parts: PartRecord[], categoryId: string, includeChildren = false, categories: Array<{ id: string; parentId?: string }> = []) {
  if (!includeChildren) return parts.filter((p) => p.categoryId === categoryId);
  const ids = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return parts.filter((p) => p.categoryId && ids.has(p.categoryId));
}

export function selectPartUsageByLaptop(usages: PartUsage[], laptopId: string) {
  return usages.filter((u) => u.laptopId === laptopId);
}

export function selectPartUsageByWIP(usages: PartUsage[], wipId: string) {
  return usages.filter((u) => u.wipId === wipId);
}

export function selectTotalInventoryValue(parts: PartRecord[], method: ValuationMethod) {
  return calculateInventoryValue(parts, method).totalValue;
}

export function selectPartMovementsInRange(movements: PartMovement[], partId: string, startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return movements.filter((m) => m.partId === partId && new Date(m.timestamp).getTime() >= start && new Date(m.timestamp).getTime() <= end);
}

export function selectBOMAvailability(template: BOMTemplate, applied: AppliedBOM | undefined, parts: PartRecord[]) {
  const map = new Map<string, { required: number; available: number; shortage: number }>();
  template.items.forEach((item) => {
    const part = parts.find((p) => p.id === item.partId);
    const required = item.quantity;
    const used = applied?.items.find((i) => i.partId === item.partId)?.usedQty ?? 0;
    const available = Math.max(0, (part?.availableQty ?? 0) - used);
    map.set(item.partId, { required, available, shortage: Math.max(0, required - available) });
  });
  return map;
}

export function selectStockTakeProgress(stockTake: StockTake) {
  const total = stockTake.items.length;
  const counted = stockTake.items.filter((i) => i.status !== "PENDING").length;
  return { total, counted, percentage: total > 0 ? Math.round((counted / total) * 100) : 0 };
}
