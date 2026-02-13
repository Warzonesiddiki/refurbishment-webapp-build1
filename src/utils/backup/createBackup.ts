import type { AppState } from "@/store/appState";
import type { BackupData, BackupFile, BackupModule } from "@/store/types/BackupTypes";
import type { ChangeTracker } from "@/store/types/IncrementalBackupTypes";
import { getCurrentVersion } from "@/utils/backup/schemaVersion";
import { computeChecksum } from "@/utils/integrityChecker";
import { encryptBackup } from "@/utils/backup/encryption";

export type BackupOptions = {
  includeAudit?: boolean;
  compress?: boolean;
  encrypt?: { enabled: boolean; password?: string };
  modules?: BackupModule[];
};

const defaultModules: BackupModule[] = ["INVENTORY", "PARTS", "WIP", "SALES", "PURCHASES", "FINANCE", "MASTER_DATA", "SETTINGS"];

function buildBackupData(state: AppState, modules: BackupModule[], includeAudit = false): BackupData {
  const out: BackupData = {};
  if (modules.includes("INVENTORY") || modules.includes("PARTS")) out.inventory = { laptops: state.laptops, parts: state.parts, movements: state.movementLog };
  if (modules.includes("WIP")) out.wip = { records: state.wipJobs, stages: [] };
  if (modules.includes("SALES")) out.sales = { sales: state.sales, receipts: state.receipts, arLedger: [] };
  if (modules.includes("PURCHASES")) out.purchases = { purchases: state.purchases, payments: state.payments, apLedger: [] };
  if (modules.includes("FINANCE")) out.finance = { cashEntries: state.cashEntries, ownerEntries: state.ownerEntries, vatTransactions: [], periods: [] };
  if (modules.includes("MASTER_DATA")) out.masterData = { suppliers: state.suppliers, lots: state.lots, categories: [] };
  if (modules.includes("SETTINGS")) out.settings = { config: state.settings as unknown as Record<string, unknown>, sequences: {}, vatConfig: {} };
  if (includeAudit || modules.includes("AUDIT")) out.audit = { logs: state.auditLog, snapshots: [] };
  return out;
}

function recordCounts(data: BackupData) {
  return {
    laptops: data.inventory?.laptops.length ?? 0,
    parts: data.inventory?.parts.length ?? 0,
    wip: data.wip?.records.length ?? 0,
    sales: data.sales?.sales.length ?? 0,
    purchases: data.purchases?.purchases.length ?? 0,
  };
}

export function generateBackupFilename(type: "FULL" | "INCREMENTAL", encrypted: boolean) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `tahir-erp-${type.toLowerCase()}-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${encrypted?"-encrypted":""}.json`;
}

export async function createFullBackup(state: AppState, options: BackupOptions = {}): Promise<BackupFile> {
  const modules = options.modules ?? defaultModules;
  const data = buildBackupData(state, modules, options.includeAudit);
  let payload: BackupData | string = data;
  let encrypted = false;
  let iv: string | null = null;
  let salt: string | null = null;
  if (options.encrypt?.enabled) {
    const password = options.encrypt.password ?? "";
    const result = await encryptBackup(JSON.stringify(data), password);
    payload = result.ciphertext;
    encrypted = true;
    iv = result.iv;
    salt = result.salt;
  }
  const checksumBase = JSON.parse(JSON.stringify(payload));
  const checksum = await computeChecksum(checksumBase);
  const json = JSON.stringify(payload);
  return {
    version: getCurrentVersion(),
    appVersion: "0.0.0",
    backupId: crypto.randomUUID(),
    backupType: "FULL",
    parentBackupId: null,
    exportedAt: new Date().toISOString(),
    exportedBy: null,
    checksum,
    encrypted,
    encryptionMethod: encrypted ? "AES-GCM" : null,
    iv,
    salt,
    compression: options.compress ? "gzip" : "none",
    metadata: {
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recordCounts: recordCounts(data),
      dateRange: { earliest: state.activity.at(-1)?.time ?? new Date().toISOString(), latest: new Date().toISOString() },
      modules,
      size: json.length,
      incrementalSince: null,
    },
    data: payload,
  };
}

export async function createIncrementalBackup(state: AppState, tracker: ChangeTracker): Promise<BackupFile> {
  const changes: Record<string, unknown[]> = {};
  Object.entries(tracker.changedEntities).forEach(([entityType, ids]) => {
    const source = (state as unknown as Record<string, unknown[]>)[entityType] ?? [];
    changes[entityType] = source.filter((item) => ids.includes(String((item as Record<string, unknown>).id)));
  });
  const payload = { changes, deletions: tracker.deletedEntities, sequenceUpdates: tracker.sequenceChanges };
  return {
    version: getCurrentVersion(),
    appVersion: "0.0.0",
    backupId: crypto.randomUUID(),
    backupType: "INCREMENTAL",
    parentBackupId: tracker.lastBackupId,
    exportedAt: new Date().toISOString(),
    exportedBy: null,
    checksum: await computeChecksum(payload),
    encrypted: false,
    encryptionMethod: null,
    iv: null,
    salt: null,
    compression: "none",
    metadata: {
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recordCounts: { changes: tracker.changesSinceBackup },
      dateRange: { earliest: tracker.lastIncrementalBackupAt ?? new Date().toISOString(), latest: new Date().toISOString() },
      modules: ["INVENTORY", "PARTS", "WIP", "SALES", "PURCHASES", "FINANCE", "MASTER_DATA", "SETTINGS", "AUDIT"],
      size: JSON.stringify(payload).length,
      incrementalSince: tracker.lastIncrementalBackupAt,
    },
    data: payload as unknown as BackupData,
  };
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = generateBackupFilename(backup.backupType, backup.encrypted);
  a.click();
  URL.revokeObjectURL(url);
}
