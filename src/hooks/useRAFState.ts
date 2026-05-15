import { useState } from "react";
import { rafScheduler } from "@/utils/rafScheduler";

export function useRAFState<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const setRafValue = (next: T) => rafScheduler.schedule("useRAFState", () => setValue(next));
  return [value, setRafValue] as const;
}
