import type { WipRecord } from "@/store/appState";

export type TechnicianProductivity = {
  tech: string;
  track: string;
  hours: number;
  entries: number;
};

export function computeTechnicianProductivityByTrack(wipJobs: WipRecord[]): TechnicianProductivity[] {
  const bucket = new Map<string, TechnicianProductivity>();

  wipJobs.forEach((job) => {
    job.laborEntries.forEach((entry) => {
      const tech = entry.tech?.trim() || "Unknown";
      const key = `${tech}::${job.track}`;
      const current = bucket.get(key);
      if (current) {
        current.hours += entry.hours;
        current.entries += 1;
      } else {
        bucket.set(key, { tech, track: job.track, hours: entry.hours, entries: 1 });
      }
    });
  });

  return Array.from(bucket.values())
    .map((x) => ({ ...x, hours: Number(x.hours.toFixed(2)) }))
    .sort((a, b) => b.hours - a.hours);
}
