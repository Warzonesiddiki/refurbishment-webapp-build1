export type V3SloAlertLevel = "healthy" | "warning" | "critical";

export type V3SloSnapshot = {
  recordedAtIso: string;
  commandCount: number;
  projectionEventCount: number;
  projectionLagCount: number;
  projectionCoverageRatio: number;
  parityDriftCount: number;
  parityDriftRate: number;
  alertLevel: V3SloAlertLevel;
};

function evaluateAlertLevel(input: {
  projectionCoverageRatio: number;
  parityDriftRate: number;
  projectionLagCount: number;
}): V3SloAlertLevel {
  if (
    input.projectionCoverageRatio < 0.8 ||
    input.parityDriftRate > 0.1 ||
    input.projectionLagCount > 100
  ) {
    return "critical";
  }

  if (
    input.projectionCoverageRatio < 0.95 ||
    input.parityDriftRate > 0.02 ||
    input.projectionLagCount > 0
  ) {
    return "warning";
  }

  return "healthy";
}

export class V3SloMonitor {
  private commandCount = 0;
  private projectionEventCount = 0;
  private projectionLagCount = 0;
  private parityDriftCount = 0;

  recordCommandProcessed() {
    this.commandCount += 1;
  }

  recordProjectionEventCount(count: number) {
    this.projectionEventCount = count;
  }

  recordProjectionLagCount(count: number) {
    this.projectionLagCount = Math.max(0, count);
  }

  recordParityDriftCount(count: number) {
    this.parityDriftCount = count;
  }

  snapshot(): V3SloSnapshot {
    const coverage = this.commandCount === 0 ? 1 : Math.min(1, this.projectionEventCount / this.commandCount);
    const driftRate = this.commandCount === 0 ? 0 : this.parityDriftCount / this.commandCount;
    const alertLevel = evaluateAlertLevel({
      projectionCoverageRatio: coverage,
      parityDriftRate: driftRate,
      projectionLagCount: this.projectionLagCount,
    });

    return {
      recordedAtIso: new Date().toISOString(),
      commandCount: this.commandCount,
      projectionEventCount: this.projectionEventCount,
      projectionLagCount: this.projectionLagCount,
      projectionCoverageRatio: coverage,
      parityDriftCount: this.parityDriftCount,
      parityDriftRate: driftRate,
      alertLevel,
    };
  }
}
