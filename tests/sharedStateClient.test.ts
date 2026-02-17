import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/store/appState";
import { fetchSharedState, pushSharedState, SharedStatePushError } from "@/utils/sharedStateClient";

describe("sharedStateClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("adds auth header when token exists", async () => {
    localStorage.setItem("alm_auth_token", "abc-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ timestamp: 10, state: createInitialState() }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await fetchSharedState();

    const [, request] = fetchSpy.mock.calls[0];
    expect((request?.headers as Record<string, string>).Authorization).toBe("Bearer abc-token");
  });

  it("returns null for 404 snapshot endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    await expect(fetchSharedState()).resolves.toBeNull();
  });

  it("sends snapshot payload on push", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const state = createInitialState();

    await pushSharedState({ timestamp: 42, state });

    const [, request] = fetchSpy.mock.calls[0];
    expect(request?.method).toBe("PUT");
    expect(request?.body).toContain('"timestamp":42');
  });
  it("throws SharedStatePushError with status on failed push", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 409 }));

    try {
      await pushSharedState({ timestamp: 42, state: createInitialState() });
      throw new Error("expected pushSharedState to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SharedStatePushError);
      expect((error as SharedStatePushError).status).toBe(409);
    }
  });

});
