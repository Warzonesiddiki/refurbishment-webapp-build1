import type { BackupFile } from "@/store/types/BackupTypes";

export type CloudBackupRef = { id: string; name: string; size: number; uploadedAt: string; checksum: string };

export interface CloudBackupProvider {
  name: string;
  authenticate: () => Promise<boolean>;
  upload: (backup: BackupFile) => Promise<CloudBackupRef>;
  download: (ref: CloudBackupRef) => Promise<BackupFile>;
  list: () => Promise<CloudBackupRef[]>;
  delete: (ref: CloudBackupRef) => Promise<void>;
}

export const cloudBackupPlaceholder: CloudBackupProvider = {
  name: "Coming Soon",
  authenticate: async () => false,
  upload: async () => { throw new Error("Cloud backup coming soon"); },
  download: async () => { throw new Error("Cloud backup coming soon"); },
  list: async () => [],
  delete: async () => undefined,
};
