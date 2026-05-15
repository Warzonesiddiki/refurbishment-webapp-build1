import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateRestorePreview } from "@/utils/backup/restorePreview";

describe("restore preview", () => {
  it("generates module counts", () => {
    const state = createInitialState();
    const preview = generateRestorePreview({ inventory: { laptops: state.laptops, parts: state.parts, movements: [] } }, state, {
      modules: ["INVENTORY", "PARTS"], conflictResolution: "ASK", preserveSequences: false, dryRun: true, createRollbackPoint: true,
    });
    expect(preview.modules.length).toBeGreaterThan(0);
  });
});
