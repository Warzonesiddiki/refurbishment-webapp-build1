import { describe, it, expect } from "vitest";
import { canAdvance, trackStages } from "@/domain";

// Integration-style: WIP stage transitions should be forward-only.
describe("WIP flow integration", () => {
  it("allows forward stage move in Track C", () => {
    const stages = trackStages.C;
    const from = stages[1];
    const to = stages[2];
    expect(canAdvance("C", from, to)).toBe(true);
  });

  it("blocks invalid stage move", () => {
    const stages = trackStages.B;
    const from = stages[0];
    const to = stages[2];
    expect(canAdvance("B", from, to)).toBe(false);
  });
});
