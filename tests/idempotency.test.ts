import { describe, it, expect } from "vitest";
import { recordIdempotency } from "@/domain";

describe("Idempotency", () => {
  it("stores only once per key", () => {
    const r1 = recordIdempotency("key-1", "sale", "id-1");
    const r2 = recordIdempotency("key-1", "sale", "id-1");
    expect(r1).toBe(r2);
    expect(r1.key).toBe("key-1");
  });
});
