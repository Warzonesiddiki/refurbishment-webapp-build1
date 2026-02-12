import { describe, expect, it } from "vitest";
import { calculateStockAlerts } from "@/store/alerts/stockAlerts";

describe("stock alerts", () => {
  it("creates out-of-stock alert", () => {
    const alerts = calculateStockAlerts([{ id: "p", sku: "S", name: "RAM", quantity: 0, reservedQty: 0, availableQty: 0, minStock: 1, unitCost: 1, isActive: true, createdAt: "", updatedAt: "" }]);
    expect(alerts[0].type).toBe("OUT_OF_STOCK");
  });
});
