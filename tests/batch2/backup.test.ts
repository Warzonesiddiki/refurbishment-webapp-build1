import { describe, expect, it } from "vitest";
import { createBackup } from "@/store/persistence/backup";
import { createInitialState } from "@/store/appState";

describe("batch2 backup", () => {
  it("createBackup generates expected format", async () => {
    const backup = await createBackup(createInitialState());
    expect(backup.version).toBe(3);
    expect(typeof backup.exportedAt).toBe("string");
    expect(typeof backup.checksum).toBe("string");
    expect(backup.data.laptops.length).toBeGreaterThan(0);
  });
});
