import { describe, expect, it } from "vitest";
import { buildJournalParityReport } from "@/v3/migration/parityMonitor";
import type { JournalRow } from "@/v3/finance/journalProjection";

function row(overrides: Partial<JournalRow> = {}): JournalRow {
  return {
    id: "r1",
    date: "2026-03-01",
    source: "sales",
    reference: "INV-1",
    counterparty: "Acme",
    amount: 100,
    ...overrides,
  };
}

describe("v3 parity monitor", () => {
  it("reports aligned datasets", () => {
    const report = buildJournalParityReport({ legacyRows: [row()], v3Rows: [row({ id: "v3-r1" })] });
    expect(report.isAligned).toBe(true);
    expect(report.drifts).toEqual([]);
  });

  it("reports missing and value mismatch drifts", () => {
    const report = buildJournalParityReport({
      legacyRows: [row(), row({ id: "r2", reference: "INV-2", amount: 130 })],
      v3Rows: [row({ id: "v1" }), row({ id: "v2", reference: "INV-2", amount: 135 })],
    });

    expect(report.isAligned).toBe(false);
    expect(report.drifts.some((d) => d.issue === "value_mismatch")).toBe(true);
  });
});
