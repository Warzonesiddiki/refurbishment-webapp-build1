import { describe, expect, it } from "vitest";
import { V3SloMonitor } from "@/v3/observability/sloMonitor";

describe("v3 slo monitor", () => {
  it("tracks projection coverage and drift rate", () => {
    const monitor = new V3SloMonitor();

    monitor.recordCommandProcessed();
    monitor.recordCommandProcessed();
    monitor.recordProjectionEventCount(2);
    monitor.recordParityDriftCount(1);

    const snapshot = monitor.snapshot();
    expect(snapshot.commandCount).toBe(2);
    expect(snapshot.projectionCoverageRatio).toBe(1);
    expect(snapshot.parityDriftRate).toBe(0.5);
  });
});
