import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeTechnicianProductivityByTrack } from "@/utils/wipProductivity";

describe("computeTechnicianProductivityByTrack", () => {
  it("groups labor by technician and track", () => {
    const state = createInitialState();
    const jobs = state.wipJobs.map((job) => ({
      ...job,
      laborEntries: [
        { tech: "Ali", hours: 1, rate: 10, date: "today" },
        { tech: "Ali", hours: 0.5, rate: 10, date: "today" },
      ],
    }));

    const rows = computeTechnicianProductivityByTrack(jobs);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].tech).toBe("Ali");
    expect(rows[0].hours).toBeGreaterThan(0);
  });
});
