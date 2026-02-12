import { describe, expect, it } from "vitest";
import { checkPermission } from "@/store/security/permissions";

describe("permission system", () => {
  it("placeholder allows checks", () => {
    const result = checkPermission(null, "inventory", "read");
    expect(result.allowed).toBe(true);
  });
});
