import type { DeviceInfo } from "@/store/types/SecurityTypes";

export type BackupModule =
  | "INVENTORY"
  | "PARTS"
  | "WIP"
  | "SALES"
  | "PURCHASES"
  | "FINANCE"
  | "MASTER_DATA"
  | "SETTINGS"
  | "AUDIT";

export type BackupMetadata = {
  deviceInfo: DeviceInfo;
  recordCounts: Record<string, number>;
  dateRange: { earliest: string; latest: string };
  modules: BackupModule[];
  size: number;
  incrementalSince: string | null;
};

export type BackupData = {
  inventory?: { laptops: unknown[]; parts: unknown[]; movements: unknown[] };
  wip?: { records: unknown[]; stages: unknown[] };
  sales?: { sales: unknown[]; receipts: unknown[]; arLedger: unknown[] };
  purchases?: { purchases: unknown[]; payments: unknown[]; apLedger: unknown[] };
  finance?: { cashEntries: unknown[]; ownerEntries: unknown[]; vatTransactions: unknown[]; periods: unknown[] };
  masterData?: { suppliers: unknown[]; lots: unknown[]; categories: unknown[] };
  settings?: { config: Record<string, unknown>; sequences: Record<string, unknown>; vatConfig: Record<string, unknown> };
  audit?: { logs: unknown[]; snapshots: unknown[] };
};

export type BackupFile = {
  version: number;
  appVersion: string;
  backupId: string;
  backupType: "FULL" | "INCREMENTAL";
  parentBackupId: string | null;
  exportedAt: string;
  exportedBy: string | null;
  checksum: string;
  encrypted: boolean;
  encryptionMethod: "AES-GCM" | null;
  iv: string | null;
  salt: string | null;
  compression: "none" | "gzip";
  metadata: BackupMetadata;
  data: BackupData | string;
};
