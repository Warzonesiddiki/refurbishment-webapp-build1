import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConfirm } from "@/hooks/useConfirm";

describe("useConfirm", () => {
  it("returns confirm + dialog", () => {
    const { result } = renderHook(() => useConfirm());
    expect(typeof result.current.confirm).toBe("function");
    expect(result.current.dialog).toBeNull();
  });
});
