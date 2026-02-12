import { describe, expect, it } from "vitest";
import { cashEntrySchema, laptopSchema, saleSchema } from "@/validation";

describe("schemas", () => {
  it("laptopSchema validates correct data", () => {
    const ok = laptopSchema.safeParse({ id: crypto.randomUUID(), barcode: "ABC-123", make: "Dell", model: "5420", costPrice: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    expect(ok.success).toBe(true);
  });

  it("laptopSchema rejects invalid barcode", () => {
    const bad = laptopSchema.safeParse({ barcode: "@@@", make: "Dell", model: "5420", costPrice: 100 });
    expect(bad.success).toBe(false);
  });

  it("saleSchema requires at least one item", () => {
    const bad = saleSchema.safeParse({ invoiceNumber: "I", customerName: "A", items: [] });
    expect(bad.success).toBe(false);
  });

  it("cashEntrySchema enforces zero opening amount", () => {
    const bad = cashEntrySchema.safeParse({ type: "OPENING", amount: 1, description: "x" });
    expect(bad.success).toBe(false);
  });
});
