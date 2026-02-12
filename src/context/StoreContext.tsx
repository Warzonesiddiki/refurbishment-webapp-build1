// ═══════════════════════════════════════════
// Global Store Context — provides app state
// and dispatch to all components
// ═══════════════════════════════════════════
import { createContext, useContext, useReducer, useMemo } from "react";
import {
  AppState, Action, appReducer, createInitialState,
  selectKpis, selectVatSummary,
} from "@/store/appState";
import { loadPersistedState } from "@/store/persistence";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { useAutoSave } from "@/store/persistence/useAutoSave";
import { useTabSync } from "@/store/persistence/tabSync";
import { useStorageQuota } from "@/store/persistence/quota";

type StoreContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  kpis: ReturnType<typeof selectKpis>;
  vatSummary: ReturnType<typeof selectVatSummary>;
  quota: ReturnType<typeof useStorageQuota>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadPersistedState() ?? createInitialState());
  const adapter = useMemo(() => new LocalStorageAdapter(), []);

  useAutoSave(state, adapter, { debounceMs: 500 });
  useTabSync(state, dispatch);
  const quota = useStorageQuota();

  const kpis = useMemo(() => selectKpis(state), [state]);
  const vatSummary = useMemo(() => selectVatSummary(state), [state]);

  const value = useMemo(() => ({ state, dispatch, kpis, vatSummary, quota }), [state, dispatch, kpis, vatSummary, quota]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useAppState() {
  return useStore().state;
}

export function useDispatch() {
  return useStore().dispatch;
}

export function useKpis() {
  return useStore().kpis;
}
