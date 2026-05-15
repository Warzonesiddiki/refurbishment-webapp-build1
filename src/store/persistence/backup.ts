import type { AppState } from "@/store/appState";
import { getCurrentVersion } from "@/store/persistence/migrations";
import { calculateChecksum } from "@/utils/checksum";

export type BackupFile = {
  version: number;
  exportedAt: string;
  appVersion: string;
  checksum: string;
  data: AppState;
};

export async function createBackup(state: AppState): Promise<BackupFile> {
  const checksum = await calculateChecksum(state);
  return {
    version: getCurrentVersion(),
    exportedAt: new Date().toISOString(),
    appVersion: "2.0.0",
    checksum,
    data: state,
  };
}

export function generateFilename() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `tahir-erp-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = generateFilename();
  anchor.click();
  URL.revokeObjectURL(url);
}
