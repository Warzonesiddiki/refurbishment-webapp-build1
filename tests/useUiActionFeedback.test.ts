import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

// use fake timers for timeout
vi.useFakeTimers();

describe("useUiActionFeedback", () => {
  it("opens and auto-closes feedback", () => {
    const { result } = renderHook(() => useUiActionFeedback());
    act(() => {
      result.current.trigger("success", "Saved");
    });
    expect(result.current.feedback?.open).toBe(true);
    expect(result.current.feedback?.message).toBe("Saved");

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(result.current.feedback).toBeNull();
  });
});
