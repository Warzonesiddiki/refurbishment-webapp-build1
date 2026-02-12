export function toLocalDateStamp(date: Date = new Date()) {
  const yyyy = `${date.getFullYear()}`;
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function formatDate(value?: string, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || value;
  const stamp = toLocalDateStamp(date);
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;
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


export function nextWipNumber(existingWipNumbers: string[], date: Date = new Date()) {
  const stamp = toLocalDateStamp(date);
  const prefix = `ALM-WIP-${stamp}-`;
  let maxSeq = 0;
  for (const value of existingWipNumbers) {
    if (!value.startsWith(prefix)) continue;
    const seqPart = value.slice(prefix.length);
    const parsed = Number.parseInt(seqPart, 10);
    if (!Number.isNaN(parsed) && parsed > maxSeq) maxSeq = parsed;
  }
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}
