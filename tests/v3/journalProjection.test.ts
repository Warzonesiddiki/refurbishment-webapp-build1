import { describe, expect, it } from "vitest";
import {
  buildJournalRowsViaV3Pipeline,
  projectJournalRows,
  rebuildJournalProjectionFromEvents,
  restoreJournalProjectionFromSnapshot,
} from "@/v3/finance/journalProjection";
import type { V3DomainEvent } from "@/v3/events/types";

describe("v3 journal projection", () => {
  it("builds projected rows through command+event pipeline", () => {
    const result = buildJournalRowsViaV3Pipeline({
      tenantId: "t1",
      sales: [{ id: "s1", invoice: "INV-1", date: "2026-02-10", customer: "Acme", total: 100 }],
      purchases: [{ id: "p1", purchase: "PO-1", date: "2026-02-11", supplier: "Supply", total: 80 }],
      receipts: [{ id: "r1", receipt: "RC-1", date: "2026-02-12", invoice: "INV-1", amount: 30 }],
      payments: [{ id: "pm1", payment: "PAY-1", date: "2026-02-13", supplier: "Supply", amount: 20 }],
    });

    expect(result.rows).toHaveLength(4);
    expect(result.rows.find((r) => r.source === "receipts")?.counterparty).toBe("Acme");
    expect(result.mirroredLegacySales).toHaveLength(1);
  });

  it("can rebuild and restore projection snapshots", () => {
    const events: V3DomainEvent[] = [
      {
        id: "e1",
        ts: "2026-02-10T00:00:00.000Z",
        tenantId: "t1",
        aggregateId: "s1",
        name: "SaleRecorded",
        payload: { saleId: "s1", invoice: "INV-1", date: "2026-02-10", customer: "Acme", total: 100 },
      },
      {
        id: "e2",
        ts: "2026-02-11T00:00:00.000Z",
        tenantId: "t1",
        aggregateId: "r1",
        name: "ReceiptRecorded",
        payload: { receiptId: "r1", receipt: "RC-1", date: "2026-02-11", invoice: "INV-1", amount: 50 },
      },
    ];

    const snapshot = rebuildJournalProjectionFromEvents(events);
    const restored = restoreJournalProjectionFromSnapshot(snapshot);

    expect(snapshot.eventCount).toBe(2);
    expect(restored).toHaveLength(2);
    expect(restored[0].source).toBe("receipts");
  });

  it("projects empty list safely", () => {
    expect(projectJournalRows([])).toEqual([]);
  });
});
