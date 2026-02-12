import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("sales receivable reconciliation", () => {
  it("marks sale as partial/paid when receipts are added", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_SALE",
      payload: {
        invoice: "ALM-INV-202401-9999",
        date: "2024-01-20",
        customer: "Credit Customer",
        items: 1,
        subtotal: 1000,
        vat: 50,
        total: 1050,
        profit: 250,
        status: "Unpaid",
        method: "Credit",
        lineItems: [],
      },
    });

    state = appReducer(state, {
      type: "ADD_RECEIPT",
      payload: {
        receipt: "ALM-RC-202401-9001",
        date: "2024-01-21",
        invoice: "ALM-INV-202401-9999",
        amount: 400,
        method: "Cash",
        reference: "",
      },
    });

    expect(state.sales.find((s) => s.invoice === "ALM-INV-202401-9999")?.status).toBe("Partial");

    state = appReducer(state, {
      type: "ADD_RECEIPT",
      payload: {
        receipt: "ALM-RC-202401-9002",
        date: "2024-01-22",
        invoice: "ALM-INV-202401-9999",
        amount: 650,
        method: "Transfer",
        reference: "FT-123",
      },
    });

    expect(state.sales.find((s) => s.invoice === "ALM-INV-202401-9999")?.status).toBe("Paid");
  });

  it("reverts sale status when receipt is deleted", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_SALE",
      payload: {
        invoice: "ALM-INV-202401-8888",
        date: "2024-01-20",
        customer: "Due Customer",
        items: 1,
        subtotal: 500,
        vat: 25,
        total: 525,
        profit: 100,
        status: "Unpaid",
        method: "Credit",
        lineItems: [],
      },
    });

    state = appReducer(state, {
      type: "ADD_RECEIPT",
      payload: {
        receipt: "ALM-RC-202401-8001",
        date: "2024-01-21",
        invoice: "ALM-INV-202401-8888",
        amount: 525,
        method: "Cash",
        reference: "",
      },
    });

    const receiptId = state.receipts.find((r) => r.invoice === "ALM-INV-202401-8888")?.id;
    expect(receiptId).toBeTruthy();

    state = appReducer(state, { type: "DELETE_RECEIPT", id: receiptId! });

    expect(state.sales.find((s) => s.invoice === "ALM-INV-202401-8888")?.status).toBe("Unpaid");
  });
});
