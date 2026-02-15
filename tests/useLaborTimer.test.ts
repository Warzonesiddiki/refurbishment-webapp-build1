import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLaborTimer } from "@/hooks/useLaborTimer";

describe("useLaborTimer", () => {
  it("starts and stops timer session", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLaborTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    let session: ReturnType<typeof result.current.stop> = null;
    act(() => {
      session = result.current.stop();
    });
    expect(result.current.running).toBe(false);
    expect(session).toBeTruthy();

    vi.useRealTimers();
  });
});
