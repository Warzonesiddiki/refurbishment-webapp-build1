import type { WipRecord } from "@/store/appState";

export type TrackProductivityTrend = {
  track: string;
  avgHoursPerEntry: number;
  entries: number;
};

export function computeTrackProductivityTrends(wipJobs: WipRecord[]): TrackProductivityTrend[] {
  const bucket = new Map<string, { hours: number; entries: number }>();

  wipJobs.forEach((job) => {
    const current = bucket.get(job.track) ?? { hours: 0, entries: 0 };
    const hours = job.laborEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const entries = job.laborEntries.length;
    bucket.set(job.track, { hours: current.hours + hours, entries: current.entries + entries });
  });

  return Array.from(bucket.entries())
    .map(([track, value]) => ({
      track,
      entries: value.entries,
      avgHoursPerEntry: value.entries > 0 ? Number((value.hours / value.entries).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.avgHoursPerEntry - a.avgHoursPerEntry);
}
