import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";

describe("useIdempotentAction", () => {
  it("produces idempotency key and marks done", () => {
    const { result } = renderHook(() => useIdempotentAction("create-sale", "sale"));

    act(() => {
      result.current.run("sale-xyz", { amount: 200 });
    });

    const res = result.current.last;
    expect(res?.idempotencyKey).toContain("create-sale");
    expect(res?.status).toBe("done");
  });
});
