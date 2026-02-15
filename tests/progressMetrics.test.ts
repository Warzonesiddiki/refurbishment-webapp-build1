import { describe, expect, it } from "vitest";
import { aggregateProgress, formatProgressLabel, toWorkProgress } from "@/utils/progressMetrics";

describe("progress metrics", () => {
  it("computes work percentages", () => {
    expect(toWorkProgress(3, 10)).toEqual({ completedPercent: 30, pendingPercent: 70 });
    expect(toWorkProgress(15, 10)).toEqual({ completedPercent: 100, pendingPercent: 0 });
  });

  it("formats progress labels", () => {
    expect(formatProgressLabel({ completedPercent: 79, pendingPercent: 21 })).toContain("79% complete");
  });

  it("aggregates progress across areas", () => {
    const progress = aggregateProgress([
      { key: "wip", label: "WIP", completed: 6, total: 10 },
      { key: "mobile", label: "Mobile", completed: 4, total: 10 },
    ]);
    expect(progress).toEqual({ completedPercent: 50, pendingPercent: 50 });
  });
});
