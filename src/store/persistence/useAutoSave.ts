import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState } from "@/store/appState";
import { IStorageAdapter, APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";
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
