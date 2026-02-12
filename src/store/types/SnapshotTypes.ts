export type EntitySnapshot = {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  data: Record<string, unknown>;
  checksum: string;
  createdAt: string;
  createdBy: string | null;
  auditLogId: string;
  changeDescription: string;
};

export type EntityHistory = {
  entityType: string;
  entityId: string;
  currentVersion: number;
  snapshots: EntitySnapshot[];
  createdAt: string;
  lastModifiedAt: string;
};

export type DiffResult = {
  field: string;
  path: string;
  type: "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
  oldValue: unknown;
  newValue: unknown;
};
