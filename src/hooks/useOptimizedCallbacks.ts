import { useCallback, useMemo } from "react";

export function useStableObject<T extends Record<string, unknown>>(obj: T) {
  return useMemo(() => obj, Object.values(obj));
}

export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T, deps: React.DependencyList) {
  return useCallback(fn, deps);
}
