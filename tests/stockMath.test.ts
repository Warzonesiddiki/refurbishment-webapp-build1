import { describe, it, expect } from "vitest";

function computeAvailable(onHand: number, reserved: number) {
  if (onHand < 0 || reserved < 0 || reserved > onHand) throw new Error("Stock invariant violated");
  return onHand - reserved;
}

describe("Stock math invariants", () => {
  it("computes available stock", () => {
    expect(computeAvailable(10, 3)).toBe(7);
  });

  it("throws when reserved exceeds onHand", () => {
    expect(() => computeAvailable(5, 6)).toThrow();
  });
});
