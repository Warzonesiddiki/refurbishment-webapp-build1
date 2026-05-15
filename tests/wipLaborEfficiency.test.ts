import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeWipLaborEfficiency } from "@/utils/wipLaborEfficiency";

describe("computeWipLaborEfficiency", () => {
  it("calculates planned vs actual labor metrics", () => {
    const state = createInitialState();
    const result = computeWipLaborEfficiency(state.wipJobs);
    expect(result.plannedHours).toBeGreaterThan(0);
    expect(result.actualHours).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.efficiencyPct)).toBe(true);
  });
});
