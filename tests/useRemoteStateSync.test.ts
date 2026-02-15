import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/store/appState";
import { useRemoteStateSync } from "@/store/persistence/useRemoteStateSync";
import * as sharedStateClient from "@/utils/sharedStateClient";

describe("useRemoteStateSync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not republish equivalent state snapshots", async () => {
    vi.useFakeTimers();
    vi.spyOn(sharedStateClient, "fetchSharedState").mockResolvedValue(null);
    const pushSpy = vi.spyOn(sharedStateClient, "pushSharedState").mockResolvedValue();
    const dispatch = vi.fn();

    const base = createInitialState();
    const { rerender } = renderHook(({ state }) => useRemoteStateSync(state, dispatch, 60_000), {
      initialProps: { state: base },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    rerender({ state: JSON.parse(JSON.stringify(base)) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(pushSpy).toHaveBeenCalledTimes(1);
  });


  it("hydrates from newer remote snapshot before publishing", async () => {
    vi.useFakeTimers();
    const remoteState = createInitialState();
    remoteState.activity = [{ action: "remote", time: "now" }];

    vi.spyOn(sharedStateClient, "fetchSharedState").mockResolvedValue({ timestamp: 999, state: remoteState });
    const pushSpy = vi.spyOn(sharedStateClient, "pushSharedState").mockResolvedValue();
    const dispatch = vi.fn();

    renderHook(() => useRemoteStateSync(createInitialState(), dispatch, 60_000));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(dispatch).toHaveBeenCalledWith({ type: "RESTORE_STATE", payload: remoteState });
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("skips remote publish while offline", async () => {
    vi.useFakeTimers();
    vi.spyOn(sharedStateClient, "fetchSharedState").mockResolvedValue(null);
    const pushSpy = vi.spyOn(sharedStateClient, "pushSharedState").mockResolvedValue();
    const dispatch = vi.fn();

    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    renderHook(() => useRemoteStateSync(createInitialState(), dispatch, 60_000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(pushSpy).not.toHaveBeenCalled();
  });
});
