import { describe, expect, it } from "vitest";
import { StaticTokenClaimsVerifier } from "@/v3/auth/sessionClaims";
import { V3_API_VERSION } from "@/v3/api/contracts";
import { InMemoryV3Gateway } from "@/v3/api/gateway";

function verifierWithRoles(roles: Array<"admin" | "finance" | "ops" | "viewer">) {
  const verifier = new StaticTokenClaimsVerifier();
  verifier.register("secret", {
    subject: "user-1",
    tenantId: "tenant-a",
    roles,
    issuedAtIso: new Date(Date.now() - 1_000).toISOString(),
    expiresAtIso: new Date(Date.now() + 60_000).toISOString(),
  });
  return verifier;
}

describe("v3 in-memory gateway", () => {
  it("processes commands and serves filtered journal queries", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret", { claimsVerifier: verifierWithRoles(["admin"]) });

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

  it("supports scheduled projection rebuild, queue drain and parity query", async () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret", {
      projectionRebuildThreshold: 100,
      claimsVerifier: verifierWithRoles(["admin", "finance"]),
    });

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

    await gateway.runScheduledProjectionRebuild();
    const drained = await gateway.drainProjectionQueue();
    expect(drained.at(-1)?.mode).toBe("rebuild");

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

    const slo = gateway.getSloSnapshot();
    expect(slo.commandCount).toBe(1);
    expect(slo.projectionCoverageRatio).toBe(1);
    expect(slo.projectionLagCount).toBe(0);
    expect(slo.alertLevel).toBe("healthy");
  });

  it("rejects requests when role scope is missing", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret", { claimsVerifier: verifierWithRoles(["viewer"]) });

    const result = gateway.executeCommand({
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

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("should fail auth");
    expect(result.error).toBe("unauthorized");
  });

  it("rejects tenant mismatch", () => {
    const gateway = new InMemoryV3Gateway("tenant-a", "secret", { claimsVerifier: verifierWithRoles(["admin"]) });

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
