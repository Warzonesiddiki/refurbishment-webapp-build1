import type { VersionCompatibility } from "@/store/types/SchemaVersionTypes";

export const CURRENT_SCHEMA_VERSION = 5;
export const MIN_SUPPORTED_VERSION = 1;

type MigrationFn = (data: unknown) => unknown;

const migrationMap: Record<number, { to: number; description: string; migrate: MigrationFn }> = {
  1: { to: 2, description: "Add lotCounters to suppliers", migrate: (data) => data },
  2: { to: 3, description: "Normalize cash entry signs", migrate: (data) => data },
  3: { to: 4, description: "Add VAT transaction tracking", migrate: (data) => data },
  4: { to: 5, description: "Add cost tracking per unit", migrate: (data) => data },
};

export function getCurrentVersion() {
  return CURRENT_SCHEMA_VERSION;
}

export function getMigrationPath(fromVersion: number, toVersion: number) {
  const path: number[] = [];
  let v = fromVersion;
  while (v < toVersion) {
    const m = migrationMap[v];
    if (!m) break;
    path.push(m.to);
    v = m.to;
  }
  return path;
}

export function checkCompatibility(backupVersion: number): VersionCompatibility {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (backupVersion > CURRENT_SCHEMA_VERSION) errors.push("Backup version is newer than app schema");
  if (backupVersion < MIN_SUPPORTED_VERSION) errors.push("Backup version too old");
  const migrationPath = getMigrationPath(backupVersion, CURRENT_SCHEMA_VERSION);
  const requiresMigration = backupVersion < CURRENT_SCHEMA_VERSION;
  if (requiresMigration && migrationPath.at(-1) !== CURRENT_SCHEMA_VERSION) errors.push("Migration path incomplete");
  if (requiresMigration) warnings.push(`Migration required (${backupVersion} -> ${CURRENT_SCHEMA_VERSION})`);
  return {
    backupVersion,
    currentVersion: CURRENT_SCHEMA_VERSION,
    compatible: errors.length === 0,
    requiresMigration,
    migrationPath,
    warnings,
    errors,
  };
}

export function runMigrations(data: unknown, fromVersion: number, toVersion: number) {
  const applied: number[] = [];
  let current = data;
  let v = fromVersion;
  while (v < toVersion) {
    const m = migrationMap[v];
    if (!m) throw new Error(`Migration unavailable from ${v}`);
    current = m.migrate(current);
    applied.push(m.to);
    v = m.to;
  }
  return { data: current, applied };
}

export function validateMigrationChain() {
  for (let i = MIN_SUPPORTED_VERSION; i < CURRENT_SCHEMA_VERSION; i += 1) {
    if (!migrationMap[i]) return false;
  }
  return true;
}

export function getMigrationDescription(fromVersion: number, toVersion: number) {
  const descriptions: string[] = [];
  let v = fromVersion;
  while (v < toVersion) {
    const m = migrationMap[v];
    if (!m) break;
    descriptions.push(m.description);
    v = m.to;
  }
  return descriptions;
}
