import type { V3DomainEvent } from "@/v3/events/types";
import { JournalProjectionWorker } from "@/v3/projections/projectionWorker";

export type ProjectionJobResult = {
  id: string;
  mode: "rebuild";
  reason: "scheduled" | "manual";
  eventCount: number;
};

export class ProjectionJobQueue {
  private jobs: Promise<ProjectionJobResult>[] = [];

  constructor(
    private readonly worker: JournalProjectionWorker,
    private readonly eventSource: () => V3DomainEvent[],
  ) {}

  enqueueScheduledRebuild(id = `job-${Date.now()}`) {
    const run = Promise.resolve().then(() => {
      const result = this.worker.rebuild(this.eventSource(), "scheduled");
      return {
        id,
        mode: "rebuild" as const,
        reason: "scheduled" as const,
        eventCount: result.snapshot.eventCount,
      };
    });

    this.jobs.push(run);
    return run;
  }

  enqueueManualRebuild(id = `manual-${Date.now()}`) {
    const run = Promise.resolve().then(() => {
      const result = this.worker.rebuild(this.eventSource(), "manual");
      return {
        id,
        mode: "rebuild" as const,
        reason: "manual" as const,
        eventCount: result.snapshot.eventCount,
      };
    });

    this.jobs.push(run);
    return run;
  }

  async drain() {
    const runs = [...this.jobs];
    this.jobs = [];
    return Promise.all(runs);
  }
}
