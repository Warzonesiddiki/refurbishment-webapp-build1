import { describe, it, expect } from "vitest";
import { computeVat, validateSequence, makeSequenceGenerator } from "@/domain";

describe("Sales flow integration", () => {
  it("computes VAT and total for sale", () => {
    const { vat, total } = computeVat(2500, 0.05);
    expect(vat).toBe(125);
    expect(total).toBe(2625);
  });

  it("generates invoice sequence", () => {
    const gen = makeSequenceGenerator("invoice");
    const invoice = gen(new Date("2024-02-01"));
    expect(() => validateSequence("invoice", invoice)).not.toThrow();
  });
});
