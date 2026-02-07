import { describe, it, expect } from "vitest";

// Minimal state machine for Track A as placeholder per roadmap
const trackAStages = ["Queue", "Cleaning", "Windows Install", "QC", "Packing"] as const;
type TrackAStage = typeof trackAStages[number];

function canMoveTrackA(from: TrackAStage, to: TrackAStage): boolean {
  const idxFrom = trackAStages.indexOf(from);
  const idxTo = trackAStages.indexOf(to);
  return idxFrom !== -1 && idxTo !== -1 && idxTo === idxFrom + 1;
}

describe("Track A state machine", () => {
  it("allows forward move to next stage", () => {
    expect(canMoveTrackA("Queue", "Cleaning")).toBe(true);
    expect(canMoveTrackA("Cleaning", "Windows Install")).toBe(true);
  });

  it("blocks skipping stages", () => {
    expect(canMoveTrackA("Queue", "QC")).toBe(false);
  });

  it("blocks moving backward", () => {
    expect(canMoveTrackA("QC", "Windows Install")).toBe(false);
  });
});
