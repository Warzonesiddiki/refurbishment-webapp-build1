import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { buildCompletionRoadmap } from "@/utils/completionRoadmap";

describe("buildCompletionRoadmap", () => {
  it("returns completion percentages, forecast, and prioritized actions", () => {
    const state = createInitialState();
    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));

    expect(roadmap.overallPercent).toBeGreaterThan(0);
    expect(roadmap.overallPercent).toBeLessThanOrEqual(100);
    expect(roadmap.financePercent).toBeGreaterThanOrEqual(0);
    expect(roadmap.financePercent).toBeLessThanOrEqual(100);
    expect(roadmap.forecastToTarget.targetPercent).toBe(95);
    expect(roadmap.forecastToTarget.estimatedSprintsRemaining).toBeGreaterThanOrEqual(0);
    expect(roadmap.recommendedActions.length).toBeGreaterThan(0);
    expect(roadmap.recommendedActions[0].impactPoints).toBeGreaterThanOrEqual(roadmap.recommendedActions.at(-1)!.impactPoints);
  });

  it("adds receivables control recommendation when receipts exceed sales", () => {
    const state = createInitialState();
    state.sales = [];
    state.receipts = [{ id: "r1", receipt: "R1", date: "2026-01-01", invoice: "INV1", amount: 1000, method: "Cash", reference: "X" }];

    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));
    expect(roadmap.recommendedActions.some((a) => a.id === "receivables-overrun-controls")).toBe(true);
  });
});
