import type { AppState } from "@/store/appState";
import { calculateChecksum } from "@/utils/checksum";
import { BackupFile } from "@/store/persistence/backup";
import { getCurrentVersion } from "@/store/persistence/migrations";

export type ValidationErrorCode =
  | "INVALID_JSON"
  | "MISSING_FIELDS"
  | "CHECKSUM_MISMATCH"
  | "VERSION_INCOMPATIBLE"
  | "SCHEMA_INVALID";

export type ValidationError = { code: ValidationErrorCode; message: string };

export type ValidationResult = {
  valid: boolean;
  backup: BackupFile | null;
  errors: ValidationError[];
  warnings: string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isAppStateLike(v: unknown): v is AppState {
  if (!isRecord(v)) return false;
  return Array.isArray(v.laptops) && Array.isArray(v.parts) && isRecord(v.settings);
}

export async function validateBackup(file: File): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { valid: false, backup: null, errors: [{ code: "INVALID_JSON", message: "Backup file is not valid JSON" }], warnings };
  }

  if (!isRecord(parsed) || !isRecord(parsed.data) || typeof parsed.version !== "number" || typeof parsed.checksum !== "string") {
    return { valid: false, backup: null, errors: [{ code: "MISSING_FIELDS", message: "Backup missing required fields" }], warnings };
  }

  const backup = parsed as BackupFile;

  if (backup.version > getCurrentVersion()) {
    errors.push({ code: "VERSION_INCOMPATIBLE", message: "Backup version is newer than this app" });
  }

  if (!isAppStateLike(backup.data)) {
    errors.push({ code: "SCHEMA_INVALID", message: "Backup data schema invalid" });
  }

  const calculated = await calculateChecksum(backup.data);
  if (calculated !== backup.checksum) {
    errors.push({ code: "CHECKSUM_MISMATCH", message: "Backup checksum mismatch" });
  }

  const ageDays = (Date.now() - new Date(backup.exportedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 30) warnings.push("Backup older than 30 days");

  return { valid: errors.length === 0, backup, errors, warnings };
}
