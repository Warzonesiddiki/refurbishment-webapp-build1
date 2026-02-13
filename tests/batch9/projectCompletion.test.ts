import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { evaluateProjectCompletion } from "@/utils/projectCompletion";

describe("evaluateProjectCompletion", () => {
  it("returns weighted overall completion with expected area coverage", () => {
    const state = createInitialState();
    const snapshot = evaluateProjectCompletion(state, new Date("2026-02-12"));

    expect(snapshot.totalWeight).toBe(100);
    expect(snapshot.areas).toHaveLength(7);
    expect(snapshot.overallPercent).toBeGreaterThan(0);
    expect(snapshot.overallPercent).toBeLessThanOrEqual(100);
  });

  it("drops overall score when finance readiness degrades", () => {
    const state = createInitialState();
    const baseline = evaluateProjectCompletion(state, new Date("2026-02-12"));

    state.sales = [];
    state.receipts = [{ id: "r1", receipt: "R1", date: "2026-01-01", invoice: "INV1", amount: 99999, method: "Cash", reference: "X" }];

    const degraded = evaluateProjectCompletion(state, new Date("2026-02-12"));
    expect(degraded.overallPercent).toBeLessThan(baseline.overallPercent);
  });
});
