import { describe, expect, it } from "vitest";
import { costReducer, createInitialCostState } from "@/store/reducers/costReducer";

describe("cost tracking", () => {
  it("adds parts labor overhead and freezes", () => {
    let s = createInitialCostState();
    s = costReducer(s, { type: "INIT_UNIT_COST", payload: { laptopId: "l1", purchaseCost: 100 } });
    s = costReducer(s, { type: "ADD_PART_COST", payload: { laptopId: "l1", partId: "p1", partName: "SSD", quantity: 1, unitCost: 20 } });
    s = costReducer(s, { type: "ADD_LABOR_COST", payload: { laptopId: "l1", wipId: "w1", hours: 1 } });
    s = { ...s, overheadConfig: { method: "FIXED_PER_UNIT", fixedAmount: 10, percentage: 0 } };
    s = costReducer(s, { type: "APPLY_OVERHEAD", payload: { laptopId: "l1" } });
    expect(s.unitCosts.l1.totalCost).toBe(180);
    s = costReducer(s, { type: "FREEZE_COST", payload: { laptopId: "l1" } });
    expect(() => costReducer(s, { type: "ADD_COST_ADJUSTMENT", payload: { laptopId: "l1", description: "x", amount: 1 } })).toThrow();
  });
});
