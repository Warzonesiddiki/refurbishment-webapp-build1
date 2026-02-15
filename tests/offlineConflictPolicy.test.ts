import { describe, expect, it } from "vitest";
import { CRITICAL_CONFLICT_THRESHOLD, WARNING_CONFLICT_THRESHOLD, resolveOfflineConflictSeverity, shouldEscalateConflict } from "@/utils/offlineConflictPolicy";

describe("offlineConflictPolicy", () => {
  it("returns normal/warning/critical by conflict count", () => {
    expect(resolveOfflineConflictSeverity([])).toBe("normal");
    expect(WARNING_CONFLICT_THRESHOLD).toBeLessThan(CRITICAL_CONFLICT_THRESHOLD);
    expect(
      resolveOfflineConflictSeverity([
        { id: "1", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "2", ts: "x", type: "A", summary: "s", status: "conflict" },
      ])
    ).toBe("warning");
    expect(
      resolveOfflineConflictSeverity([
        { id: "1", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "2", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "3", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "4", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "5", ts: "x", type: "A", summary: "s", status: "conflict" },
      ])
    ).toBe("critical");
  });

  it("escalates only for critical severity", () => {
    expect(shouldEscalateConflict([])).toBe(false);
    expect(
      shouldEscalateConflict([
        { id: "1", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "2", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "3", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "4", ts: "x", type: "A", summary: "s", status: "conflict" },
        { id: "5", ts: "x", type: "A", summary: "s", status: "conflict" },
      ])
    ).toBe(true);
  });
});
