import { describe, it, expect } from "vitest";
import { assertStockInvariant, makeSequenceGenerator, validateSequence } from "@/domain";

// Integration-style: create inventory records, validate sequences and stock invariants.
describe("Inventory flow integration", () => {
  it("validates generated laptop and part sequences", () => {
    const laptopSeq = makeSequenceGenerator("laptop");
    const partSeq = makeSequenceGenerator("part");
    const laptopBarcode = laptopSeq(new Date("2024-02-01"));
    const partBarcode = partSeq(new Date("2024-02-01"));

    expect(() => validateSequence("laptop", laptopBarcode)).not.toThrow();
    expect(() => validateSequence("part", partBarcode)).not.toThrow();
  });

  it("enforces stock invariants on parts", () => {
    const available = assertStockInvariant({ quantityOnHand: 12, quantityReserved: 3 });
    expect(available).toBe(9);
  });
});
