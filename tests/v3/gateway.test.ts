import { describe, expect, it } from "vitest";
import { V3_API_VERSION } from "@/v3/api/contracts";
import { InMemoryV3Gateway } from "@/v3/api/gateway";

describe("v3 in-memory gateway", () => {
  it("processes commands and serves filtered journal queries", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret");

    const commandResult = gateway.executeCommand({
      version: V3_API_VERSION,
      tenantId: "tenant-a",
      authToken: "secret",
      command: {
        idempotencyKey: "sale-s1",
        tenantId: "tenant-a",
        name: "RecordSale",
        payload: { saleId: "s1", invoice: "INV-1", date: "2026-03-10", customer: "Acme", total: 120 },
      },
    });

    expect(commandResult.ok).toBe(true);

    const queryResult = gateway.queryJournal({
      version: V3_API_VERSION,
      tenantId: "tenant-a",
      authToken: "secret",
      scope: "sales",
      window: "all-time",
      limit: 10,
    });

    if (!queryResult.ok) throw new Error("query should be ok");

    expect(queryResult.rows).toHaveLength(1);
    expect(queryResult.snapshot.eventCount).toBe(1);
    expect(queryResult.rows[0].source).toBe("sales");
  });

  it("supports scheduled projection rebuild and parity query", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret", { projectionRebuildThreshold: 100 });

    gateway.executeCommand({
      version: V3_API_VERSION,
      tenantId: "tenant-a",
      authToken: "secret",
      command: {
        idempotencyKey: "sale-s1",
        tenantId: "tenant-a",
        name: "RecordSale",
        payload: { saleId: "s1", invoice: "INV-1", date: "2026-03-10", customer: "Acme", total: 120 },
      },
    });

    const rebuild = gateway.runScheduledProjectionRebuild();
    expect(rebuild.mode).toBe("rebuild");

    const parity = gateway.queryJournalParity({
      version: V3_API_VERSION,
      tenantId: "tenant-a",
      authToken: "secret",
      legacyRows: [
        {
          id: "legacy-1",
          date: "2026-03-10",
          source: "sales",
          reference: "INV-1",
          counterparty: "Acme",
          amount: 120,
        },
      ],
    });

    expect(parity.ok).toBe(true);
    if (!parity.ok) throw new Error("parity should be ok");
    expect(parity.isAligned).toBe(true);
  });

  it("rejects invalid auth token", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret");

    const result = gateway.executeCommand({
      version: V3_API_VERSION,
      tenantId: "tenant-a",
      authToken: "wrong",
      command: {
        idempotencyKey: "sale-s1",
        tenantId: "tenant-a",
        name: "RecordSale",
        payload: { saleId: "s1", invoice: "INV-1", date: "2026-03-10", customer: "Acme", total: 120 },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("should fail auth");
    expect(result.error).toBe("unauthorized");
  });

  it("rejects tenant mismatch", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret");

    const result = gateway.queryJournal({
      version: V3_API_VERSION,
      tenantId: "tenant-b",
      authToken: "secret",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("should fail tenant routing");
    expect(result.error).toBe("tenant_mismatch");
  });
});
