import { describe, expect, it } from "vitest";
import { checkReferentialIntegrity, validateBackupFile, validateBackupStructure } from "@/utils/backup/validateBackup";

describe("backup validation", () => {
  it("validates structure", () => {
    expect(validateBackupStructure({} as unknown).valid).toBe(false);
  });

  it("parses file payload path", async () => {
    const sample = {
      version: 5,
      appVersion: "0.0.0",
      backupId: "id-1",
      backupType: "FULL",
      parentBackupId: null,
      exportedAt: new Date().toISOString(),
      exportedBy: null,
      checksum: "abc",
      encrypted: false,
      encryptionMethod: null,
      iv: null,
      salt: null,
      compression: "none",
      metadata: {
        deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
        recordCounts: {},
        dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
        modules: ["INVENTORY"],
        size: 1,
        incrementalSince: null,
      },
      data: { inventory: { laptops: [], parts: [], movements: [] } },
    };
    const file = new File([JSON.stringify(sample)], "b.json", { type: "application/json" });
    const result = await validateBackupFile(file);
    expect(result).toHaveProperty("valid");
  });

  it("detects referential issues", () => {
    const errors = checkReferentialIntegrity({ sales: { sales: [{ lineItems: [{ laptopId: "missing" }] }], receipts: [], arLedger: [] } });
    expect(errors.length).toBeGreaterThan(0);
  });
});
