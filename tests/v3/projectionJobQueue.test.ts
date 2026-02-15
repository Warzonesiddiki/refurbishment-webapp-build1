import { describe, expect, it } from "vitest";
import { JournalProjectionWorker, InMemoryProjectionSnapshotAdapter } from "@/v3/projections/projectionWorker";
import { ProjectionJobQueue } from "@/v3/projections/projectionJobQueue";
import type { V3DomainEvent } from "@/v3/events/types";

const events: V3DomainEvent[] = [
  {
    id: "e1",
    ts: "2026-04-01T00:00:00.000Z",
    tenantId: "t1",
    aggregateId: "s1",
    name: "SaleRecorded",
    payload: { saleId: "s1", invoice: "INV-1", date: "2026-04-01", customer: "Acme", total: 120 },
  },
];

describe("v3 projection job queue", () => {
  it("executes scheduled and manual rebuild jobs", async () => {
    const worker = new JournalProjectionWorker({
      snapshotKey: "queue:test",
      adapter: new InMemoryProjectionSnapshotAdapter(),
    });
    const queue = new ProjectionJobQueue(worker, () => events);

    await queue.enqueueScheduledRebuild("scheduled-1");
    await queue.enqueueManualRebuild("manual-1");
    const done = await queue.drain();

    expect(done).toHaveLength(2);
    expect(done[0].reason).toBe("scheduled");
    expect(done[1].reason).toBe("manual");
  });
});
