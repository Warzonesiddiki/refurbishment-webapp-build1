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

export type RuntimeTelemetryPayload = RuntimeDiagnosticEvent & {
  build: BuildMetadata;
};

export type RuntimeTelemetrySink = (payload: RuntimeTelemetryPayload) => void;

let telemetrySink: RuntimeTelemetrySink | null = null;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setRuntimeTelemetrySink(sink: RuntimeTelemetrySink | null) {
  telemetrySink = sink;
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

function emitTelemetry(next: RuntimeDiagnosticEvent) {
  if (!telemetrySink) return;
  try {
    telemetrySink({
      ...next,
      build: getBuildMetadata(),
    });
  } catch {
    // Telemetry sinks must never break runtime diagnostics flow.
  }
}

export function recordRuntimeEvent(event: Omit<RuntimeDiagnosticEvent, "id" | "ts">) {
  const next: RuntimeDiagnosticEvent = {
    id: uid(),
    ts: new Date().toISOString(),
    ...event,
  };

  if (canUseStorage()) {
    try {
      const events = [next, ...listRuntimeEvents()].slice(0, MAX_EVENTS);
      window.localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Storage is best-effort (private mode/quota/security errors should not block diagnostics).
    }
  }

  emitTelemetry(next);
}

export function recordRuntimeException(error: unknown, source: string, context?: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown runtime error";

  recordRuntimeEvent({
    level: "error",
    source,
    message,
    context,
  });
}

export function installGlobalRuntimeExceptionHandlers() {
  if (typeof window === "undefined") {
    return () => {
      // no-op cleanup in non-browser environments
    };
  }

  const onWindowError = (event: ErrorEvent) => {
    const error = event.error ?? event.message ?? "Unknown window error";
    recordRuntimeException(error, "Window.ErrorEvent", event.filename || undefined);
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    recordRuntimeException(event.reason, "Window.UnhandledRejection");
  };

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
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
