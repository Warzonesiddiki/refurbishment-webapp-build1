import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeTrackProductivityTrends } from "@/utils/wipTrackTrend";

describe("computeTrackProductivityTrends", () => {
  it("aggregates avg labor hours per entry by track", () => {
    const state = createInitialState();
    const trends = computeTrackProductivityTrends(
      state.wipJobs.map((job) => ({
        ...job,
        laborEntries: [
          { tech: "A", hours: 1, rate: 10, date: "today" },
          { tech: "A", hours: 3, rate: 10, date: "today" },
        ],
      }))
    );

    expect(trends.length).toBeGreaterThan(0);
    expect(trends[0].avgHoursPerEntry).toBeGreaterThan(0);
  });
});
