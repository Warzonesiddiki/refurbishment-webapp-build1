import type { AppState } from "@/store/appState";
import type { BackupFile, BackupModule } from "@/store/types/BackupTypes";
import type { RestoreConflict, RestoreOptions, RestoreResult } from "@/store/types/RestoreTypes";
import { runMigrations } from "@/utils/backup/schemaVersion";
import { generateRestorePreview } from "@/utils/backup/restorePreview";

type RollbackPoint = { id: string; state: AppState; at: string; reason: string };
const rollbackStore = new Map<string, RollbackPoint>();

export function createRollbackPoint(state: AppState, reason = "pre-restore"): RollbackPoint {
  const point = { id: crypto.randomUUID(), state: structuredClone(state), at: new Date().toISOString(), reason };
  rollbackStore.set(point.id, point);
  const points = [...rollbackStore.values()].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  points.slice(5).forEach((p) => rollbackStore.delete(p.id));
  return point;
}

function applyModuleRestore(module: BackupModule, backupData: unknown, state: AppState) {
  const next = structuredClone(state);
  if (module === "INVENTORY") {
    const inv = backupData as { laptops?: AppState["laptops"]; parts?: AppState["parts"] };
    if (inv.laptops) next.laptops = inv.laptops;
    if (inv.parts) next.parts = inv.parts;
  }
  if (module === "WIP") {
    const w = backupData as { records?: AppState["wipJobs"] };
    if (w.records) next.wipJobs = w.records;
  }
  if (module === "SALES") {
    const s = backupData as { sales?: AppState["sales"]; receipts?: AppState["receipts"] };
    if (s.sales) next.sales = s.sales;
    if (s.receipts) next.receipts = s.receipts;
  }
  if (module === "PURCHASES") {
    const p = backupData as { purchases?: AppState["purchases"]; payments?: AppState["payments"] };
    if (p.purchases) next.purchases = p.purchases;
    if (p.payments) next.payments = p.payments;
  }
  if (module === "FINANCE") {
    const f = backupData as { cashEntries?: AppState["cashEntries"]; ownerEntries?: AppState["ownerEntries"] };
    if (f.cashEntries) next.cashEntries = f.cashEntries;
    if (f.ownerEntries) next.ownerEntries = f.ownerEntries;
  }
  if (module === "MASTER_DATA") {
    const m = backupData as { suppliers?: AppState["suppliers"]; lots?: AppState["lots"] };
    if (m.suppliers) next.suppliers = m.suppliers;
    if (m.lots) next.lots = m.lots;
  }
  if (module === "SETTINGS") {
    const s = backupData as { config?: AppState["settings"] };
    if (s.config) next.settings = s.config;
  }
  return next;
}

export function mergeRecords(current: unknown, backup: unknown) {
  if (typeof current !== "object" || !current || typeof backup !== "object" || !backup) return backup;
  const out: Record<string, unknown> = { ...(current as Record<string, unknown>) };
  Object.entries(backup as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== null && v !== undefined) out[k] = v;
  });
  return out;
}

export function resolveConflict(conflict: RestoreConflict, resolution: "KEEP_CURRENT" | "USE_BACKUP" | "MERGE") {
  if (resolution === "KEEP_CURRENT") return conflict.currentValue;
  if (resolution === "USE_BACKUP") return conflict.backupValue;
  return mergeRecords(conflict.currentValue, conflict.backupValue);
}

export function rollbackRestore(rollbackId: string) {
  const point = rollbackStore.get(rollbackId);
  if (!point) throw new Error("Rollback point not found");
  return structuredClone(point.state);
}

export async function executeRestore(backup: BackupFile, currentState: AppState, options: RestoreOptions): Promise<RestoreResult & { nextState: AppState }> {
  const started = performance.now();
  const rollback = options.createRollbackPoint ? createRollbackPoint(currentState) : null;
  const rawData = backup.data as Record<string, unknown>;
  const migrated = backup.version < 5 ? runMigrations(rawData, backup.version, 5).data : rawData;
  let next = structuredClone(currentState);

  const moduleMap: Record<BackupModule, unknown> = {
    INVENTORY: (migrated as Record<string, unknown>).inventory,
    PARTS: (migrated as Record<string, unknown>).inventory,
    WIP: (migrated as Record<string, unknown>).wip,
    SALES: (migrated as Record<string, unknown>).sales,
    PURCHASES: (migrated as Record<string, unknown>).purchases,
    FINANCE: (migrated as Record<string, unknown>).finance,
    MASTER_DATA: (migrated as Record<string, unknown>).masterData,
    SETTINGS: (migrated as Record<string, unknown>).settings,
    AUDIT: (migrated as Record<string, unknown>).audit,
  };

  for (const module of options.modules) {
    const data = moduleMap[module];
    if (data) next = applyModuleRestore(module, data, next);
  }

  const preview = generateRestorePreview(migrated as never, currentState, options);
  return {
    success: true,
    rollbackId: rollback?.id ?? null,
    appliedChanges: preview.totalChanges,
    skippedConflicts: 0,
    errors: [],
    duration: Math.round(performance.now() - started),
    completedAt: new Date().toISOString(),
    nextState: next,
  };
}
