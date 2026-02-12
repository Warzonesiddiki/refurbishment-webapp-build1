import { describe, expect, it } from "vitest";
import { validators } from "@/validation";

describe("validators", () => {
  it("barcode accepts valid", () => expect(validators.barcode("ABC-123").ok).toBe(true));
  it("barcode rejects invalid", () => expect(validators.barcode("@@").ok).toBe(false));
  it("currency rounds", () => expect(validators.currency(1.239).value).toBe(1.24));
  it("percentage rejects >100", () => expect(validators.percentage(101).ok).toBe(false));
});
