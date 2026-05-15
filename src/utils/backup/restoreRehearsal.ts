import type { AppState } from "@/store/appState";
import type { BackupData, BackupModule } from "@/store/types/BackupTypes";
import { isRestorableBackupData, restoreStateFromBackupData, selectBackupDataModules } from "@/utils/backup/restoreState";

export type RestoreInvariantCheck = {
  id: string;
  passed: boolean;
  details: string;
};

export type RestoreRehearsalReport = {
  timestamp: string;
  selectedModules: BackupModule[];
  dryRunApplied: boolean;
  checks: RestoreInvariantCheck[];
  passed: boolean;
};

function countSection(state: AppState, module: BackupModule): number {
  switch (module) {
    case "INVENTORY":
    case "PARTS":
      return state.laptops.length + state.parts.length;
    case "WIP":
      return state.wipJobs.length;
    case "SALES":
      return state.sales.length + state.receipts.length;
    case "PURCHASES":
      return state.purchases.length + state.payments.length;
    case "FINANCE":
      return state.cashEntries.length + state.ownerEntries.length;
    case "MASTER_DATA":
      return state.suppliers.length + state.lots.length;
    case "SETTINGS":
      return Object.keys(state.settings).length;
    case "AUDIT":
      return state.auditLog.length + state.movementLog.length;
    default:
      return 0;
  }
}

export function runRestoreRehearsal(currentState: AppState, backupData: BackupData, selectedModules: BackupModule[]): RestoreRehearsalReport {
  const scopedData = selectBackupDataModules(backupData, selectedModules);
  const checks: RestoreInvariantCheck[] = [];

  checks.push({
    id: "restorable-data",
    passed: isRestorableBackupData(scopedData),
    details: isRestorableBackupData(scopedData)
      ? "Scoped backup contains at least one restorable module."
      : "Scoped backup contains no restorable modules.",
  });

  const dryRunState = restoreStateFromBackupData(currentState, scopedData);

  for (const module of selectedModules) {
    const beforeCount = countSection(currentState, module);
    const afterCount = countSection(dryRunState, module);
    const modulePresent = module === "PARTS"
      ? Boolean(scopedData.inventory)
      : Boolean((scopedData as Record<string, unknown>)[
        module === "MASTER_DATA" ? "masterData" : module.toLowerCase()
      ]);
    checks.push({
      id: `module-${module.toLowerCase()}-applied`,
      passed: modulePresent,
      details: `Module ${module} selected; scoped payload present=${modulePresent}. dry-run count before=${beforeCount}, after=${afterCount}.`,
    });
  }

  const unchangedModules = (["INVENTORY", "PARTS", "WIP", "SALES", "PURCHASES", "FINANCE", "MASTER_DATA", "SETTINGS", "AUDIT"] as BackupModule[])
    .filter((module) => !selectedModules.includes(module));

  for (const module of unchangedModules) {
    const beforeCount = countSection(currentState, module);
    const afterCount = countSection(dryRunState, module);
    checks.push({
      id: `module-${module.toLowerCase()}-preserved`,
      passed: beforeCount === afterCount,
      details: `Module ${module} preserved count before=${beforeCount}, after=${afterCount}.`,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    selectedModules,
    dryRunApplied: true,
    checks,
    passed: checks.every((check) => check.passed),
  };
}
