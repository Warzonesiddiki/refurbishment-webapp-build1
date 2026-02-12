import type { AppState } from "@/store/appState";
import { StorageMigrationError } from "@/store/persistence/errors";

export type PersistedState = {
  version: number;
  timestamp: number;
  data: AppState;
};

export type Migration = {
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => unknown;
};

export const CURRENT_PERSISTENCE_VERSION = 3;

const migrationV1ToV2: Migration = {
  fromVersion: 1,
  toVersion: 2,
  migrate: (data) => {
    const next = structuredClone(data as Record<string, unknown>);
    const suppliers = Array.isArray(next.suppliers) ? next.suppliers : [];
    next.suppliers = suppliers.map((s) => ({ ...s, lots: typeof (s as { lots?: unknown }).lots === "number" ? (s as { lots: number }).lots : 0 }));
    return next;
  },
};

const migrationV2ToV3: Migration = {
  fromVersion: 2,
  toVersion: 3,
  migrate: (data) => {
    const next = structuredClone(data as Record<string, unknown>);
    const cashEntries = Array.isArray(next.cashEntries) ? next.cashEntries : [];
    next.cashEntries = cashEntries.map((entry) => {
      const type = String((entry as { type?: unknown }).type ?? "");
      const amount = Number((entry as { amount?: unknown }).amount ?? 0);
      if (type === "Cash Out" || type === "Adjustment") return { ...entry, amount: -Math.abs(amount) };
      if (type === "Cash In") return { ...entry, amount: Math.abs(amount) };
      return entry;
    });
    return next;
  },
};

export const migrations: Migration[] = [migrationV1ToV2, migrationV2ToV3];

export function getCurrentVersion() {
  return CURRENT_PERSISTENCE_VERSION;
}

export function validateMigrationChain(targetVersion = CURRENT_PERSISTENCE_VERSION) {
  let expectedFrom = 1;
  for (const migration of migrations) {
    if (migration.fromVersion !== expectedFrom) {
      throw new StorageMigrationError(`Migration gap detected at v${expectedFrom}`);
    }
    expectedFrom = migration.toVersion;
  }
  if (expectedFrom !== targetVersion) {
    throw new StorageMigrationError(`Migration chain ends at v${expectedFrom}, expected v${targetVersion}`);
  }
}

export function runMigrations(state: unknown, fromV: number, toV: number): AppState {
  if (fromV === toV) return state as AppState;
  let current = state;
  let version = fromV;

  while (version < toV) {
    const migration = migrations.find((m) => m.fromVersion === version);
    if (!migration) throw new StorageMigrationError(`No migration found from v${version}`);
    console.info(`[persistence] running migration ${migration.fromVersion} -> ${migration.toVersion}`);
    current = migration.migrate(current);
    version = migration.toVersion;
  }

  return current as AppState;
}
