import { describe, it, expect } from "vitest";
import { makeSequenceGenerator, validateSequence } from "@/domain";

describe("Receiving flow integration", () => {
  it("generates lot sequence and validates format", () => {
    const lotSeq = makeSequenceGenerator("lot");
    const lot = lotSeq(new Date("2024-02-01"));
    expect(() => validateSequence("lot", lot)).not.toThrow();
  });
});
