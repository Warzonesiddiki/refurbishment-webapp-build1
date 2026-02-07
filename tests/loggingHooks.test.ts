import { describe, it, expect } from "vitest";
import { logAudit, logMovement } from "@/domain";

describe("Logging stubs", () => {
  it("creates movement log entries with ids", () => {
    const log = logMovement({
      entityType: "laptop",
      entityId: "id-1",
      action: "status_change",
      from: "pending",
      to: "ready",
      userId: "user-1",
    });
    expect(log.id).toBeDefined();
    expect(log.entityType).toBe("laptop");
  });

  it("creates audit log entries with payload", () => {
    const log = logAudit({
      entityType: "sale",
      entityId: "id-2",
      action: "create",
      payload: { amount: 100 },
      userId: "user-1",
    });
    expect(log.payload?.amount).toBe(100);
  });
});
