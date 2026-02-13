import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { evaluateFinanceReadiness } from "@/utils/financeReadiness";

describe("evaluateFinanceReadiness", () => {
  it("returns weighted score and checks", () => {
    const state = createInitialState();
    const snapshot = evaluateFinanceReadiness(state, new Date("2026-02-12"));

    expect(snapshot.totalWeight).toBe(100);
    expect(snapshot.checks).toHaveLength(5);
    expect(snapshot.scorePercent).toBeGreaterThanOrEqual(0);
    expect(snapshot.scorePercent).toBeLessThanOrEqual(100);
  });

  it("flags receivables control when receipts exceed sales", () => {
    const state = createInitialState();
    state.sales = [];
    state.receipts = [{ id: "r1", receipt: "R1", date: "2026-01-01", invoice: "INV1", amount: 1000, method: "Cash", reference: "X" }];

    const snapshot = evaluateFinanceReadiness(state, new Date("2026-02-12"));
    const receivablesCheck = snapshot.checks.find((c) => c.key === "receivables-control");

    expect(receivablesCheck?.passed).toBe(false);
    expect(snapshot.scorePercent).toBeLessThan(100);
  });
});
