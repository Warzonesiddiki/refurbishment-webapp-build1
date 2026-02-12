import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { createRollbackPoint, rollbackRestore } from "@/utils/backup/restoreEngine";

describe("rollback", () => {
  it("creates and restores rollback point", () => {
    const point = createRollbackPoint(createInitialState(), "test");
    const restored = rollbackRestore(point.id);
    expect(restored.sales.length).toBeGreaterThan(0);
  });
});
