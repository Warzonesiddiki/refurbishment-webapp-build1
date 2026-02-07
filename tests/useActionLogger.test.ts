import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionLogger, buildIdempotencyKey } from "@/hooks/useActionLogger";

// Deterministic key parts for test (just check structure)
describe("buildIdempotencyKey", () => {
  it("builds key with action and entity id", () => {
    const key = buildIdempotencyKey("create-sale", "sale-123");
    expect(key).toContain("create-sale");
    expect(key).toContain("sale-123");
  });
});

describe("useActionLogger", () => {
  it("logs movement and audit with idempotency key", () => {
    const { result } = renderHook(() => useActionLogger("tester", "demo-co"));

    act(() => {
      result.current.logAction({
        action: "create",
        entityType: "sale",
        entityId: "sale-1",
        from: "draft",
        to: "final",
        payload: { amount: 100 },
      });
    });

    const r = result.current.lastResult!;
    expect(r.idempotencyKey).toBeDefined();
    expect(r.movementId).toBeDefined();
    expect(r.auditId).toBeDefined();
    expect(r.status).toBe("logged");
  });
});
