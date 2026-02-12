import { createContext, useContext, useMemo, useState } from "react";
import type { AppState } from "@/store/appState";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { createBackup, downloadBackup } from "@/store/persistence/backup";
import { validateBackup } from "@/store/persistence/validateBackup";
import { checkStorageQuota, QuotaInfo } from "@/store/persistence/quota";
import { StorageError } from "@/store/persistence/errors";

export type PersistenceContextValue = {
  isHydrated: boolean;
  isHydrating: boolean;
  hydrationError: StorageError | null;
  lastSaved: Date | null;
  isSaving: boolean;
  storageQuota: QuotaInfo;
  clearAllData: () => Promise<void>;
  exportBackup: (state: AppState) => Promise<void>;
  importBackup: (file: File) => Promise<{ ok: boolean; errors: string[]; state?: AppState }>;
};

const PersistenceContext = createContext<PersistenceContextValue | null>(null);

export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => new LocalStorageAdapter(), []);
  const [storageQuota, setStorageQuota] = useState<QuotaInfo>({ used: 0, total: 1, percent: 0 });

  const value = useMemo<PersistenceContextValue>(() => ({
    isHydrated: true,
    isHydrating: false,
    hydrationError: null,
    lastSaved: null,
    isSaving: false,
    storageQuota,
    clearAllData: async () => {
      await adapter.clear();
      setStorageQuota(await checkStorageQuota());
    },
    exportBackup: async (state) => {
      const backup = await createBackup(state);
      downloadBackup(backup);
    },
    importBackup: async (file) => {
      const result = await validateBackup(file);
      if (!result.valid || !result.backup) {
        return { ok: false, errors: result.errors.map((e) => e.message) };
      }
      return { ok: true, errors: [], state: result.backup.data };
    },
  }), [adapter, storageQuota]);

  return <PersistenceContext.Provider value={value}>{children}</PersistenceContext.Provider>;
}

export function usePersistence() {
  return useContext(PersistenceContext);
}
