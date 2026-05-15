import { resolveStorage } from "@/utils/browserStorage";
import type { OfflineAction } from "@/utils/offlineQueue";

export const OFFLINE_ESCALATION_ACK_KEY = "tahir_erp_offline_conflict_escalation_ack";
const ACK_TTL_MS = 4 * 60 * 60 * 1000;

export function getEscalationAckAt(storage?: Storage): number | null {
  const target = resolveStorage(storage);
  if (!target) return null;
  const raw = target.getItem(OFFLINE_ESCALATION_ACK_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function acknowledgeEscalation(now = Date.now(), storage?: Storage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(OFFLINE_ESCALATION_ACK_KEY, String(now));
}

export function clearEscalationAck(storage?: Storage): void {
  const target = resolveStorage(storage);
  target?.removeItem(OFFLINE_ESCALATION_ACK_KEY);
}

export function shouldShowEscalation(queue: OfflineAction[], now = Date.now(), storage?: Storage): boolean {
  const conflictCount = queue.filter((item) => item.status === "conflict").length;
  if (conflictCount < 5) return false;
  const ackAt = getEscalationAckAt(storage);
  if (!ackAt) return true;
  return now - ackAt > ACK_TTL_MS;
}
