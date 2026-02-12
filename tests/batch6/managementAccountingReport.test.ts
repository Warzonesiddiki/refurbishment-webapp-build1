import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateManagementAccountingSnapshot, generateTaxationSummary } from "@/utils/reportGenerator";

describe("management/tax reports", () => {
  it("generates management accounting KPIs", () => {
    const state = createInitialState();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const snap = generateManagementAccountingSnapshot(state, start, now);

    expect(typeof snap.revenue).toBe("number");
    expect(typeof snap.operatingCashflow).toBe("number");
    expect(snap.receivablesDays).toBeGreaterThanOrEqual(0);
    expect(snap.inventoryTurnover).toBeGreaterThanOrEqual(0);
  });

  it("generates taxation summary with effective rate", () => {
    const state = createInitialState();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const tax = generateTaxationSummary(state, start, now);

    expect(tax.netVATPayable).toBeCloseTo(tax.outputVAT - tax.inputVAT, 2);
    expect(tax.effectiveTaxRatePercent).toBeGreaterThanOrEqual(0);
  });
});
