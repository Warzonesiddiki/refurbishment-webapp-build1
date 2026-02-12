import { describe, expect, it } from "vitest";
import { selectLowStockParts, selectStockTakeProgress } from "@/store/selectors/partSelectors";

describe("part selectors", () => {
  it("filters low stock", () => {
    const result = selectLowStockParts([
      { id: "1", sku: "A", name: "A", quantity: 1, reservedQty: 0, availableQty: 1, minStock: 2, unitCost: 1, isActive: true, createdAt: "", updatedAt: "" },
      { id: "2", sku: "B", name: "B", quantity: 5, reservedQty: 0, availableQty: 5, minStock: 2, unitCost: 1, isActive: true, createdAt: "", updatedAt: "" },
    ]);
    expect(result).toHaveLength(1);
  });

  it("stock take progress", () => {
    const progress = selectStockTakeProgress({ id: "s", name: "st", status: "IN_PROGRESS", createdBy: "a", items: [
      { id: "i1", stockTakeId: "s", partId: "p1", expectedQty: 1, variance: 0, varianceValue: 0, status: "COUNTED" },
      { id: "i2", stockTakeId: "s", partId: "p2", expectedQty: 1, variance: 0, varianceValue: 0, status: "PENDING" },
    ] });
    expect(progress.percentage).toBe(50);
  });
});
