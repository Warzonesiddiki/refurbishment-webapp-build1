import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import type { BackupData } from "@/store/types/BackupTypes";
import { runRestoreRehearsal } from "@/utils/backup/restoreRehearsal";

describe("runRestoreRehearsal", () => {
  it("passes when selected scoped modules are present and non-selected modules are preserved", () => {
    const state = createInitialState();
    const backup: BackupData = {
      settings: { config: { ...state.settings, companyName: "Rehearsal Co" }, sequences: {}, vatConfig: {} },
    };

    const report = runRestoreRehearsal(state, backup, ["SETTINGS"]);

    expect(report.passed).toBe(true);
    expect(report.checks.some((check) => check.id === "module-settings-applied" && check.passed)).toBe(true);
    expect(report.checks.some((check) => check.id === "module-sales-preserved" && check.passed)).toBe(true);
  });

  it("fails when selected modules are missing from scoped payload", () => {
    const state = createInitialState();
    const backup: BackupData = {};

    const report = runRestoreRehearsal(state, backup, ["FINANCE"]);

    expect(report.passed).toBe(false);
    expect(report.checks.some((check) => check.id === "module-finance-applied" && !check.passed)).toBe(true);
  });
});
