import { useMemo } from "react";
import { debounce } from "@/utils/debounce";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(callback: T, delay: number, deps: React.DependencyList) {
  return useMemo(() => debounce(callback, delay), [callback, delay, ...deps]);
}
