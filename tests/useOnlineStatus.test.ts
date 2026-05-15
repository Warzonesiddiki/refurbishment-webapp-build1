import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  it("has deterministic initial state type", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect([true, false]).toContain(result.current);
  });

  it("returns a boolean online indicator", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe("boolean");
  });
});
