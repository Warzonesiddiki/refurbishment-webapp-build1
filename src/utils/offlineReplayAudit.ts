import { resolveStorage } from "@/utils/browserStorage";
import type { OfflineAction } from "@/utils/offlineQueue";

export type OfflineReplayAuditRecord = {
  id: string;
  ts: string;
  type: string;
  summary: string;
  outcome: "replayed" | "dismissed";
};

export const OFFLINE_REPLAY_AUDIT_KEY = "tahir_erp_offline_replay_audit";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function readOfflineReplayAudit(storage?: Storage): OfflineReplayAuditRecord[] {
  const target = resolveStorage(storage);
  if (!target) return [];
  const raw = target.getItem(OFFLINE_REPLAY_AUDIT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineReplayAuditRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOfflineReplayAudit(records: OfflineReplayAuditRecord[], storage?: Storage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(OFFLINE_REPLAY_AUDIT_KEY, JSON.stringify(records.slice(0, 200)));
}

export function appendOfflineReplayAudit(
  action: Pick<OfflineAction, "type" | "summary">,
  outcome: OfflineReplayAuditRecord["outcome"],
  storage?: Storage
): OfflineReplayAuditRecord[] {
  const records = readOfflineReplayAudit(storage);
  const next: OfflineReplayAuditRecord = {
    id: uid(),
    ts: new Date().toISOString(),
    type: action.type,
    summary: action.summary,
    outcome,
  };
  const updated = [next, ...records];
  writeOfflineReplayAudit(updated, storage);
  return updated;
}

export function clearOfflineReplayAudit(storage?: Storage): void {
  const target = resolveStorage(storage);
  target?.removeItem(OFFLINE_REPLAY_AUDIT_KEY);
}

export function replayAuditToCsv(records: OfflineReplayAuditRecord[]): string {
  const head = "timestamp,type,summary,outcome";
  const rows = records.map((r) => `${r.ts},${r.type},"${r.summary.replace(/"/g, '""')}",${r.outcome}`);
  return [head, ...rows].join("\n");
}
