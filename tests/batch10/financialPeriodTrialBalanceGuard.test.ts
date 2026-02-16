import { describe, expect, it } from "vitest";
import { createInitialFinancialPeriodState, financialPeriodReducer } from "@/store/reducers/financialPeriodReducer";

const completeChecklist = {
  allSalesInvoiced: true,
  allPurchasesReceived: true,
  allReceiptsRecorded: true,
  allPaymentsRecorded: true,
  inventoryReconciled: true,
  vatReturnPrepared: true,
  bankReconciled: true,
};

describe("financial period trial balance guard", () => {
  it("blocks period close when closing balances are out of balance", () => {
    let state = createInitialFinancialPeriodState();
    state = financialPeriodReducer(state, {
      type: "CREATE_FINANCIAL_PERIOD",
      payload: { type: "MONTH", startDate: "2024-01-01" },
    });

    const periodId = state.currentPeriodId!;

    state = financialPeriodReducer(state, {
      type: "START_PERIOD_CLOSE",
      payload: { periodId, checklist: completeChecklist },
    });

    expect(() =>
      financialPeriodReducer(state, {
        type: "COMPLETE_PERIOD_CLOSE",
        payload: {
          periodId,
          closingBalances: {
            cash: 100,
            receivables: 50,
            inventory: 25,
            payables: 100,
            ownerEquity: 50,
            retainedEarnings: 20,
          },
        },
      })
    ).toThrow(/Trial balance guard blocked close/);
  });

  it("allows period close when closing balances are balanced", () => {
    let state = createInitialFinancialPeriodState();
    state = financialPeriodReducer(state, {
      type: "CREATE_FINANCIAL_PERIOD",
      payload: { type: "MONTH", startDate: "2024-01-01" },
    });

    const periodId = state.currentPeriodId!;

    state = financialPeriodReducer(state, {
      type: "START_PERIOD_CLOSE",
      payload: { periodId, checklist: completeChecklist },
    });

    const next = financialPeriodReducer(state, {
      type: "COMPLETE_PERIOD_CLOSE",
      payload: {
        periodId,
        closingBalances: {
          cash: 100,
          receivables: 50,
          inventory: 25,
          payables: 100,
          ownerEquity: 50,
          retainedEarnings: 25,
        },
      },
    });

    expect(next.periods[periodId]?.status).toBe("CLOSED");
  });
  it("blocks period close for viewer role", () => {
    let state = createInitialFinancialPeriodState();
    state = financialPeriodReducer(state, {
      type: "CREATE_FINANCIAL_PERIOD",
      payload: { type: "MONTH", startDate: "2024-01-01" },
    });

    const periodId = state.currentPeriodId!;

    state = financialPeriodReducer(state, {
      type: "START_PERIOD_CLOSE",
      payload: { periodId, checklist: completeChecklist },
    });

    expect(() =>
      financialPeriodReducer(state, {
        type: "COMPLETE_PERIOD_CLOSE",
        payload: {
          periodId,
          actorRole: "VIEWER",
          closingBalances: {
            cash: 100,
            receivables: 50,
            inventory: 25,
            payables: 100,
            ownerEquity: 50,
            retainedEarnings: 25,
          },
        },
      })
    ).toThrow(/cannot close financial periods/);
  });

  it("requires admin role to reopen periods", () => {
    let state = createInitialFinancialPeriodState();
    state = financialPeriodReducer(state, {
      type: "CREATE_FINANCIAL_PERIOD",
      payload: { type: "MONTH", startDate: "2024-01-01" },
    });

    const periodId = state.currentPeriodId!;

    state = financialPeriodReducer(state, {
      type: "START_PERIOD_CLOSE",
      payload: { periodId, checklist: completeChecklist },
    });

    state = financialPeriodReducer(state, {
      type: "COMPLETE_PERIOD_CLOSE",
      payload: {
        periodId,
        actorRole: "MANAGER",
        closingBalances: {
          cash: 100,
          receivables: 50,
          inventory: 25,
          payables: 100,
          ownerEquity: 50,
          retainedEarnings: 25,
        },
      },
    });

    expect(() =>
      financialPeriodReducer(state, {
        type: "REOPEN_PERIOD",
        payload: { periodId, reason: "adjustment", allowReopen: true, actorRole: "MANAGER" },
      })
    ).toThrow(/cannot reopen closed periods/);
  });

});
