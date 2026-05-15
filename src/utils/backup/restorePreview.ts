import type { AppState } from "@/store/appState";
import type { BackupData, BackupModule } from "@/store/types/BackupTypes";
import type { RestoreConflict, RestoreOptions, RestorePreview } from "@/store/types/RestoreTypes";

const excludeTs = (obj: Record<string, unknown>) => {
  const copy = { ...obj };
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
};

export function compareEntities(backupEntity: unknown, currentEntity: unknown): "SAME" | "DIFFERENT" | "ADDED" | "DELETED" {
  if (backupEntity === undefined) return "DELETED";
  if (currentEntity === undefined) return "ADDED";
  return JSON.stringify(excludeTs(backupEntity as Record<string, unknown>)) === JSON.stringify(excludeTs(currentEntity as Record<string, unknown>))
    ? "SAME"
    : "DIFFERENT";
}

export function detectConflicts(backupData: BackupData, currentState: AppState, backupDate: string): RestoreConflict[] {
  const conflicts: RestoreConflict[] = [];
  const bSales = backupData.sales?.sales ?? [];
  bSales.forEach((s) => {
    const id = String((s as Record<string, unknown>).id ?? "");
    const current = currentState.sales.find((x) => x.id === id);
    if (current && +new Date(current.date) > +new Date(backupDate)) {
      conflicts.push({
        entityType: "SALE",
        entityId: id,
        entityRef: current.invoice,
        conflictType: "MODIFIED_SINCE_BACKUP",
        currentValue: current,
        backupValue: s,
        resolution: null,
      });
    }
  });
  return conflicts;
}

export function calculateSequenceUpdates(backupSequences: Record<string, number>, currentSequences: Record<string, number>) {
  const out: Record<string, { current: number; new: number }> = {};
  Object.keys(backupSequences).forEach((k) => {
    if ((backupSequences[k] ?? 0) <= (currentSequences[k] ?? 0)) out[k] = { current: currentSequences[k] ?? 0, new: (currentSequences[k] ?? 0) + 1 };
  });
  return out;
}

function previewModule(module: BackupModule, backupList: Record<string, unknown>[], currentList: Record<string, unknown>[]) {
  const currentMap = new Map(currentList.map((x) => [String(x.id), x]));
  const backupMap = new Map(backupList.map((x) => [String(x.id), x]));
  const add = backupList.filter((x) => !currentMap.has(String(x.id)));
  const update = backupList.filter((x) => currentMap.has(String(x.id)) && compareEntities(x, currentMap.get(String(x.id))) === "DIFFERENT");
  const del = currentList.filter((x) => !backupMap.has(String(x.id)));
  const unchanged = backupList.length - add.length - update.length;
  return {
    module,
    toAdd: add.length,
    toUpdate: update.length,
    toDelete: del.length,
    unchanged,
    conflicts: 0,
    samples: { add: add.slice(0, 3), update: update.slice(0, 3), delete: del.slice(0, 3) },
  };
}

export function generateRestorePreview(backup: BackupData, currentState: AppState, options: RestoreOptions): RestorePreview {
  const modules = options.modules;
  const previews = [];
  if (modules.includes("INVENTORY") && backup.inventory) previews.push(previewModule("INVENTORY", backup.inventory.laptops as Record<string, unknown>[], currentState.laptops as unknown as Record<string, unknown>[]));
  if (modules.includes("PARTS") && backup.inventory) previews.push(previewModule("PARTS", backup.inventory.parts as Record<string, unknown>[], currentState.parts as unknown as Record<string, unknown>[]));
  if (modules.includes("SALES") && backup.sales) previews.push(previewModule("SALES", backup.sales.sales as Record<string, unknown>[], currentState.sales as unknown as Record<string, unknown>[]));
  if (modules.includes("PURCHASES") && backup.purchases) previews.push(previewModule("PURCHASES", backup.purchases.purchases as Record<string, unknown>[], currentState.purchases as unknown as Record<string, unknown>[]));
  if (modules.includes("WIP") && backup.wip) previews.push(previewModule("WIP", backup.wip.records as Record<string, unknown>[], currentState.wipJobs as unknown as Record<string, unknown>[]));

  const conflicts = detectConflicts(backup, currentState, new Date().toISOString());
  const totalChanges = previews.reduce(
    (acc, p) => ({ additions: acc.additions + p.toAdd, updates: acc.updates + p.toUpdate, deletions: acc.deletions + p.toDelete, conflicts: acc.conflicts + p.conflicts }),
    { additions: 0, updates: 0, deletions: 0, conflicts: conflicts.length }
  );

  return {
    modules: previews,
    totalChanges,
    conflicts,
    sequenceUpdates: {},
    estimatedDuration: Math.max(100, totalChanges.additions + totalChanges.updates + totalChanges.deletions) * 5,
  };
}
