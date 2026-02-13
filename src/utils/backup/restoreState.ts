import type { AppState } from "@/store/appState";
import type { BackupData, BackupModule } from "@/store/types/BackupTypes";
import type { RestoreOptions } from "@/store/types/RestoreTypes";



export function shouldApplyRestore(options: Pick<RestoreOptions, "conflictResolution">): boolean {
  return options.conflictResolution !== "KEEP_CURRENT";
}

function toArrayOrFallback<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}



export function selectBackupDataModules(data: BackupData, modules: BackupModule[]): BackupData {
  const selected = new Set(modules);
  return {
    inventory: selected.has("INVENTORY") || selected.has("PARTS") ? data.inventory : undefined,
    wip: selected.has("WIP") ? data.wip : undefined,
    sales: selected.has("SALES") ? data.sales : undefined,
    purchases: selected.has("PURCHASES") ? data.purchases : undefined,
    finance: selected.has("FINANCE") ? data.finance : undefined,
    masterData: selected.has("MASTER_DATA") ? data.masterData : undefined,
    settings: selected.has("SETTINGS") ? data.settings : undefined,
    audit: selected.has("AUDIT") ? data.audit : undefined,
  };
}

function toSettingsOrFallback(value: unknown, fallback: AppState["settings"]): AppState["settings"] {
  return typeof value === "object" && value !== null ? (value as AppState["settings"]) : fallback;
}


export function isRestorableBackupData(data: BackupData): boolean {
  return Boolean(
    data.inventory ||
      data.wip ||
      data.sales ||
      data.purchases ||
      data.finance ||
      data.masterData ||
      data.settings ||
      data.audit
  );
}

export function restoreStateFromBackupData(state: AppState, data: BackupData): AppState {
  return {
    ...state,
    laptops: toArrayOrFallback(data.inventory?.laptops, state.laptops),
    parts: toArrayOrFallback(data.inventory?.parts, state.parts),
    wipJobs: toArrayOrFallback(data.wip?.records, state.wipJobs),
    sales: toArrayOrFallback(data.sales?.sales, state.sales),
    receipts: toArrayOrFallback(data.sales?.receipts, state.receipts),
    purchases: toArrayOrFallback(data.purchases?.purchases, state.purchases),
    payments: toArrayOrFallback(data.purchases?.payments, state.payments),
    cashEntries: toArrayOrFallback(data.finance?.cashEntries, state.cashEntries),
    ownerEntries: toArrayOrFallback(data.finance?.ownerEntries, state.ownerEntries),
    suppliers: toArrayOrFallback(data.masterData?.suppliers, state.suppliers),
    lots: toArrayOrFallback(data.masterData?.lots, state.lots),
    settings: toSettingsOrFallback(data.settings?.config, state.settings),
  };
}
