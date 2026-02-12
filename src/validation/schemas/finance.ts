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

export const cashEntrySchema = schema((v) => {
  const errors: Record<string, string> = {};
  const type = String(v.type ?? "");
  const amount = Number(v.amount ?? NaN);
  if (["OPENING", "CLOSING"].includes(type) && amount !== 0) errors.amount = "Opening/Closing amount must be 0";
  if (!String(v.description ?? "").trim()) errors.description = "Description is required";
  return errors;
});

export const ownerEntrySchema = schema((v) => {
  const errors: Record<string, string> = {};
  if (!(Number(v.amount) > 0)) errors.amount = "Amount must be positive";
  if (!String(v.description ?? "").trim()) errors.description = "Description is required";
  return errors;
});

export const receiptSchema = schema((v) => {
  const errors: Record<string, string> = {};
  if (!validators.uuid(v.saleId).ok) errors.saleId = "Invalid sale ID";
  if (!(Number(v.amount) > 0)) errors.amount = "Amount must be positive";
  return errors;
});

export const paymentSchema = schema((v) => {
  const errors: Record<string, string> = {};
  if (!validators.uuid(v.purchaseId).ok) errors.purchaseId = "Invalid purchase ID";
  if (!(Number(v.amount) > 0)) errors.amount = "Amount must be positive";
  return errors;
});
