import { validators } from "@/validation/validators";

export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: Record<string, string> };

type AnyRecord = Record<string, unknown>;

type Schema<T> = {
  safeParse: (input: unknown) => ValidationResult<T>;
  partial: () => Schema<Partial<T>>;
  omit: <K extends keyof T>(keys: Record<K, true>) => Schema<Omit<T, K>>;
};

function buildSchema<T extends AnyRecord>(validate: (input: AnyRecord, partial?: boolean) => Record<string, string>): Schema<T> {
  return {
    safeParse(input: unknown) {
      const obj = (input ?? {}) as AnyRecord;
      const errors = validate(obj);
      return Object.keys(errors).length ? { success: false as const, errors } : { success: true as const, data: obj as T };
    },
    partial() {
      return buildSchema<Partial<T>>((input) => validate(input, true));
    },
    omit(keys) {
      const omitSet = new Set(Object.keys(keys));
      return buildSchema<Omit<T, keyof typeof keys>>((input, partial) => {
        const copy = { ...input };
        omitSet.forEach((k) => delete copy[k]);
        return validate(copy, partial);
      });
    },
  };
}

export type LaptopRecordInput = {
  id: string; barcode: string; make: string; model: string; serial?: string; grade: "A" | "B" | "C" | "D" | "F" | "UNGRADED";
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "IN_WIP" | "SCRAPPED"; costPrice: number; salePrice?: number;
  lotId?: string; supplierId?: string; notes?: string; createdAt: string; updatedAt: string;
};

export const laptopSchema = buildSchema<LaptopRecordInput>((i, partial) => {
  const e: Record<string, string> = {};
  const required = (k: string) => !partial && (i[k] === undefined || i[k] === "");
  if (required("id") && !validators.uuid(i.id).ok) e.id = "Invalid ID format";
  if ((i.barcode !== undefined || !partial) && !validators.barcode(i.barcode).ok) e.barcode = "Invalid barcode format";
  if ((i.make !== undefined || !partial) && !validators.requiredString("Make", 100)(i.make).ok) e.make = "Make is required";
  if ((i.model !== undefined || !partial) && !validators.requiredString("Model", 100)(i.model).ok) e.model = "Model is required";
  if ((i.costPrice !== undefined || !partial) && !validators.currency(i.costPrice).ok) e.costPrice = "Must be positive";
  return e;
});

export type PartInput = { id: string; sku: string; name: string; category?: string; quantity: number; minStock: number; maxStock?: number; unitCost: number; location?: string };
export const partSchema = buildSchema<PartInput>((i, partial) => {
  const e: Record<string, string> = {};
  if ((i.sku !== undefined || !partial) && !validators.requiredString("SKU", 50)(i.sku).ok) e.sku = "SKU is required";
  if ((i.name !== undefined || !partial) && !validators.requiredString("Name", 200)(i.name).ok) e.name = "Name is required";
  if ((i.quantity !== undefined || !partial) && !validators.nonNegativeInt(i.quantity).ok) e.quantity = "Quantity invalid";
  if ((i.unitCost !== undefined || !partial) && !validators.currency(i.unitCost).ok) e.unitCost = "Unit cost invalid";
  return e;
});

export type SaleInput = { id: string; invoiceNumber: string; customerName: string; items: unknown[]; subtotal: number; vatAmount: number; total: number; status: string };
export const saleSchema = buildSchema<SaleInput>((i) => {
  const e: Record<string, string> = {};
  if (!String(i.invoiceNumber ?? "").trim()) e.invoiceNumber = "Invoice required";
  if (!String(i.customerName ?? "").trim()) e.customerName = "Customer required";
  if (!Array.isArray(i.items) || i.items.length === 0) e.items = "At least one item required";
  return e;
});

export type PurchaseInput = { id: string; poNumber: string; supplierId: string; items: unknown[]; subtotal: number; vatAmount: number; total: number; status: string };
export const purchaseSchema = buildSchema<PurchaseInput>((i) => {
  const e: Record<string, string> = {};
  if (!String(i.poNumber ?? "").trim()) e.poNumber = "PO required";
  if (!validators.uuid(i.supplierId).ok) e.supplierId = "Invalid supplier ID";
  if (!Array.isArray(i.items) || i.items.length === 0) e.items = "At least one item required";
  return e;
});

export type WipInput = { id: string; wipNumber: string; laptopId: string; track: "A" | "B" | "C" | "D" | "E"; currentStage: string; status: "ACTIVE" | "COMPLETED" | "CANCELLED"; laborCost: number; partsCost: number; notes?: string };
export const wipSchema = buildSchema<WipInput>((i) => {
  const e: Record<string, string> = {};
  if (!String(i.wipNumber ?? "").trim()) e.wipNumber = "WIP number required";
  if (!validators.uuid(i.laptopId).ok) e.laptopId = "Invalid laptop ID";
  return e;
});

export const createLaptopSchema = laptopSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateLaptopSchema = laptopSchema.partial();
