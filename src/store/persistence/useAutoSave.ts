import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState } from "@/store/appState";
import { IStorageAdapter, APP_STATE_KEY, STORAGE_PREFIX } from "@/store/persistence/IStorageAdapter";
import { getCurrentVersion, PersistedState } from "@/store/persistence/migrations";
import { StorageError } from "@/store/persistence/errors";
import { deepEqual } from "@/utils/deepEqual";
import { debounce } from "@/utils/debounce";

export type AutoSaveOptions = {
  debounceMs?: number;
  excludeKeys?: string[];
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: StorageError) => void;
};


const DAILY_SNAPSHOT_INDEX_KEY = `${STORAGE_PREFIX}daily-snapshot-index`;
const DAILY_SNAPSHOT_KEY_PREFIX = `${STORAGE_PREFIX}daily-snapshot:`;
const MAX_DAILY_SNAPSHOTS = 35;

function buildDailySnapshotKey(date = new Date()) {
  return `${DAILY_SNAPSHOT_KEY_PREFIX}${date.toISOString().slice(0, 10)}`;
}

async function persistDailySnapshot(adapter: IStorageAdapter, payload: PersistedState) {
  const snapshotKey = buildDailySnapshotKey(new Date(payload.timestamp));
  await adapter.set(snapshotKey, payload);

  const index = (await adapter.get<string[]>(DAILY_SNAPSHOT_INDEX_KEY)) ?? [];
  const deduped = [snapshotKey, ...index.filter((key) => key !== snapshotKey)].slice(0, MAX_DAILY_SNAPSHOTS);

  const stale = index.filter((key) => !deduped.includes(key));
  await Promise.all(stale.map((key) => adapter.remove(key)));
  await adapter.set(DAILY_SNAPSHOT_INDEX_KEY, deduped);
}
function omitKeys(state: AppState, excludeKeys: string[]) {
  const clone = { ...state } as Record<string, unknown>;
  excludeKeys.forEach((key) => delete clone[key]);
  return clone;
}

export function useAutoSave(state: AppState, adapter: IStorageAdapter, options?: AutoSaveOptions) {
  const debounceMs = options?.debounceMs ?? 500;
  const excludeKeys = options?.excludeKeys ?? ["ui", "transient"];
  const previousRef = useRef<unknown>(null);
  const [saveCounter, setSaveCounter] = useState(0);

  const normalized = useMemo(() => omitKeys(state, excludeKeys), [state, excludeKeys]);

  useEffect(() => {
    const saveNow = debounce(async () => {
      if (deepEqual(previousRef.current, normalized)) return;
      options?.onSaveStart?.();
      try {
        const payload: PersistedState = {
          version: getCurrentVersion(),
          timestamp: Date.now(),
          data: normalized as AppState,
        };
        await adapter.set(APP_STATE_KEY, payload);
        await persistDailySnapshot(adapter, payload);
        previousRef.current = normalized;
        setSaveCounter((c) => c + 1);
        options?.onSaveComplete?.();
      } catch (error) {
        const wrapped = error instanceof StorageError ? error : new StorageError("UNKNOWN", "Auto-save failed", error);
        options?.onSaveError?.(wrapped);
      }
    }, debounceMs);

    saveNow();
  }, [adapter, debounceMs, normalized, options]);

  return { saveCounter };
}
