import type { AppState } from "@/store/appState";
import { IStorageAdapter, APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";
import { StorageCorruptError, StorageError, StorageMigrationError } from "@/store/persistence/errors";
import { getCurrentVersion, PersistedState, runMigrations } from "@/store/persistence/migrations";

export type HydrationResult = {
  state: AppState | null;
  hydrated: boolean;
  error?: StorageError;
  preMigrationBackup?: PersistedState;
};

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.version === "number" && typeof obj.timestamp === "number" && obj.data != null;
}

export async function hydrateState(adapter: IStorageAdapter): Promise<HydrationResult> {
  try {
    const exists = await adapter.has(APP_STATE_KEY);
    if (!exists) return { state: null, hydrated: false };

    const raw = await adapter.get<unknown>(APP_STATE_KEY);
    if (!raw) return { state: null, hydrated: false };
    if (!isPersistedState(raw)) {
      return { state: null, hydrated: true, error: new StorageCorruptError("Persisted payload shape is invalid") };
    }

    const currentVersion = getCurrentVersion();
    if (raw.version > currentVersion) {
      return {
        state: null,
        hydrated: true,
        error: new StorageMigrationError(`Backup version v${raw.version} is newer than app v${currentVersion}`),
      };
    }

    if (raw.version < currentVersion) {
      const migrated = runMigrations(raw.data, raw.version, currentVersion);
      return { state: migrated, hydrated: true, preMigrationBackup: raw };
    }

    return { state: raw.data, hydrated: true };
  } catch (error) {
    const err = error instanceof StorageError ? error : new StorageError("UNKNOWN", "Hydration failed", error);
    return { state: null, hydrated: true, error: err };
  }
}
