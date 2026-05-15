// ═══════════════════════════════════════════
// Global Store Context — provides app state
// and dispatch to all components
// ═══════════════════════════════════════════
import { createContext, useContext, useReducer, useMemo, useEffect } from "react";
import {
  AppState, Action, appReducer, createInitialState,
  selectKpis, selectVatSummary,
} from "@/store/appState";
import { loadPersistedState, persistState } from "@/store/persistence";

type StoreContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  kpis: ReturnType<typeof selectKpis>;
  vatSummary: ReturnType<typeof selectVatSummary>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadPersistedState() ?? createInitialState());

  useEffect(() => {
    persistState(state);
  }, [state]);

  const kpis = useMemo(() => selectKpis(state), [state]);
  const vatSummary = useMemo(() => selectVatSummary(state), [state]);

  const value = useMemo(() => ({ state, dispatch, kpis, vatSummary }), [state, dispatch, kpis, vatSummary]);

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
