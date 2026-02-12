import { describe, expect, it } from "vitest";
import { getChangesSinceBackup, initChangeTracker, recordChange, resetTracker, shouldSuggestBackup } from "@/utils/backup/incrementalTracker";

describe("incremental tracker", () => {
  it("tracks changes and resets", () => {
    const t = initChangeTracker();
    recordChange(t, "CASH_ENTRY", "1", "CREATE");
    recordChange(t, "laptops", "2", "UPDATE");
    expect(getChangesSinceBackup(t).changes).toBe(2);
    expect(shouldSuggestBackup(t, { changeThreshold: 2, timeThresholdMs: 999999, criticalChangeTypes: [] })).toBe(true);
    resetTracker(t, "b1", "FULL");
    expect(t.changesSinceBackup).toBe(0);
  });
});
