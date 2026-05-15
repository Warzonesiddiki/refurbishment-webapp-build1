import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

describe("useOfflineQueue", () => {
  it("enqueues, replays, removes, and clears offline actions", () => {
    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      result.current.clear();
      result.current.enqueue({ type: "WIP_REPLACE_PART", summary: "Queued replacement" });
    });

    expect(result.current.queue.length).toBe(1);

    let replayed: ReturnType<typeof result.current.replay> = null;
    act(() => {
      replayed = result.current.replay(result.current.queue[0].id);
    });
    expect(replayed?.type).toBe("WIP_REPLACE_PART");
    expect(result.current.queue.length).toBe(0);

    act(() => {
      result.current.enqueue({ type: "WIP_ADD_PART", summary: "Queued part" });
    });

    act(() => {
      result.current.remove(result.current.queue[0].id);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.queue.length).toBe(0);
  });
});
