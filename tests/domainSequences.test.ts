import { describe, it, expect } from "vitest";
import { makeSequenceGenerator, validateSequence } from "@/domain";

describe("Sequences", () => {
  it("generates and validates laptop sequence", () => {
    const gen = makeSequenceGenerator("laptop");
    const s1 = gen(new Date("2024-01-15"));
    const s2 = gen(new Date("2024-01-15"));
    expect(s1).not.toBe(s2);
    expect(() => validateSequence("laptop", s1)).not.toThrow();
  });

  it("rejects invalid pattern", () => {
    expect(() => validateSequence("invoice", "BAD-123")).toThrow();
  });
});
