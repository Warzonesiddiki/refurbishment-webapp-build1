import type { WipRecord } from "@/store/appState";

const TRACK_PLANNED_HOURS: Record<string, number> = {
  "Track A": 0.5,
  "Track B": 1,
  "Track C": 2,
  "Track D": 3,
  "Track E": 4,
};

export type WipLaborDrilldownRow = {
  track: string;
  jobs: number;
  plannedHours: number;
  actualHours: number;
  varianceHours: number;
  plannedCost: number;
  actualCost: number;
  varianceCost: number;
};

export function computeWipLaborDrilldown(wipJobs: WipRecord[]): WipLaborDrilldownRow[] {
  const byTrack = new Map<string, WipRecord[]>();
  wipJobs.forEach((job) => {
    const list = byTrack.get(job.track) ?? [];
    list.push(job);
    byTrack.set(job.track, list);
  });

  return Array.from(byTrack.entries()).map(([track, jobs]) => {
    const plannedHours = jobs.reduce((sum) => sum + (TRACK_PLANNED_HOURS[track] ?? 2), 0);
    const actualHours = jobs.reduce((sum, job) => sum + job.laborEntries.reduce((s, e) => s + e.hours, 0), 0);
    const avgRate =
      jobs.flatMap((job) => job.laborEntries).reduce((sum, e) => sum + e.rate, 0) /
      Math.max(1, jobs.flatMap((job) => job.laborEntries).length);

    const plannedCost = plannedHours * avgRate;
    const actualCost = actualHours * avgRate;

    return {
      track,
      jobs: jobs.length,
      plannedHours: Number(plannedHours.toFixed(2)),
      actualHours: Number(actualHours.toFixed(2)),
      varianceHours: Number((actualHours - plannedHours).toFixed(2)),
      plannedCost: Number(plannedCost.toFixed(2)),
      actualCost: Number(actualCost.toFixed(2)),
      varianceCost: Number((actualCost - plannedCost).toFixed(2)),
    };
  });
}

export function laborDrilldownToCsv(rows: WipLaborDrilldownRow[]): string {
  const head = "track,jobs,planned_hours,actual_hours,variance_hours,planned_cost,actual_cost,variance_cost";
  const lines = rows.map(
    (row) =>
      `${row.track},${row.jobs},${row.plannedHours},${row.actualHours},${row.varianceHours},${row.plannedCost},${row.actualCost},${row.varianceCost}`
  );
  return [head, ...lines].join("\n");
}
