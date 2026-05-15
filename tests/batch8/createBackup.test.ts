import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { createFullBackup, createIncrementalBackup, generateBackupFilename } from "@/utils/backup/createBackup";
import { initChangeTracker, recordChange } from "@/utils/backup/incrementalTracker";

describe("backup creation", () => {
  it("creates full backup with checksum and metadata", async () => {
    const b = await createFullBackup(createInitialState());
    expect(b.backupType).toBe("FULL");
    expect(b.checksum).toBeTruthy();
    expect(b.metadata.recordCounts.laptops).toBeGreaterThan(0);
  });

  it("creates incremental backup from tracker", async () => {
    const tracker = initChangeTracker();
    recordChange(tracker, "laptops", "1", "UPDATE");
    const b = await createIncrementalBackup(createInitialState(), tracker);
    expect(b.backupType).toBe("INCREMENTAL");
  });

  it("filename format", () => {
    expect(generateBackupFilename("FULL", true)).toContain("-encrypted.json");
  });
});
