import { describe, it, expect } from "vitest";
import { assertStockInvariant } from "@/domain";

describe("Stock invariants (parts)", () => {
  it("computes available when valid", () => {
    const available = assertStockInvariant({ quantityOnHand: 10, quantityReserved: 3 });
    expect(available).toBe(7);
  });

  it("throws when reserved exceeds on hand", () => {
    expect(() => assertStockInvariant({ quantityOnHand: 5, quantityReserved: 6 })).toThrow();
  });
});
