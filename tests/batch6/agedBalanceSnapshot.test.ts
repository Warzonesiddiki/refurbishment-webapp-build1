import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateAgedBalanceSnapshot } from "@/utils/reportGenerator";

describe("generateAgedBalanceSnapshot", () => {
  it("groups outstanding receivables and payables into age buckets", () => {
    const state = createInitialState();
    state.sales = [
      {
        id: "s1",
        invoice: "INV-1",
        date: "2026-01-10",
        customer: "Cust A",
        items: 1,
        subtotal: 100,
        vat: 5,
        total: 105,
        profit: 15,
        status: "Confirmed",
        method: "Cash",
        lineItems: [{ barcode: "B1", name: "Laptop", price: 100, cost: 85, profit: 15 }],
      },
    ];
    state.receipts = [
      {
        id: "r1",
        receipt: "RCPT-1",
        date: "2026-01-20",
        invoice: "INV-1",
        amount: 5,
        method: "Cash",
        reference: "X",
      },
    ];
    state.purchases = [
      {
        id: "p1",
        purchase: "PUR-1",
        date: "2025-10-10",
        supplier: "Supp A",
        lot: "LOT-1",
        subtotal: 200,
        vat: 10,
        total: 210,
        paid: "Unpaid",
        status: "Open",
      },
    ];
    state.payments = [];

    const snapshot = generateAgedBalanceSnapshot(state, new Date("2026-02-15"));

    expect(snapshot.totalReceivablesDue).toBe(100);
    expect(snapshot.totalPayablesDue).toBe(210);
    expect(snapshot.receivables.find((b) => b.bucket === "31-60")?.amount).toBe(100);
    expect(snapshot.payables.find((b) => b.bucket === "90+")?.amount).toBe(210);
  });
});
