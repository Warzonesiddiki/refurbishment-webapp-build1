import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBackupReminder } from "@/hooks/useBackupReminder";
import { createInitialBackupState } from "@/store/reducers/backupReducer";

describe("backup reminder", () => {
  it("returns reminder state", () => {
    const s = createInitialBackupState();
    s.changeTracker.changesSinceBackup = 120;
    const { result } = renderHook(() => useBackupReminder(s));
    expect(result.current.shouldBackup).toBe(true);
  });
});
