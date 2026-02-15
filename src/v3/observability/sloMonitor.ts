export type V3SloSnapshot = {
  recordedAtIso: string;
  commandCount: number;
  projectionEventCount: number;
  projectionCoverageRatio: number;
  parityDriftCount: number;
  parityDriftRate: number;
};

export class V3SloMonitor {
  private commandCount = 0;
  private projectionEventCount = 0;
  private parityDriftCount = 0;

  recordCommandProcessed() {
    this.commandCount += 1;
  }

  recordProjectionEventCount(count: number) {
    this.projectionEventCount = count;
  }

  recordParityDriftCount(count: number) {
    this.parityDriftCount = count;
  }

  snapshot(): V3SloSnapshot {
    const coverage = this.commandCount === 0 ? 1 : Math.min(1, this.projectionEventCount / this.commandCount);
    const driftRate = this.commandCount === 0 ? 0 : this.parityDriftCount / this.commandCount;

    return {
      recordedAtIso: new Date().toISOString(),
      commandCount: this.commandCount,
      projectionEventCount: this.projectionEventCount,
      projectionCoverageRatio: coverage,
      parityDriftCount: this.parityDriftCount,
      parityDriftRate: driftRate,
    };
  }
}
