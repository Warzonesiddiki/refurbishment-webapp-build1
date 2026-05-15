import { describe, expect, it } from "vitest";
import { parseBackupJson, isValidBackupPayload } from "@/utils/backup";

describe("backup utils", () => {
  it("accepts valid app-state-shaped backup payload", () => {
    const sample = {
      laptops: [], parts: [], sales: [], receipts: [], purchases: [], payments: [],
      cashbook: [], ownerLedger: [], suppliers: [], lots: [], wipJobs: [],
      activity: [], alerts: [], notifications: [], movementLog: [], auditLog: [],
      idempotency: [], settings: {}, cashOpen: false,
    };
    expect(isValidBackupPayload(sample)).toBe(true);
  });

  it("rejects malformed backup payload", () => {
    expect(isValidBackupPayload({})).toBe(false);
    expect(() => parseBackupJson('{"hello":true}')).toThrow("Invalid backup format");
  });
});
