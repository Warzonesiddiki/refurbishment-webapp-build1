export const LAST_SESSION_SUMMARY_KEY = "tahir_last_session_summary";
export const SESSION_HISTORY_KEY = "tahir_session_history";
export const SESSION_SUMMARY_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_SESSION_HISTORY = 10;
const MAX_FUTURE_DRIFT_MS = 5 * 60 * 1000;

export type LastSessionSummary = {
  completedPercent: number;
  pendingPercent: number;
  endedAt: string;
};

export type SessionHistoryStats = {
  totalSessions: number;
  averageCompletionPercent: number;
  bestCompletionPercent: number;
  worstCompletionPercent: number;
};

export type SessionMomentum = {
  direction: "up" | "down" | "flat";
  deltaPercent: number;
};

function normalizeSummary(summary: Partial<LastSessionSummary>): LastSessionSummary | null {
  if (
    typeof summary?.completedPercent !== "number" ||
    typeof summary?.pendingPercent !== "number" ||
    typeof summary?.endedAt !== "string"
  ) {
    return null;
  }

  const completedPercent = Math.max(0, Math.min(100, Math.round(summary.completedPercent)));
  const pendingPercent = Math.max(0, Math.min(100, Math.round(summary.pendingPercent)));
  const endedAtMs = Date.parse(summary.endedAt);

  if (!Number.isFinite(endedAtMs)) return null;
  if (Date.now() - endedAtMs > SESSION_SUMMARY_TTL_MS) return null;
  if (endedAtMs - Date.now() > MAX_FUTURE_DRIFT_MS) return null;

  return {
    completedPercent,
    pendingPercent,
    endedAt: new Date(endedAtMs).toISOString(),
  };
}

export function saveLastSessionSummary(summary: LastSessionSummary) {
  try {
    const normalized = normalizeSummary(summary);
    if (!normalized) return;
    sessionStorage.setItem(LAST_SESSION_SUMMARY_KEY, JSON.stringify(normalized));
  } catch {
    // Storage access is best-effort and should not block logout.
  }
}

export function appendSessionHistory(summary: LastSessionSummary) {
  try {
    const normalized = normalizeSummary(summary);
    if (!normalized) return;
    const history = loadSessionHistory();
    const nextHistory = [normalized, ...history].slice(0, MAX_SESSION_HISTORY);
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // History is best-effort and should not block logout.
  }
}

export function loadLastSessionSummary(): LastSessionSummary | null {
  try {
    const raw = sessionStorage.getItem(LAST_SESSION_SUMMARY_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as Partial<LastSessionSummary>;
    const summary = normalizeSummary(payload);
    if (!summary) {
      clearLastSessionSummary();
      return null;
    }
    return summary;
  } catch {
    return null;
  }
}

export function clearLastSessionSummary() {
  try {
    sessionStorage.removeItem(LAST_SESSION_SUMMARY_KEY);
  } catch {
    // No-op if storage is unavailable.
  }
}

export function loadSessionHistory(): LastSessionSummary[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    if (!raw) return [];
    const payload = JSON.parse(raw) as Partial<LastSessionSummary>[];
    if (!Array.isArray(payload)) return [];
    const normalized = payload
      .map((item) => normalizeSummary(item))
      .filter((item): item is LastSessionSummary => item !== null)
      .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt))
      .slice(0, MAX_SESSION_HISTORY);
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

export function summarizeSessionHistory(history: LastSessionSummary[]): SessionHistoryStats {
  if (history.length === 0) {
    return {
      totalSessions: 0,
      averageCompletionPercent: 0,
      bestCompletionPercent: 0,
      worstCompletionPercent: 0,
    };
  }

  const completionValues = history.map((item) => item.completedPercent);
  const averageCompletionPercent = Math.round(
    completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length
  );

  return {
    totalSessions: history.length,
    averageCompletionPercent,
    bestCompletionPercent: Math.max(...completionValues),
    worstCompletionPercent: Math.min(...completionValues),
  };
}

export function clearSessionHistory() {
  try {
    localStorage.removeItem(SESSION_HISTORY_KEY);
  } catch {
    // No-op if storage is unavailable.
  }
}

export function evaluateSessionMomentum(history: LastSessionSummary[]): SessionMomentum {
  if (history.length < 2) {
    return { direction: "flat", deltaPercent: 0 };
  }

  const normalized = [...history]
    .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt))
    .map((entry) => Math.max(0, Math.min(100, entry.completedPercent)));

  const recent = normalized.slice(0, 3);
  const baseline = normalized.slice(3, 6);
  const baselinePool = baseline.length > 0 ? baseline : normalized.slice(1, 4);

  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const recentAvg = avg(recent);
  const baselineAvg = avg(baselinePool);
  const deltaPercent = Math.round((recentAvg - baselineAvg) * 10) / 10;

  if (deltaPercent > 1) return { direction: "up", deltaPercent };
  if (deltaPercent < -1) return { direction: "down", deltaPercent };
  return { direction: "flat", deltaPercent };
}
