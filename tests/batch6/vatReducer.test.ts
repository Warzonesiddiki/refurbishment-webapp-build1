import { describe, expect, it } from "vitest";
import { createInitialVATState, vatReducer } from "@/store/reducers/vatReducer";

describe("vat reducer", () => {
  it("records and reverses transaction", () => {
    let state = createInitialVATState();
    state = vatReducer(state, { type: "RECORD_VAT_TRANSACTION", payload: { type: "OUTPUT", category: "STANDARD", sourceType: "SALE", sourceId: "s1", sourceRef: "INV1", counterpartyId: null, counterpartyName: "C", taxableAmount: 100, vatRate: 15, vatAmount: 15, totalAmount: 115, transactionDate: "2024-01-01", periodId: null, isReversed: false, reversalId: null } });
    const id = state.transactions[0].id;
    state = vatReducer(state, { type: "REVERSE_VAT_TRANSACTION", payload: { transactionId: id, reason: "err" } });
    expect(state.transactions).toHaveLength(2);
    expect(state.transactions[0].isReversed).toBe(true);
    expect(state.transactions[1].vatAmount).toBe(-15);
  });
});
