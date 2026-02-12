import { describe, expect, it } from "vitest";
import { createInitialVATState, vatReducer } from "@/store/reducers/vatReducer";

describe("vat return", () => {
  it("generates and updates status", () => {
    let state = createInitialVATState();
    state = vatReducer(state, { type: "RECORD_VAT_TRANSACTION", payload: { type: "OUTPUT", category: "STANDARD", sourceType: "SALE", sourceId: "s1", sourceRef: "INV1", counterpartyId: null, counterpartyName: "C", taxableAmount: 100, vatRate: 15, vatAmount: 15, totalAmount: 115, transactionDate: "2024-01-02", periodId: null, isReversed: false, reversalId: null } });
    state = vatReducer(state, { type: "RECORD_VAT_TRANSACTION", payload: { type: "INPUT", category: "STANDARD", sourceType: "PURCHASE", sourceId: "p1", sourceRef: "PO1", counterpartyId: null, counterpartyName: "S", taxableAmount: 20, vatRate: 15, vatAmount: 3, totalAmount: 23, transactionDate: "2024-01-03", periodId: null, isReversed: false, reversalId: null } });
    state = vatReducer(state, { type: "GENERATE_VAT_RETURN", payload: { periodStart: "2024-01-01", periodEnd: "2024-01-31" } });
    const generated = Object.values(state.returns)[0];
    expect(generated.netVAT).toBe(12);
    state = vatReducer(state, { type: "FILE_VAT_RETURN", payload: { returnId: generated.id, reference: "F-1" } });
    expect(state.returns[generated.id].status).toBe("FILED");
  });
});
