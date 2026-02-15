import { useEffect, useMemo, useRef, useState } from "react";

export function useLaborTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [startedAt]);

  const elapsedMs = useMemo(() => (startedAt ? now - startedAt : 0), [now, startedAt]);

  return {
    running: startedAt !== null,
    startedAt,
    elapsedMs,
    start: () => setStartedAt(Date.now()),
    stop: () => {
      const end = Date.now();
      const start = startedAt;
      setStartedAt(null);
      setNow(end);
      return start ? { start, end, elapsedMs: Math.max(0, end - start) } : null;
    },
    reset: () => {
      setStartedAt(null);
      setNow(Date.now());
    },
  };
}
