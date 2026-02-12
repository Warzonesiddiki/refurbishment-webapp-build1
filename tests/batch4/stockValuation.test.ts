import { describe, expect, it } from "vitest";
import { calculateFIFOCost, calculateWeightedAvgCost } from "@/utils/stockValuation";

describe("stockValuation", () => {
  it("FIFO uses oldest first", () => {
    const out = calculateFIFOCost([
      { id: "1", partId: "p", type: "RECEIVE", quantity: 2, direction: "IN", unitCost: 10, totalCost: 20, timestamp: "2024-01-01" },
      { id: "2", partId: "p", type: "RECEIVE", quantity: 2, direction: "IN", unitCost: 20, totalCost: 40, timestamp: "2024-01-02" },
    ], 3);
    expect(out.totalCost).toBe(40);
  });

  it("weighted avg recalculates", () => {
    expect(calculateWeightedAvgCost(10, 5, 10, 15)).toBe(10);
  });
});
