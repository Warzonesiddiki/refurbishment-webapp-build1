export type SchemaMigration = {
  fromVersion: number;
  toVersion: number;
  description: string;
  migrate: (data: unknown) => unknown;
  validate: (data: unknown) => boolean;
  rollback?: (data: unknown) => unknown;
};

export type SchemaVersion = {
  version: number;
  name: string;
  releasedAt: string;
  description: string;
  breaking: boolean;
  migrations: SchemaMigration[];
};

export type VersionCompatibility = {
  backupVersion: number;
  currentVersion: number;
  compatible: boolean;
  requiresMigration: boolean;
  migrationPath: number[];
  warnings: string[];
  errors: string[];
};
