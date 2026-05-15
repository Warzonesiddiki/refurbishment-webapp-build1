import type { AppState } from "@/store/appState";

export type BackupEnvelopeV1 = {
  version: 1;
  app: "ALMASFUFA";
  exportedAt: string;
  data: AppState;
};

const requiredKeys: Array<keyof AppState> = [
  "laptops",
  "parts",
  "wipJobs",
  "sales",
  "receipts",
  "purchases",
  "payments",
  "cashEntries",
  "ownerEntries",
  "suppliers",
  "lots",
  "activity",
  "alerts",
  "notifications",
  "movementLog",
  "auditLog",
  "settings",
  "cashDayOpen",
  "searchResults",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidAppStateShape(value: unknown): value is AppState {
  if (!isObject(value)) return false;
  return requiredKeys.every((key) => key in value);
}

export function createBackupPayload(state: AppState): BackupEnvelopeV1 {
  return {
    version: 1,
    app: "ALMASFUFA",
    exportedAt: new Date().toISOString(),
    data: state,
  };
}

export function parseBackupPayload(text: string): { state: AppState | null; error: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { state: null, error: "Invalid JSON file. Please upload a valid backup." };
  }

  if (isValidAppStateShape(parsed)) {
    return { state: parsed, error: null };
  }

  if (!isObject(parsed)) {
    return { state: null, error: "Backup file is missing required data sections." };
  }

  if (parsed.version === 1 && parsed.app === "ALMASFUFA" && isValidAppStateShape(parsed.data)) {
    return { state: parsed.data, error: null };
  }

  return { state: null, error: "Backup file is missing required data sections." };
}
