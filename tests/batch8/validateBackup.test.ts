import { describe, expect, it } from "vitest";
import { checkReferentialIntegrity, validateBackupFile, validateBackupStructure } from "@/utils/backup/validateBackup";
import { encryptBackup } from "@/utils/backup/encryption";
import { computeChecksum } from "@/utils/integrityChecker";

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

  it("returns decrypted backup payload when encrypted file is validated with correct password", async () => {
    const rawData = { inventory: { laptops: [{ id: "l1" }], parts: [], movements: [] } };
    const encrypted = await encryptBackup(JSON.stringify(rawData), "password123");
    const sample = {
      version: 5,
      appVersion: "0.0.0",
      backupId: "id-enc",
      backupType: "FULL",
      parentBackupId: null,
      exportedAt: new Date().toISOString(),
      exportedBy: null,
      checksum: await computeChecksum(encrypted.ciphertext),
      encrypted: true,
      encryptionMethod: "AES-GCM",
      iv: encrypted.iv,
      salt: encrypted.salt,
      compression: "none",
      metadata: {
        deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
        recordCounts: {},
        dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
        modules: ["INVENTORY"],
        size: 1,
        incrementalSince: null,
      },
      data: encrypted.ciphertext,
    };

    const file = { text: async () => JSON.stringify(sample) } as unknown as File;
    const result = await validateBackupFile(file, "password123");

    expect(result.errors.some((error) => error.code === "DECRYPTION_FAILED")).toBe(false);
    expect(typeof result.backup?.data).toBe("object");
    expect(result.backup?.data).toEqual(rawData);
  });


  it("marks result invalid when blocking referential integrity errors exist", async () => {
    const sample = {
      version: 5,
      appVersion: "0.0.0",
      backupId: "id-ref",
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
        modules: ["INVENTORY", "SALES"],
        size: 1,
        incrementalSince: null,
      },
      data: {
        inventory: { laptops: [], parts: [], movements: [] },
        sales: { sales: [{ lineItems: [{ laptopId: "missing" }] }], receipts: [], arLedger: [] },
      },
    };

    const file = { text: async () => JSON.stringify(sample) } as unknown as File;
    const result = await validateBackupFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "REFERENTIAL_INTEGRITY")).toBe(true);
  });

  it("marks result invalid when encrypted backup has missing password", async () => {
    const sample = {
      version: 5,
      appVersion: "0.0.0",
      backupId: "id-no-pass",
      backupType: "FULL",
      parentBackupId: null,
      exportedAt: new Date().toISOString(),
      exportedBy: null,
      checksum: "abc",
      encrypted: true,
      encryptionMethod: "AES-GCM",
      iv: "iv",
      salt: "salt",
      compression: "none",
      metadata: {
        deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
        recordCounts: {},
        dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
        modules: ["INVENTORY"],
        size: 1,
        incrementalSince: null,
      },
      data: "ciphertext",
    };

    const file = { text: async () => JSON.stringify(sample) } as unknown as File;
    const result = await validateBackupFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "WRONG_PASSWORD")).toBe(true);
  });

});
