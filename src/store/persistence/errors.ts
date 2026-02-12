export type StorageErrorCode =
  | "QUOTA_EXCEEDED"
  | "DATA_CORRUPT"
  | "MIGRATION_FAILED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export class StorageError extends Error {
  code: StorageErrorCode;
  cause?: unknown;

  constructor(code: StorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.cause = cause;
  }
}

export class StorageQuotaError extends StorageError {
  constructor(message = "Storage quota exceeded", cause?: unknown) {
    super("QUOTA_EXCEEDED", message, cause);
    this.name = "StorageQuotaError";
  }
}

export class StorageCorruptError extends StorageError {
  constructor(message = "Stored data is corrupt", cause?: unknown) {
    super("DATA_CORRUPT", message, cause);
    this.name = "StorageCorruptError";
  }
}

export class StorageMigrationError extends StorageError {
  constructor(message = "State migration failed", cause?: unknown) {
    super("MIGRATION_FAILED", message, cause);
    this.name = "StorageMigrationError";
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message = "Storage is unavailable", cause?: unknown) {
    super("UNAVAILABLE", message, cause);
    this.name = "StorageUnavailableError";
  }
}
