import { useEffect, useMemo, useRef, useState } from "react";

export function useLaborTimer(storageKey = "") {
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

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        setStartedAt(parsed);
      }
    } catch {
      // ignore restore errors
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      if (startedAt === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, String(startedAt));
      }
    } catch {
      // ignore persistence errors
    }
  }, [startedAt, storageKey]);

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
