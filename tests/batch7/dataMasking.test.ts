import { describe, expect, it } from "vitest";
import { isSensitiveField, maskSensitiveData } from "@/utils/dataMasking";

describe("data masking", () => {
  it("masks sensitive fields and nested data", () => {
    const masked = maskSensitiveData({ email: "john@example.com", phone: "0501234567", amount: 1200, nested: { password: "abc" } }) as Record<string, unknown>;
    expect(String(masked.email)).toContain("***@");
    expect(String(masked.phone)).toContain("***-***-");
    expect(masked.amount).toBe("1,000-5,000");
    expect((masked.nested as Record<string, unknown>).password).toBe("********");
    expect(isSensitiveField("token")).toBe(true);
  });
});
