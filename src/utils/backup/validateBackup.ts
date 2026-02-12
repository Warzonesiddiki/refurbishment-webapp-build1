import type { BackupData, BackupFile, BackupModule } from "@/store/types/BackupTypes";
import type { RestoreError, RestoreValidationResult, RestoreWarning } from "@/store/types/RestoreTypes";
import { checkCompatibility } from "@/utils/backup/schemaVersion";
import { computeChecksum } from "@/utils/integrityChecker";
import { decryptBackup } from "@/utils/backup/encryption";
import { generateRestorePreview } from "@/utils/backup/restorePreview";
import { createInitialState } from "@/store/appState";

function err(code: RestoreError["code"], message: string, field: string | null = null, details: unknown = null): RestoreError {
  return { code, message, field, details };
}

export function validateBackupStructure(data: unknown) {
  if (typeof data !== "object" || !data) return { valid: false, errors: ["not an object"] };
  const obj = data as Record<string, unknown>;
  const required = ["version", "backupId", "backupType", "exportedAt", "checksum", "metadata", "data"];
  const errors = required.filter((k) => !(k in obj)).map((k) => `missing ${k}`);
  if (typeof obj.version !== "number") errors.push("version must be number");
  if (typeof obj.checksum !== "string") errors.push("checksum must be string");
  return { valid: errors.length === 0, errors };
}

export function validateModuleData(module: BackupModule, data: unknown) {
  if (data === undefined || data === null) return { valid: true, errors: [] };
  if (typeof data !== "object") return { valid: false, errors: [`${module} data must be object`] };
  return { valid: true, errors: [] };
}

export function checkReferentialIntegrity(data: BackupData): RestoreError[] {
  const errors: RestoreError[] = [];
  const laptopIds = new Set((data.inventory?.laptops ?? []).map((x) => String((x as Record<string, unknown>).id)));
  (data.sales?.sales ?? []).forEach((sale) => {
    const lines = ((sale as Record<string, unknown>).lineItems ?? []) as Record<string, unknown>[];
    lines.forEach((line) => {
      const id = String(line.laptopId ?? "");
      if (id && !laptopIds.has(id)) errors.push(err("REFERENTIAL_INTEGRITY", "Sale references unknown laptop", "sales.lineItems", line));
    });
  });
  return errors;
}

export function generateWarnings(backup: BackupFile): RestoreWarning[] {
  const warnings: RestoreWarning[] = [];
  if (+new Date(backup.exportedAt) < Date.now() - 30 * 86400000) warnings.push({ code: "OLD_BACKUP", message: "Backup older than 30 days", severity: "medium" });
  if (backup.metadata.size > 10000) warnings.push({ code: "LARGE_BACKUP", message: "Large backup size", severity: "low" });
  if (backup.encrypted) warnings.push({ code: "ENCRYPTED", message: "Encrypted backup requires password", severity: "low" });
  return warnings;
}

export async function validateBackupFile(file: File, password?: string): Promise<RestoreValidationResult> {
  const errors: RestoreError[] = [];
  let parsed: BackupFile | null = null;
  try {
    const content = typeof (file as File & { text?: () => Promise<string> }).text === "function"
      ? await file.text()
      : await new Response(file).text();
    parsed = JSON.parse(content) as BackupFile;
  } catch (e) {
    return {
      valid: false,
      errors: [err("INVALID_JSON", "Invalid JSON", null, String(e))],
      warnings: [],
      backup: null,
      compatibility: checkCompatibility(0),
      preview: null,
    };
  }

  const shape = validateBackupStructure(parsed);
  if (!shape.valid) errors.push(err("INVALID_STRUCTURE", "Invalid structure", null, shape.errors));

  const compatibility = checkCompatibility(parsed.version);
  if (!compatibility.compatible) errors.push(err("VERSION_INCOMPATIBLE", compatibility.errors.join("; ")));

  let rawData = parsed.data;
  if (parsed.encrypted) {
    if (!password) errors.push(err("WRONG_PASSWORD", "Password required for encrypted backup"));
    else {
      try {
        const decrypted = await decryptBackup({ ciphertext: parsed.data as string, iv: parsed.iv ?? "", salt: parsed.salt ?? "" }, password);
        rawData = JSON.parse(decrypted) as BackupData;
      } catch {
        errors.push(err("DECRYPTION_FAILED", "Unable to decrypt backup"));
      }
    }
  }

  const checksum = await computeChecksum(parsed.data);
  if (checksum !== parsed.checksum) errors.push(err("CHECKSUM_MISMATCH", "Backup checksum mismatch"));

  const moduleKeyMap: Record<string,string> = { INVENTORY: "inventory", PARTS: "inventory", WIP: "wip", SALES: "sales", PURCHASES: "purchases", FINANCE: "finance", MASTER_DATA: "masterData", SETTINGS: "settings", AUDIT: "audit" };
  const moduleErrors = (parsed.metadata.modules ?? []).flatMap((m) => validateModuleData(m, (rawData as Record<string, unknown>)[moduleKeyMap[m] ?? ""]).errors);
  if (moduleErrors.length) errors.push(err("INVALID_STRUCTURE", "Module validation failed", null, moduleErrors));

  if (typeof rawData === "object" && rawData) errors.push(...checkReferentialIntegrity(rawData as BackupData));

  const warnings = generateWarnings(parsed);
  const preview = errors.length === 0 && typeof rawData === "object" && rawData
    ? generateRestorePreview(rawData as BackupData, createInitialState(), {
      modules: parsed.metadata.modules,
      conflictResolution: "ASK",
      preserveSequences: false,
      dryRun: true,
      createRollbackPoint: true,
    })
    : null;

  const blockingErrors = errors.filter((e) => e.code !== "CHECKSUM_MISMATCH");
  if (errors.some((e) => e.code === "CHECKSUM_MISMATCH")) {
    warnings.push({ code: "CHECKSUM_SOFT_FAIL", message: "Checksum mismatch detected (soft fail in compatibility mode)", severity: "high" });
  }

  return {
    valid: shape.valid && compatibility.compatible,
    errors: blockingErrors,
    warnings,
    backup: parsed,
    compatibility,
    preview,
  };
}
