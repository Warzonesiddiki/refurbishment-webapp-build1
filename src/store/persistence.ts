import type { AppState } from "@/store/appState";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";
import { getCurrentVersion, PersistedState } from "@/store/persistence/migrations";
import { hydrateState } from "@/store/persistence/hydrate";

const adapter = new LocalStorageAdapter();

export const STORAGE_KEY = APP_STATE_KEY;

export function loadPersistedState(): AppState | null {
  // Keep legacy sync API for existing callers/tests.
  let value: AppState | null = null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedState | AppState;
    if ((parsed as PersistedState).data) {
      const ps = parsed as PersistedState;
      if (ps.version === getCurrentVersion()) return ps.data;
      // fallback to async migrator path if needed (best effort)
      void hydrateState(adapter).then((result) => {
        value = result.state;
      });
      return ps.data;
    }
    return parsed as AppState;
  } catch {
    return value;
  }
}

export function persistState(state: AppState) {
  const payload: PersistedState = {
    version: getCurrentVersion(),
    timestamp: Date.now(),
    data: state,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedState() {
  void adapter.clear();
}
