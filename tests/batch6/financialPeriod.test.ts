import { describe, expect, it } from "vitest";
import { createInitialFinancialPeriodState, ensureEntryAllowed, financialPeriodReducer } from "@/store/reducers/financialPeriodReducer";

describe("financial periods", () => {
  it("create close and block backdated", () => {
    let s = createInitialFinancialPeriodState();
    s = financialPeriodReducer(s, { type: "CREATE_FINANCIAL_PERIOD", payload: { type: "MONTH", startDate: "2024-01-01" } });
    const id = s.currentPeriodId!;
    s = financialPeriodReducer(s, { type: "START_PERIOD_CLOSE", payload: { periodId: id, checklist: { allSalesInvoiced: true, allPurchasesReceived: true, allReceiptsRecorded: true, allPaymentsRecorded: true, inventoryReconciled: true, vatReturnPrepared: true, bankReconciled: true } } });
    s = financialPeriodReducer(s, { type: "COMPLETE_PERIOD_CLOSE", payload: { periodId: id, closingBalances: { cash: 10, receivables: 20, inventory: 30, payables: 25, ownerEquity: 20, retainedEarnings: 15 } } });
    expect(() => ensureEntryAllowed(s, "2024-01-15")).toThrow();
  });
});
