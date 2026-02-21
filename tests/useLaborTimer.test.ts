import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useLaborTimer } from "@/hooks/useLaborTimer";

describe("useLaborTimer persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores startedAt from localStorage and persists changes", () => {
    const now = Date.now();
    window.localStorage.setItem("timer-key", String(now - 10_000));

    const { result } = renderHook(() => useLaborTimer("timer-key"));

    expect(result.current.running).toBe(true);
    expect(result.current.startedAt).toBe(now - 10_000);

    act(() => {
      result.current.reset();
    });

    expect(window.localStorage.getItem("timer-key")).toBeNull();
  });

  it("writes start timestamp to localStorage", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-20T10:00:00.000Z"));

    const { result } = renderHook(() => useLaborTimer("timer-key"));

    act(() => {
      result.current.start();
    });

    expect(window.localStorage.getItem("timer-key")).toBe(String(Date.now()));
    vi.useRealTimers();
  });
});
