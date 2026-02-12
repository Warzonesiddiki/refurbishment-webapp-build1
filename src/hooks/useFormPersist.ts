import { useEffect, useMemo } from "react";

type PersistOptions = { storage?: "session" | "local"; debounceMs?: number; exclude?: string[]; ttl?: number };

export function useFormPersist<T extends { getValues: () => Record<string, unknown>; reset: (v: Record<string, unknown>) => void; isSubmitSuccessful: boolean }>(
  key: string,
  form: T,
  options?: PersistOptions
) {
  const storage = options?.storage === "local" ? window.localStorage : window.sessionStorage;
  const ttl = options?.ttl ?? 1000 * 60 * 60;
  const exclude = useMemo(() => new Set(options?.exclude ?? []), [options?.exclude]);

  useEffect(() => {
    const raw = storage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { savedAt: number; values: Record<string, unknown> };
      if (Date.now() - parsed.savedAt <= ttl) form.reset(parsed.values);
      else storage.removeItem(key);
    } catch {
      storage.removeItem(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (form.isSubmitSuccessful) {
      storage.removeItem(key);
      return;
    }
    const timer = window.setTimeout(() => {
      const values = { ...form.getValues() };
      Object.keys(values).forEach((k) => { if (exclude.has(k)) delete values[k]; });
      storage.setItem(key, JSON.stringify({ savedAt: Date.now(), values }));
    }, options?.debounceMs ?? 500);

    return () => window.clearTimeout(timer);
  }, [exclude, form, key, options?.debounceMs, storage]);
}
