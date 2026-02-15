import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOfflineEscalation } from "@/hooks/useOfflineEscalation";

describe("useOfflineEscalation", () => {
  it("shows escalation for critical conflict volume", () => {
    const queue = [1, 2, 3, 4, 5].map((n) => ({ id: String(n), ts: "x", type: "A", summary: "s", status: "conflict" as const }));
    const { result } = renderHook(() => useOfflineEscalation(queue));
    expect(result.current.showEscalation).toBe(true);
  });
});
