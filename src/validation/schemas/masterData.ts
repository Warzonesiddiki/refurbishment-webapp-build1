import { validators } from "@/validation/validators";
import type { ValidationResult } from "@/validation/schemas/records";

type Schema<T> = { safeParse: (input: unknown) => ValidationResult<T> };

function schema<T>(fn: (v: Record<string, unknown>) => Record<string, string>): Schema<T> {
  return {
    safeParse(input) {
      const value = (input ?? {}) as Record<string, unknown>;
      const errors = fn(value);
      return Object.keys(errors).length ? { success: false, errors } : { success: true, data: value as T };
    },
  };
}

export const supplierSchema = schema((v) => {
  const errors: Record<string, string> = {};
  if (!String(v.code ?? "").trim()) errors.code = "Code required";
  if (!String(v.name ?? "").trim()) errors.name = "Name required";
  const email = validators.email(v.email);
  if (!email.ok) errors.email = email.error;
  return errors;
});

export const lotSchema = schema((v) => {
  const errors: Record<string, string> = {};
  if (!String(v.lotNumber ?? "").trim()) errors.lotNumber = "Lot number required";
  if (!validators.uuid(v.supplierId).ok) errors.supplierId = "Invalid supplier ID";
  if (!Number.isInteger(Number(v.totalUnits)) || Number(v.totalUnits) < 1) errors.totalUnits = "Total units invalid";
  return errors;
});
