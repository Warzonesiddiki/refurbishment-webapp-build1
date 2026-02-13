import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import type { BackupData } from "@/store/types/BackupTypes";
import { isRestorableBackupData, restoreStateFromBackupData, selectBackupDataModules, shouldApplyRestore } from "@/utils/backup/restoreState";

describe("restoreStateFromBackupData", () => {
  it("applies array sections from backup payload when present", () => {
    const state = createInitialState();
    const backup: BackupData = {
      inventory: {
        laptops: [{ id: "l1", barcode: "ALM-LP-1" }],
        parts: [{ id: "p1", barcode: "ALM-PT-1" }],
        movements: [],
      },
      wip: { records: [{ id: "w1" }], stages: [] },
      sales: { sales: [{ id: "s1" }], receipts: [{ id: "r1" }], arLedger: [] },
      purchases: { purchases: [{ id: "po1" }], payments: [{ id: "pay1" }], apLedger: [] },
      finance: { cashEntries: [{ id: "c1" }], ownerEntries: [{ id: "o1" }], vatTransactions: [], periods: [] },
      masterData: { suppliers: [{ id: "sup1" }], lots: [{ id: "lot1" }], categories: [] },
      settings: { config: { companyName: "Restored Co" }, sequences: {}, vatConfig: {} },
    };

    const restored = restoreStateFromBackupData(state, backup);

    expect(restored.laptops).toEqual(backup.inventory?.laptops);
    expect(restored.parts).toEqual(backup.inventory?.parts);
    expect(restored.wipJobs).toEqual(backup.wip?.records);
    expect(restored.sales).toEqual(backup.sales?.sales);
    expect(restored.receipts).toEqual(backup.sales?.receipts);
    expect(restored.purchases).toEqual(backup.purchases?.purchases);
    expect(restored.payments).toEqual(backup.purchases?.payments);
    expect(restored.cashEntries).toEqual(backup.finance?.cashEntries);
    expect(restored.ownerEntries).toEqual(backup.finance?.ownerEntries);
    expect(restored.suppliers).toEqual(backup.masterData?.suppliers);
    expect(restored.lots).toEqual(backup.masterData?.lots);
    expect(restored.settings).toEqual(backup.settings?.config);
  });

  it("falls back to current state when backup fields have invalid shapes", () => {
    const state = createInitialState();
    const backup = {
      inventory: { laptops: "bad", parts: 123 },
      wip: { records: null },
      settings: { config: "invalid" },
    } as unknown as BackupData;

    const restored = restoreStateFromBackupData(state, backup);

    expect(restored.laptops).toBe(state.laptops);
    expect(restored.parts).toBe(state.parts);
    expect(restored.wipJobs).toBe(state.wipJobs);
    expect(restored.settings).toBe(state.settings);
  });

  it("detects whether backup contains at least one restorable module", () => {
    expect(isRestorableBackupData({ inventory: { laptops: [], parts: [], movements: [] } })).toBe(true);
    expect(isRestorableBackupData({})).toBe(false);
  });


  it("selects only requested modules before restore", () => {
    const data: BackupData = {
      inventory: { laptops: [{ id: "l1" }], parts: [{ id: "p1" }], movements: [] },
      settings: { config: { currency: "USD" }, sequences: {}, vatConfig: {} },
      sales: { sales: [{ id: "s1" }], receipts: [], arLedger: [] },
    };

    const selected = selectBackupDataModules(data, ["SETTINGS"]);

    expect(selected.settings).toEqual(data.settings);
    expect(selected.inventory).toBeUndefined();
    expect(selected.sales).toBeUndefined();
    expect(isRestorableBackupData(selected)).toBe(true);
  });


  it("treats PARTS selection as inventory payload scope", () => {
    const data: BackupData = {
      inventory: { laptops: [{ id: "l1" }], parts: [{ id: "p1" }], movements: [] },
      settings: { config: { currency: "USD" }, sequences: {}, vatConfig: {} },
    };

    const selected = selectBackupDataModules(data, ["PARTS"]);

    expect(selected.inventory).toEqual(data.inventory);
    expect(selected.settings).toBeUndefined();
    expect(isRestorableBackupData(selected)).toBe(true);
  });

  it("returns non-restorable payload when module list is empty", () => {
    const data: BackupData = {
      inventory: { laptops: [{ id: "l1" }], parts: [{ id: "p1" }], movements: [] },
      sales: { sales: [{ id: "s1" }], receipts: [], arLedger: [] },
    };

    const selected = selectBackupDataModules(data, []);

    expect(selected.inventory).toBeUndefined();
    expect(selected.sales).toBeUndefined();
    expect(isRestorableBackupData(selected)).toBe(false);
  });


  it("applies restore only when conflict policy allows", () => {
    expect(shouldApplyRestore({ conflictResolution: "ASK" })).toBe(true);
    expect(shouldApplyRestore({ conflictResolution: "USE_BACKUP" })).toBe(true);
    expect(shouldApplyRestore({ conflictResolution: "KEEP_CURRENT" })).toBe(false);
  });

});
