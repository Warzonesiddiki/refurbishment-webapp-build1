import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { createFullBackup } from "@/utils/backup/createBackup";
import { executeRestore, rollbackRestore } from "@/utils/backup/restoreEngine";

describe("restore engine", () => {
  it("executes restore and creates rollback", async () => {
    const state = createInitialState();
    const backup = await createFullBackup(state);
    const result = await executeRestore(backup, state, { modules: backup.metadata.modules, conflictResolution: "ASK", preserveSequences: false, dryRun: false, createRollbackPoint: true });
    expect(result.success).toBe(true);
    expect(result.rollbackId).toBeTruthy();
    const rolled = rollbackRestore(result.rollbackId!);
    expect(rolled.laptops.length).toBe(state.laptops.length);
  });
});
