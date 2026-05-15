import { describe, expect, it } from "vitest";
import { auditReducer, createInitialAuditState } from "@/store/reducers/auditReducer";

describe("entity snapshots", () => {
  it("creates snapshots and increments version", () => {
    let s = createInitialAuditState();
    s = auditReducer(s, { type: "CREATE_ENTITY_SNAPSHOT", payload: { entityType: "SALE", entityId: "1", data: { total: 10 }, auditLogId: "a1", description: "create" } });
    s = auditReducer(s, { type: "CREATE_ENTITY_SNAPSHOT", payload: { entityType: "SALE", entityId: "1", data: { total: 20 }, auditLogId: "a2", description: "update" } });
    expect(s.snapshots.SALE["1"]).toHaveLength(2);
    expect(s.snapshots.SALE["1"][1].version).toBe(2);
  });
});
