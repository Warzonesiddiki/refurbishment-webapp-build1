export type EntityChange = {
  entityType: string;
  entityId: string;
  changeType: "CREATE" | "UPDATE";
  data: unknown;
  timestamp: string;
};

export type EntityDeletion = {
  entityType: string;
  entityId: string;
  deletedAt: string;
};

export type IncrementalBackup = {
  parentBackupId: string;
  parentChecksum: string;
  changes: EntityChange[];
  deletions: EntityDeletion[];
  sequenceUpdates: Record<string, number>;
};

export type ChangeTracker = {
  lastFullBackupAt: string | null;
  lastIncrementalBackupAt: string | null;
  lastBackupId: string | null;
  changesSinceBackup: number;
  changedEntities: Record<string, string[]>;
  deletedEntities: Record<string, string[]>;
  sequenceChanges: Record<string, number>;
};

export type BackupChain = {
  fullBackupId: string;
  fullBackupAt: string;
  incrementals: Array<{ id: string; at: string; changeCount: number }>;
  totalChanges: number;
  chainValid: boolean;
};
