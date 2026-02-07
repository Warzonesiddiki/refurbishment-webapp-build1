import { describe, it, expect } from "vitest";
import { computeVat, validateSequence, makeSequenceGenerator } from "@/domain";

describe("Purchase flow integration", () => {
  it("computes VAT for purchase", () => {
    const { vat, total } = computeVat(10000, 0.05);
    expect(vat).toBe(500);
    expect(total).toBe(10500);
  });

  it("generates purchase sequence", () => {
    const gen = makeSequenceGenerator("purchase");
    const purchase = gen(new Date("2024-02-01"));
    expect(() => validateSequence("purchase", purchase)).not.toThrow();
  });
});
