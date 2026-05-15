import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FileEventAdapter } from "@/v3/events/fileEventAdapter";

describe("v3 file event adapter", () => {
  it("saves and loads events from filesystem", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "v3-events-"));
    const adapter = new FileEventAdapter(dir);

    const events = [
      {
        id: "e1",
        ts: "2026-01-01T00:00:00.000Z",
        tenantId: "t1",
        aggregateId: "a1",
        name: "SaleRecorded" as const,
        payload: { saleId: "s1", invoice: "INV-1", date: "2026-01-01", customer: "Acme", total: 100 },
      },
    ];

    adapter.save("tenant:t1", events);
    expect(adapter.load("tenant:t1")).toHaveLength(1);

    adapter.clear("tenant:t1");
    expect(adapter.load("tenant:t1")).toEqual([]);
  });
});
