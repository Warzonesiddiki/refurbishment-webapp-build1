export type Validator<T> = (value: unknown) => { ok: true; value: T } | { ok: false; error: string };

export const validators = {
  barcode: ((value: unknown) => {
    const s = String(value ?? "").trim();
    if (!s) return { ok: false as const, error: "Barcode required" };
    if (!/^[A-Z0-9-]+$/i.test(s)) return { ok: false as const, error: "Invalid barcode format" };
    return { ok: true as const, value: s };
  }) satisfies Validator<string>,
  currency: ((value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return { ok: false as const, error: "Must be positive" };
    return { ok: true as const, value: Math.round(n * 100) / 100 };
  }) satisfies Validator<number>,
  email: ((value: unknown) => {
    const s = String(value ?? "").trim();
    if (!s) return { ok: true as const, value: "" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { ok: false as const, error: "Invalid email" };
    return { ok: true as const, value: s };
  }) satisfies Validator<string>,
  phone: ((value: unknown) => {
    const s = String(value ?? "").trim();
    if (!s) return { ok: true as const, value: "" };
    if (!/^[+]?[0-9\s-()]{7,20}$/.test(s)) return { ok: false as const, error: "Invalid phone" };
    return { ok: true as const, value: s };
  }) satisfies Validator<string>,
  percentage: ((value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false as const, error: "Must be 0-100" };
    return { ok: true as const, value: n };
  }) satisfies Validator<number>,
  positiveInt: ((value: unknown) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return { ok: false as const, error: "Must be positive integer" };
    return { ok: true as const, value: n };
  }) satisfies Validator<number>,
  nonNegativeInt: ((value: unknown) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return { ok: false as const, error: "Must be non-negative integer" };
    return { ok: true as const, value: n };
  }) satisfies Validator<number>,
  uuid: ((value: unknown) => {
    const s = String(value ?? "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
      return { ok: false as const, error: "Invalid ID format" };
    }
    return { ok: true as const, value: s };
  }) satisfies Validator<string>,
  requiredString: (field: string, max = 200): Validator<string> => (value) => {
    const s = String(value ?? "").trim();
    if (!s) return { ok: false, error: `${field} is required` };
    if (s.length > max) return { ok: false, error: `${field} is too long` };
    return { ok: true, value: s };
  },
};
