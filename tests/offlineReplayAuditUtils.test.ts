import { describe, expect, it } from "vitest";
import {
  appendOfflineReplayAudit,
  clearOfflineReplayAudit,
  readOfflineReplayAudit,
  replayAuditToCsv,
} from "@/utils/offlineReplayAudit";

describe("offlineReplayAudit utils", () => {
  it("appends replay audit records", () => {
    clearOfflineReplayAudit();
    appendOfflineReplayAudit({ type: "WIP_ADD_PART", summary: "Queued add part" }, "replayed");
    const records = readOfflineReplayAudit();
    expect(records.length).toBe(1);
    expect(records[0].outcome).toBe("replayed");
  });

  it("exports csv", () => {
    const csv = replayAuditToCsv([
      { id: "1", ts: "2026-01-01T00:00:00.000Z", type: "WIP_ADD_PART", summary: "Queued", outcome: "dismissed" },
    ]);
    expect(csv).toContain("timestamp,type,summary,outcome");
    expect(csv).toContain("dismissed");
  });
});
