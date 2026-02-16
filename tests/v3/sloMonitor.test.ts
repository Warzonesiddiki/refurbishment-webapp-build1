import { describe, expect, it } from "vitest";
import { V3SloMonitor } from "@/v3/observability/sloMonitor";

describe("v3 slo monitor", () => {
  it("tracks projection coverage and drift rate", () => {
    const monitor = new V3SloMonitor();

    monitor.recordCommandProcessed();
    monitor.recordCommandProcessed();
    monitor.recordProjectionEventCount(2);
    monitor.recordProjectionLagCount(0);
    monitor.recordParityDriftCount(1);

    const snapshot = monitor.snapshot();
    expect(snapshot.commandCount).toBe(2);
    expect(snapshot.projectionCoverageRatio).toBe(1);
    expect(snapshot.parityDriftRate).toBe(0.5);
    expect(snapshot.alertLevel).toBe("critical");
  });

  it("reports healthy when coverage and drift are within thresholds", () => {
    const monitor = new V3SloMonitor();

    monitor.recordCommandProcessed();
    monitor.recordProjectionEventCount(1);
    monitor.recordProjectionLagCount(0);
    monitor.recordParityDriftCount(0);

    const snapshot = monitor.snapshot();
    expect(snapshot.alertLevel).toBe("healthy");
    expect(snapshot.projectionLagCount).toBe(0);
  });

  it("reports warning when projection lag exists", () => {
    const monitor = new V3SloMonitor();

    monitor.recordCommandProcessed();
    monitor.recordProjectionEventCount(1);
    monitor.recordProjectionLagCount(3);
    monitor.recordParityDriftCount(0);

    const snapshot = monitor.snapshot();
    expect(snapshot.alertLevel).toBe("warning");
  });
});
