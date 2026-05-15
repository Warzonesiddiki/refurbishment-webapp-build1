import { AppState } from "@/store/appState";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isValidBackupPayload(value: unknown): value is AppState {
  if (!isRecord(value)) return false;

  const requiredArrayKeys = [
    "laptops",
    "parts",
    "sales",
    "receipts",
    "purchases",
    "payments",
    "cashbook",
    "ownerLedger",
    "suppliers",
    "lots",
    "wipJobs",
    "activity",
    "alerts",
    "notifications",
    "movementLog",
    "auditLog",
    "idempotency",
  ] as const;

  for (const key of requiredArrayKeys) {
    if (!Array.isArray(value[key])) return false;
  }

  return isRecord(value.settings) && typeof value.cashOpen === "boolean";
}

export function parseBackupJson(content: string): AppState {
  const parsed: unknown = JSON.parse(content);
  if (!isValidBackupPayload(parsed)) {
    throw new Error("Invalid backup format");
  }
  return parsed;
}
