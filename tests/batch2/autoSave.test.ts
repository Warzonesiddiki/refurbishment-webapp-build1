import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/store/persistence/useAutoSave";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { createInitialState } from "@/store/appState";
import { APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";

vi.useFakeTimers();

describe("useAutoSave", () => {
  it("debounces saves", async () => {
    const adapter = new LocalStorageAdapter();
    const state = createInitialState();
    renderHook(() => useAutoSave(state, adapter, { debounceMs: 500 }));

    await act(async () => {
      vi.advanceTimersByTime(550);
    });

    const saved = await adapter.get(APP_STATE_KEY);
    expect(saved).not.toBeNull();
  });
});
