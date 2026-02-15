import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeWipLaborDrilldown, laborDrilldownToCsv } from "@/utils/wipLaborDrilldown";

describe("wip labor drilldown", () => {
  it("computes track-level variance", () => {
    const state = createInitialState();
    const rows = computeWipLaborDrilldown(state.wipJobs);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("varianceCost");
  });

  it("exports csv rows", () => {
    const csv = laborDrilldownToCsv([
      {
        track: "Track C",
        jobs: 1,
        plannedHours: 2,
        actualHours: 3,
        varianceHours: 1,
        plannedCost: 100,
        actualCost: 150,
        varianceCost: 50,
      },
    ]);
    expect(csv).toContain("track,jobs,planned_hours");
    expect(csv).toContain("Track C");
  });
});
