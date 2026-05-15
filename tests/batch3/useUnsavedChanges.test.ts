import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

describe("useUnsavedChanges", () => {
  it("registers beforeunload when dirty", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(true));
    expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    add.mockRestore();
  });
});
