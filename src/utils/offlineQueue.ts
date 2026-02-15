import { resolveStorage } from "@/utils/browserStorage";

export type OfflineActionStatus = "pending" | "conflict";

export type OfflineAction = {
  id: string;
  ts: string;
  type: string;
  summary: string;
  payload?: Record<string, unknown>;
  status?: OfflineActionStatus;
  conflictKey?: string;
};

export const OFFLINE_QUEUE_KEY = "tahir_erp_offline_action_queue";

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toConflictKey(action: Pick<OfflineAction, "type" | "payload">): string {
  return `${action.type}:${JSON.stringify(action.payload ?? {})}`;
}

export function readOfflineQueue(storage?: Storage): OfflineAction[] {
  const target = resolveStorage(storage);
  if (!target) return [];
  const raw = target.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOfflineQueue(queue: OfflineAction[], storage?: Storage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(0, 100)));
}

export function enqueueOfflineAction(
  input: Omit<OfflineAction, "id" | "ts" | "status" | "conflictKey">,
  storage?: Storage
): OfflineAction[] {
  const queue = readOfflineQueue(storage);
  const conflictKey = toConflictKey(input);
  const hasConflict = queue.some((item) => item.conflictKey === conflictKey);
  const next: OfflineAction = {
    id: uid(),
    ts: nowIso(),
    ...input,
    conflictKey,
    status: hasConflict ? "conflict" : "pending",
  };
  const updated = [next, ...queue];
  writeOfflineQueue(updated, storage);
  return updated;
}

export function clearOfflineQueue(storage?: Storage): void {
  const target = resolveStorage(storage);
  target?.removeItem(OFFLINE_QUEUE_KEY);
}

export function removeOfflineAction(id: string, storage?: Storage): OfflineAction[] {
  const next = readOfflineQueue(storage).filter((item) => item.id !== id);
  writeOfflineQueue(next, storage);
  return next;
}

export function replayOfflineAction(id: string, storage?: Storage): OfflineAction | null {
  const queue = readOfflineQueue(storage);
  const target = queue.find((item) => item.id === id) ?? null;
  if (!target) return null;
  removeOfflineAction(id, storage);
  return target;
}

export function countOfflineConflicts(queue: OfflineAction[]): number {
  return queue.filter((item) => item.status === "conflict").length;
}

export function countRepeatedConflictExceptions(queue: OfflineAction[]): number {
  const counts = new Map<string, number>();
  queue.forEach((item) => {
    if (item.status !== "conflict") return;
    const key = item.conflictKey || `${item.type}:${JSON.stringify(item.payload ?? {})}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  let exceptions = 0;
  counts.forEach((value) => {
    if (value >= 2) exceptions += 1;
  });
  return exceptions;
}
