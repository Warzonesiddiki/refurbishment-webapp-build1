import { describe, it, expect } from "vitest";

function computeVat(amountExVat: number, rate = 0.05) {
  const vat = +(amountExVat * rate).toFixed(2);
  const total = +(amountExVat + vat).toFixed(2);
  return { vat, total };
}

describe("VAT math", () => {
  it("computes VAT and total", () => {
    const { vat, total } = computeVat(1000, 0.05);
    expect(vat).toBe(50);
    expect(total).toBe(1050);
  });

  it("handles zero", () => {
    const { vat, total } = computeVat(0, 0.05);
    expect(vat).toBe(0);
    expect(total).toBe(0);
  });
});
