import { describe, expect, it } from "vitest";
import { resolveStorage } from "@/utils/browserStorage";

describe("resolveStorage", () => {
  it("returns injected storage when provided", () => {
    const fake = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 } as Storage;
    expect(resolveStorage(fake)).toBe(fake);
  });
});
