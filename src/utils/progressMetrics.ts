export type WorkProgress = {
  completedPercent: number;
  pendingPercent: number;
};

export type ProgressArea = {
  key: string;
  label: string;
  completed: number;
  total: number;
};

export function toWorkProgress(completed: number, total: number): WorkProgress {
  const safeTotal = Math.max(1, total);
  const clampedCompleted = Math.min(Math.max(0, completed), safeTotal);
  const completedPercent = Math.round((clampedCompleted / safeTotal) * 100);
  return {
    completedPercent,
    pendingPercent: 100 - completedPercent,
  };
}

export function aggregateProgress(areas: ProgressArea[]): WorkProgress {
  const completed = areas.reduce((sum, area) => sum + area.completed, 0);
  const total = areas.reduce((sum, area) => sum + area.total, 0);
  return toWorkProgress(completed, total);
}

export function formatProgressLabel(progress: WorkProgress): string {
  return `${progress.completedPercent}% complete / ${progress.pendingPercent}% pending`;
}
