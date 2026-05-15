import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "@/hooks/useForm";
import { partSchema } from "@/validation";

describe("useForm", () => {
  it("tracks dirty and submits valid data", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm({ schema: partSchema, defaultValues: { sku: "", name: "", quantity: 0, minStock: 0, unitCost: 0 }, onSubmit }));
    act(() => {
      result.current.setValue("sku", "S1");
      result.current.setValue("name", "RAM");
    });
    expect(result.current.isDirty).toBe(true);
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onSubmit).toHaveBeenCalled();
  });
});
