export function formatDate(value?: string, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || value;
  return date.toISOString().slice(0, 10);
}

export function startsWithPeriod(date: string, period: string) {
  if (!date) return false;
  return date.startsWith(period);
}

export function daysSince(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
