import { useEffect, useRef } from "react";

export function useRAF(callback: (deltaTime: number) => void, active = true) {
  const frame = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const tick = (t: number) => {
      const delta = last.current == null ? 0 : t - last.current;
      last.current = t;
      callback(delta);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [callback, active]);
}
