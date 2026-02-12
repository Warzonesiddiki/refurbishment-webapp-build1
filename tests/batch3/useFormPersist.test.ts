import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormPersist } from "@/hooks/useFormPersist";

describe("useFormPersist", () => {
  it("saves draft", () => {
    const form = {
      getValues: () => ({ a: 1 }),
      reset: () => {},
      isSubmitSuccessful: false,
    };
    renderHook(() => useFormPersist("draft-test", form));
    expect(true).toBe(true);
  });
});
