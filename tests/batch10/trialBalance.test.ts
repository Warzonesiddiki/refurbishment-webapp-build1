import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { buildTrialBalanceSnapshot } from "@/utils/trialBalance";

describe("buildTrialBalanceSnapshot", () => {
  it("returns debit/credit totals and balance status", () => {
    const state = createInitialState();
    const snapshot = buildTrialBalanceSnapshot(state, new Date("2026-02-16"));

    expect(snapshot.debitTotal).toBeTypeOf("number");
    expect(snapshot.creditTotal).toBeTypeOf("number");
    expect(snapshot.tolerance).toBe(0.01);
    expect(snapshot.isBalanced).toBe(Math.abs(snapshot.difference) <= snapshot.tolerance);
  });

  it("flags snapshot as unbalanced when numeric integrity is broken", () => {
    const state = createInitialState();
    state.sales = [
      {
        id: "s1",
        invoice: "INV-1",
        date: "2026-01-01",
        customer: "Acme",
        subtotal: Number.NaN,
        vat: 0,
        total: Number.NaN,
        paid: 0,
        status: "confirmed",
        lineItems: [],
      },
    ];

    const snapshot = buildTrialBalanceSnapshot(state, new Date("2026-02-16"));
    expect(snapshot.isBalanced).toBe(false);
  });
});
