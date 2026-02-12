import { describe, expect, it } from "vitest";
import { calculateLineVAT, calculateVAT, reverseCalculateFromGross } from "@/utils/vatCalculator";

describe("VAT calculation", () => {
  it("exclusive", () => {
    expect(calculateVAT(100, 15, "EXCLUSIVE")).toEqual({ net: 100, vat: 15, gross: 115 });
  });
  it("inclusive", () => {
    const r = calculateVAT(115, 15, "INCLUSIVE");
    expect(r.net).toBe(100);
    expect(r.vat).toBe(15);
  });
  it("line vat discount first", () => {
    const r = calculateLineVAT(2, 100, 10, 15, "EXCLUSIVE");
    expect(r.netAmount).toBe(180);
    expect(r.vatAmount).toBe(27);
  });
  it("reverse from gross", () => {
    expect(reverseCalculateFromGross(230, 15)).toEqual({ net: 200, vat: 30 });
  });
});
