import type { BackupFile, BackupModule } from "@/store/types/BackupTypes";
import type { VersionCompatibility } from "@/store/types/SchemaVersionTypes";

export type RestoreErrorCode =
  | "INVALID_JSON"
  | "INVALID_STRUCTURE"
  | "CHECKSUM_MISMATCH"
  | "VERSION_INCOMPATIBLE"
  | "VERSION_TOO_NEW"
  | "MIGRATION_UNAVAILABLE"
  | "DECRYPTION_FAILED"
  | "WRONG_PASSWORD"
  | "CORRUPT_DATA"
  | "MISSING_REQUIRED_MODULE"
  | "REFERENTIAL_INTEGRITY";

export type RestoreError = { code: RestoreErrorCode; message: string; field: string | null; details: unknown };
export type RestoreWarning = { code: string; message: string; severity: "low" | "medium" | "high" };

export type RestoreConflict = {
  entityType: string;
  entityId: string;
  entityRef: string;
  conflictType: "MODIFIED_SINCE_BACKUP" | "SEQUENCE_COLLISION" | "REFERENCE_MISSING";
  currentValue: unknown;
  backupValue: unknown;
  resolution: "KEEP_CURRENT" | "USE_BACKUP" | "MERGE" | null;
};

export type ModuleRestorePreview = {
  module: BackupModule;
  toAdd: number;
  toUpdate: number;
  toDelete: number;
  unchanged: number;
  conflicts: number;
  samples: { add: unknown[]; update: unknown[]; delete: unknown[] };
};

export type RestoreChangeSummary = { additions: number; updates: number; deletions: number; conflicts: number };

export type RestorePreview = {
  modules: ModuleRestorePreview[];
  totalChanges: RestoreChangeSummary;
  conflicts: RestoreConflict[];
  sequenceUpdates: Record<string, { current: number; new: number }>;
  estimatedDuration: number;
};

export type RestoreOptions = {
  modules: BackupModule[];
  conflictResolution: "KEEP_CURRENT" | "USE_BACKUP" | "ASK";
  preserveSequences: boolean;
  dryRun: boolean;
  createRollbackPoint: boolean;
};

export type RestoreValidationResult = {
  valid: boolean;
  errors: RestoreError[];
  warnings: RestoreWarning[];
  backup: BackupFile | null;
  compatibility: VersionCompatibility;
  preview: RestorePreview | null;
};

export type RestoreResult = {
  success: boolean;
  rollbackId: string | null;
  appliedChanges: RestoreChangeSummary;
  skippedConflicts: number;
  errors: RestoreError[];
  duration: number;
  completedAt: string;
};
