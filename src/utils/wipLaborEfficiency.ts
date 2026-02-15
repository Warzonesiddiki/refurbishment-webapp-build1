import type { WipRecord } from "@/store/appState";

const TRACK_PLANNED_HOURS: Record<string, number> = {
  "Track A": 0.5,
  "Track B": 1,
  "Track C": 2,
  "Track D": 3,
  "Track E": 4,
};

export type WipLaborEfficiency = {
  plannedHours: number;
  actualHours: number;
  varianceHours: number;
  efficiencyPct: number;
};

export function computeWipLaborEfficiency(wipJobs: WipRecord[]): WipLaborEfficiency {
  const plannedHours = wipJobs.reduce((sum, job) => sum + (TRACK_PLANNED_HOURS[job.track] ?? 2), 0);
  const actualHours = wipJobs.reduce((sum, job) => sum + job.laborEntries.reduce((s, e) => s + e.hours, 0), 0);
  const varianceHours = Number((actualHours - plannedHours).toFixed(2));
  const efficiencyPct = plannedHours > 0 ? Math.round((plannedHours / Math.max(actualHours, 0.0001)) * 100) : 100;

  return {
    plannedHours: Number(plannedHours.toFixed(2)),
    actualHours: Number(actualHours.toFixed(2)),
    varianceHours,
    efficiencyPct,
  };
}
