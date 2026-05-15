import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeWipQualityAnalytics } from "@/utils/wipQualityAnalytics";

describe("computeWipQualityAnalytics", () => {
  it("calculates ready jobs and labor approval rates", () => {
    const state = createInitialState();
    const jobs = state.wipJobs.map((job, idx) =>
      idx === 0
        ? {
            ...job,
            diagnosisNotes: "ok",
            parts: [{ name: "RAM", barcode: "P1", cost: 10 }],
            laborEntries: [{ tech: "A", hours: 1, rate: 10, date: "today", approved: true }],
          }
        : {
            ...job,
            laborEntries: [{ tech: "B", hours: 1, rate: 10, date: "today", approved: false, source: "timer" }],
          }
    );

    const result = computeWipQualityAnalytics(jobs);
    expect(result.readyToComplete).toBeGreaterThanOrEqual(1);
    expect(result.pendingLaborApproval).toBe(1);
    expect(result.approvedLaborRatePct).toBeLessThan(100);
  });
});
