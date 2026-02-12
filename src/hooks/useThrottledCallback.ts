import { useMemo } from "react";
import { throttle } from "@/utils/throttle";

export function useThrottledCallback<T extends (...args: never[]) => unknown>(callback: T, delay: number, deps: React.DependencyList) {
  return useMemo(() => throttle(callback, delay), [callback, delay, ...deps]);
}
