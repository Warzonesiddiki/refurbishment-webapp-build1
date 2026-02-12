import { describe, expect, it } from "vitest";
import { createInitialAuditState } from "@/store/reducers/auditReducer";
import { selectAuditLogs, selectAuditStats, selectIntegrityStatus } from "@/store/selectors/auditSelectors";

describe("audit selectors", () => {
  it("filters and aggregates", () => {
    const state = createInitialAuditState();
    expect(selectAuditLogs(state)).toEqual([]);
    const stats = selectAuditStats(state, "day");
    expect(stats.totalActions).toBe(0);
    expect(selectIntegrityStatus(state).valid).toBe(0);
  });
});
