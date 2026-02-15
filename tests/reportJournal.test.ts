import { describe, expect, it } from "vitest";
import {
  buildJournalDrilldownRows,
  filterJournalDrilldownRows,
  summarizeJournalRows,
  type JournalDrilldownRow,
} from "@/utils/reportJournal";

describe("reportJournal utilities", () => {
  it("builds drilldown rows with inferred receipt counterparty", () => {
    const rows = buildJournalDrilldownRows({
      sales: [{ id: "s1", invoice: "INV-1", date: "2026-02-10", customer: "Acme", total: 100 }],
      purchases: [{ id: "p1", purchase: "PO-1", date: "2026-02-11", supplier: "SupplyCo", total: 60 }],
      receipts: [{ id: "r1", receipt: "RC-1", date: "2026-02-12", invoice: "INV-1", amount: 40 }],
      payments: [{ id: "pm1", payment: "PAY-1", date: "2026-02-13", supplier: "SupplyCo", amount: 30 }],
    });

    expect(rows).toHaveLength(4);
    expect(rows.find((row) => row.source === "receipts")?.counterparty).toBe("Acme");
  });

  it("filters by scope and journal window", () => {
    const rows: JournalDrilldownRow[] = [
      { id: "1", date: "2026-02-10", source: "sales", reference: "INV-1", counterparty: "A", amount: 100 },
      { id: "2", date: "2026-01-15", source: "sales", reference: "INV-2", counterparty: "B", amount: 80 },
      { id: "3", date: "2025-12-20", source: "purchases", reference: "PO-1", counterparty: "S", amount: 60 },
    ];

    const scoped = filterJournalDrilldownRows(rows, "sales", "all-time", new Date("2026-02-20"));
    expect(scoped).toHaveLength(2);

    const thisMonth = filterJournalDrilldownRows(rows, "all", "this-month", new Date("2026-02-20"));
    expect(thisMonth.map((row) => row.id)).toEqual(["1"]);

    const last30 = filterJournalDrilldownRows(rows, "all", "last-30-days", new Date("2026-02-20"));
    expect(last30.map((row) => row.id)).toEqual(["1"]);
  });

  it("summarizes rows by source", () => {
    const summary = summarizeJournalRows([
      { id: "1", date: "2026-02-10", source: "sales", reference: "INV-1", counterparty: "A", amount: 100 },
      { id: "2", date: "2026-02-11", source: "purchases", reference: "PO-1", counterparty: "S", amount: 60 },
      { id: "3", date: "2026-02-12", source: "sales", reference: "INV-2", counterparty: "B", amount: 40 },
    ]);

    expect(summary.totalAmount).toBe(200);
    expect(summary.bySource.sales).toBe(140);
    expect(summary.bySource.purchases).toBe(60);
    expect(summary.bySource.all).toBe(200);
  });
});
