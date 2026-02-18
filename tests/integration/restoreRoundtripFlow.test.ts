import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { createFullBackup } from "@/utils/backup/createBackup";
import { runRestoreRehearsal } from "@/utils/backup/restoreRehearsal";
import { restoreStateFromBackupData, selectBackupDataModules } from "@/utils/backup/restoreState";

describe("backup restore roundtrip flow", () => {
  it("keeps non-selected modules unchanged while restoring selected modules", async () => {
    const current = createInitialState();

    const modified = {
      ...createInitialState(),
      settings: { ...createInitialState().settings, companyName: "Roundtrip Corp" },
      sales: [
        ...createInitialState().sales,
        {
          ...createInitialState().sales[0],
          id: "sale-roundtrip-1",
          invoice: "ALM-INV-ROUNDTRIP-1",
        },
      ],
    };

    const backup = await createFullBackup(modified, { modules: ["SETTINGS", "SALES"] });
    const scoped = selectBackupDataModules(backup.data, ["SETTINGS"]);

    const rehearsal = runRestoreRehearsal(current, scoped, ["SETTINGS"]);
    expect(rehearsal.passed).toBe(true);

    const restored = restoreStateFromBackupData(current, scoped);
    expect(restored.settings.companyName).toBe("Roundtrip Corp");
    expect(restored.sales.length).toBe(current.sales.length);
  });
});
