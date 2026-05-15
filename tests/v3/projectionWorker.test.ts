import { describe, expect, it } from "vitest";
import { InMemoryProjectionSnapshotAdapter, JournalProjectionWorker } from "@/v3/projections/projectionWorker";
import type { V3DomainEvent } from "@/v3/events/types";

function saleEvent(id: string): V3DomainEvent {
  return {
    id: `e-${id}`,
    ts: "2026-04-01T00:00:00.000Z",
    tenantId: "t1",
    aggregateId: id,
    name: "SaleRecorded",
    payload: {
      saleId: id,
      invoice: `INV-${id}`,
      date: "2026-04-01",
      customer: "Acme",
      total: 100,
    },
  };
}

describe("v3 projection worker", () => {
  it("persists snapshots and reloads from adapter", () => {
    const adapter = new InMemoryProjectionSnapshotAdapter();
    const workerA = new JournalProjectionWorker({ snapshotKey: "j:1", adapter, rebuildThreshold: 10 });
    const events = [saleEvent("s1")];

    workerA.applyEvent(events[0], events);

    const workerB = new JournalProjectionWorker({ snapshotKey: "j:1", adapter, rebuildThreshold: 10 });
    expect(workerB.getSnapshot().eventCount).toBe(1);
    expect(workerB.getRows()).toHaveLength(1);
  });

  it("switches to rebuild mode once threshold is reached", () => {
    const adapter = new InMemoryProjectionSnapshotAdapter();
    const worker = new JournalProjectionWorker({ snapshotKey: "j:2", adapter, rebuildThreshold: 2 });
    const e1 = saleEvent("s1");
    const e2 = saleEvent("s2");

    const first = worker.applyEvent(e1, [e1]);
    const second = worker.applyEvent(e2, [e1, e2]);

    expect(first.mode).toBe("incremental");
    expect(second.mode).toBe("rebuild");
    if (second.mode === "rebuild") {
      expect(second.reason).toBe("threshold");
      expect(second.snapshot.eventCount).toBe(2);
    }
  });
});
