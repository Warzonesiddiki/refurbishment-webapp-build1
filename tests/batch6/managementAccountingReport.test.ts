import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateCashFlowStatement, generateManagementAccountingSnapshot, generateTaxationSummary } from "@/utils/reportGenerator";

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


  it("generates cash flow statement direct and indirect views", () => {
    const state = createInitialState();
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const cashFlow = generateCashFlowStatement(state, start, end);

    expect(typeof cashFlow.direct.netCashFromOperations).toBe("number");
    expect(typeof cashFlow.indirect.netCashFromOperations).toBe("number");
  });

});
