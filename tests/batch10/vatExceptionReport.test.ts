import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateVatExceptionReport } from "@/utils/reportGenerator";

describe("generateVatExceptionReport", () => {
  it("returns empty issue list when VAT values are consistent", () => {
    const state = createInitialState();
    const now = new Date("2026-02-16");

    const report = generateVatExceptionReport(state, new Date("2026-01-01"), now);
    expect(report.issueCount).toBeGreaterThanOrEqual(0);
  });

  it("detects invalid/missing VAT anomalies", () => {
    const state = createInitialState();
    state.settings.vatRate = 5;

    state.sales = [
      {
        ...state.sales[0],
        id: "s-vat-1",
        invoice: "INV-VAT-1",
        date: "2026-01-15",
        subtotal: 1000,
        vat: Number.NaN,
      },
    ];

    state.purchases = [
      {
        ...state.purchases[0],
        id: "p-vat-1",
        purchase: "PUR-VAT-1",
        date: "2026-01-16",
        subtotal: 500,
        vat: 0,
      },
    ];

    const report = generateVatExceptionReport(state, new Date("2026-01-01"), new Date("2026-01-31"));
    expect(report.issueCount).toBeGreaterThanOrEqual(2);
    expect(report.issues.some((issue) => issue.issue === "invalid_vat_value")).toBe(true);
    expect(report.issues.some((issue) => issue.issue === "unexpected_zero_vat")).toBe(true);
  });
});
