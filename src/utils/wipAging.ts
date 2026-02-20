export type WipAgingRisk = "Healthy" | "Watch" | "Risk";
export type WipSlaDeltaState = "Done" | "Ahead" | "DueToday" | "Overdue";

const SLA_WATCH_DAYS = 3;
const SLA_RISK_DAYS = 5;

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
  if (days >= SLA_RISK_DAYS) return "Risk";
  if (days >= SLA_WATCH_DAYS) return "Watch";
  return "Healthy";
}

export function getWipSlaRiskDeltaDays(opened: string, status: string, now = new Date()) {
  if (status === "Completed") return null;
  return SLA_RISK_DAYS - getWipAgingDays(opened, now);
}

export function formatWipSlaDelta(opened: string, status: string, now = new Date()) {
  const delta = getWipSlaRiskDeltaDays(opened, status, now);
  if (delta === null) return "Done";
  if (delta > 0) return `D-${delta}`;
  if (delta === 0) return "D-Day";
  return `D+${Math.abs(delta)}`;
}

export function getWipSlaDeltaState(opened: string, status: string, now = new Date()): WipSlaDeltaState {
  const delta = getWipSlaRiskDeltaDays(opened, status, now);
  if (delta === null) return "Done";
  if (delta > 0) return "Ahead";
  if (delta === 0) return "DueToday";
  return "Overdue";
}

export function getWipAgingRiskRank(risk: WipAgingRisk) {
  if (risk === "Risk") return 2;
  if (risk === "Watch") return 1;
  return 0;
}

export function compareWipBySlaRisk(
  a: { opened: string; status: string },
  b: { opened: string; status: string },
  now = new Date(),
) {
  const riskA = classifyWipAgingRisk(a.opened, a.status, now);
  const riskB = classifyWipAgingRisk(b.opened, b.status, now);
  const rankDiff = getWipAgingRiskRank(riskB) - getWipAgingRiskRank(riskA);
  if (rankDiff !== 0) return rankDiff;

  return getWipAgingDays(b.opened, now) - getWipAgingDays(a.opened, now);
}
