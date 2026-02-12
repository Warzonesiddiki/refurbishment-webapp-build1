import { describe, expect, it } from "vitest";
import { createInitialFinancialPeriodState, ensureEntryAllowed, financialPeriodReducer } from "@/store/reducers/financialPeriodReducer";

describe("financial periods", () => {
  it("create close and block backdated", () => {
    let s = createInitialFinancialPeriodState();
    s = financialPeriodReducer(s, { type: "CREATE_FINANCIAL_PERIOD", payload: { type: "MONTH", startDate: "2024-01-01" } });
    const id = s.currentPeriodId!;
    s = financialPeriodReducer(s, { type: "START_PERIOD_CLOSE", payload: { periodId: id, checklist: { allSalesInvoiced: true, allPurchasesReceived: true, allReceiptsRecorded: true, allPaymentsRecorded: true, inventoryReconciled: true, vatReturnPrepared: true, bankReconciled: true } } });
    s = financialPeriodReducer(s, { type: "COMPLETE_PERIOD_CLOSE", payload: { periodId: id, closingBalances: { cash: 1, receivables: 2, inventory: 3, payables: 4, ownerEquity: 5, retainedEarnings: 6 } } });
    expect(() => ensureEntryAllowed(s, "2024-01-15")).toThrow();
  });
});
