import { describe, expect, it } from "vitest";
import { initialPartState, partReducer } from "@/store/reducers/partReducer";

describe("partReducer", () => {
  it("ADD_PART creates with zero quantity", () => {
    const next = partReducer(initialPartState, { type: "ADD_PART", payload: { sku: "S1", name: "Ram", minStock: 1, unitCost: 10, isActive: true } });
    expect(next.parts[0].quantity).toBe(0);
  });

  it("rejects duplicate sku", () => {
    let s = partReducer(initialPartState, { type: "ADD_PART", payload: { sku: "S1", name: "Ram", minStock: 1, unitCost: 10, isActive: true } });
    s = partReducer(s, { type: "ADD_PART", payload: { sku: "S1", name: "SSD", minStock: 1, unitCost: 10, isActive: true } });
    expect(s.parts).toHaveLength(1);
  });

  it("USE_PART fails when exceeds available", () => {
    let s = partReducer(initialPartState, { type: "ADD_PART", payload: { sku: "S1", name: "Ram", minStock: 1, unitCost: 10, isActive: true } });
    const partId = s.parts[0].id;
    s = partReducer(s, { type: "USE_PART", payload: { partId, laptopId: "L1", quantity: 1 } });
    expect(s.usages).toHaveLength(0);
  });

  it("RECEIVE_PARTS then USE_PART updates qty", () => {
    let s = partReducer(initialPartState, { type: "ADD_PART", payload: { sku: "S1", name: "Ram", minStock: 1, unitCost: 10, isActive: true } });
    const partId = s.parts[0].id;
    s = partReducer(s, { type: "RECEIVE_PARTS", payload: { partId, quantity: 5, unitCost: 10 } });
    s = partReducer(s, { type: "USE_PART", payload: { partId, laptopId: "L1", quantity: 2 } });
    expect(s.parts[0].quantity).toBe(3);
  });
});
