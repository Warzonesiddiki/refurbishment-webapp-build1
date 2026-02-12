import { describe, expect, it } from "vitest";
import { stockTakeReducer } from "@/store/reducers/stockTakeReducer";

describe("stockTakeReducer", () => {
  it("creates and completes stock take with adjustment", () => {
    const initial = {
      stockTakes: [],
      parts: [{ id: "p1", sku: "S1", name: "RAM", quantity: 5, reservedQty: 0, availableQty: 5, minStock: 1, unitCost: 10, isActive: true, createdAt: "", updatedAt: "" }],
      movements: [],
    };
    let s = stockTakeReducer(initial, { type: "CREATE_STOCK_TAKE", payload: { name: "Q1", createdBy: "admin" } });
    const id = s.stockTakes[0].id;
    s = stockTakeReducer(s, { type: "START_STOCK_TAKE", payload: { id } });
    s = stockTakeReducer(s, { type: "RECORD_COUNT", payload: { stockTakeId: id, partId: "p1", countedQty: 3, countedBy: "admin" } });
    s = stockTakeReducer(s, { type: "SUBMIT_FOR_REVIEW", payload: { stockTakeId: id } });
    s = stockTakeReducer(s, { type: "COMPLETE_STOCK_TAKE", payload: { stockTakeId: id, approvedBy: "admin" } });
    expect(s.parts[0].quantity).toBe(3);
  });
});
