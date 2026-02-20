export type WipAgingRisk = "Healthy" | "Watch" | "Risk";

function parseOpenedDate(opened: string, now: Date) {
  const trimmed = (opened || "").trim();
  if (!trimmed) return null;

  // Seeded/UI values often use `Jan 15` style; always pin current year first.
  if (/^[A-Za-z]{3,}\s+\d{1,2}$/.test(trimmed)) {
    const withYear = new Date(`${trimmed} ${now.getFullYear()}`);
    if (!Number.isNaN(withYear.getTime())) return withYear;
  }

  // Accept already ISO-like formats.
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  return null;
}

export function getWipAgingDays(opened: string, now = new Date()) {
  const start = parseOpenedDate(opened, now);
  if (!start) return 0;
  const ms = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function classifyWipAgingRisk(opened: string, status: string, now = new Date()): WipAgingRisk {
  if (status === "Completed") return "Healthy";
  const days = getWipAgingDays(opened, now);
  if (days >= 5) return "Risk";
  if (days >= 3) return "Watch";
  return "Healthy";
}
