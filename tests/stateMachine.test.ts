import { describe, it, expect } from "vitest";
import { canAdvance, trackStages } from "@/domain";

describe("Track state machine", () => {
  it("allows only direct next-stage progression for every track", () => {
    (Object.keys(trackStages) as Array<keyof typeof trackStages>).forEach((track) => {
      const stages = trackStages[track];
      for (let i = 0; i < stages.length - 1; i += 1) {
        expect(canAdvance(track, stages[i], stages[i + 1])).toBe(true);
      }
    });
  });

  it("blocks skipping stages", () => {
    expect(canAdvance("A", "Queue", "QC")).toBe(false);
    expect(canAdvance("B", "Queue", "Painting")).toBe(false);
    expect(canAdvance("C", "Diagnosis", "Repair")).toBe(false);
    expect(canAdvance("D", "L1 Queue", "L2 Queue")).toBe(false);
    expect(canAdvance("E", "Queue", "Parts Logged")).toBe(false);
  });

  it("blocks backward moves", () => {
    expect(canAdvance("A", "QC", "Windows Install")).toBe(false);
    expect(canAdvance("B", "Reassembly", "Drying")).toBe(false);
    expect(canAdvance("C", "Repair", "Awaiting Parts")).toBe(false);
    expect(canAdvance("D", "L2 Testing", "L1 Testing")).toBe(false);
    expect(canAdvance("E", "Complete/Disposed", "Queue")).toBe(false);
  });

  it("blocks unknown stages", () => {
    expect(canAdvance("A", "Not A Stage", "Queue")).toBe(false);
    expect(canAdvance("C", "Diagnosis", "Not A Stage")).toBe(false);
  });
});
