const DIAGNOSTICS_STORAGE_KEY = "runtime_diagnostics_v1";
const MAX_EVENTS = 50;

export type RuntimeDiagnosticLevel = "info" | "warning" | "error";

export type RuntimeDiagnosticEvent = {
  id: string;
  ts: string;
  level: RuntimeDiagnosticLevel;
  source: string;
  message: string;
  context?: string;
};

export type BuildMetadata = {
  appVersion: string;
  buildHash: string;
  buildTime: string;
  mode: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listRuntimeEvents(): RuntimeDiagnosticEvent[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RuntimeDiagnosticEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRuntimeEvent(event: Omit<RuntimeDiagnosticEvent, "id" | "ts">) {
  if (!canUseStorage()) return;

  const next: RuntimeDiagnosticEvent = {
    id: uid(),
    ts: new Date().toISOString(),
    ...event,
  };

  const events = [next, ...listRuntimeEvents()].slice(0, MAX_EVENTS);
  window.localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(events));
}

export function clearRuntimeEvents() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DIAGNOSTICS_STORAGE_KEY);
}

export function getBuildMetadata(): BuildMetadata {
  const env = import.meta.env;
  return {
    appVersion: env.VITE_APP_VERSION ?? "0.0.0-dev",
    buildHash: env.VITE_BUILD_HASH ?? "local",
    buildTime: env.VITE_BUILD_TIME ?? "unknown",
    mode: env.MODE ?? "development",
  };
}
