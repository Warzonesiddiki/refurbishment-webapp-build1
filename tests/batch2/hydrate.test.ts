import { describe, expect, it } from "vitest";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { hydrateState } from "@/store/persistence/hydrate";
import { APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";
import { createInitialState } from "@/store/appState";

describe("hydrateState", () => {
  it("returns null when storage empty", async () => {
    const adapter = new LocalStorageAdapter();
    await adapter.clear();
    const result = await hydrateState(adapter);
    expect(result.state).toBeNull();
    expect(result.hydrated).toBe(false);
  });

  it("hydrates valid state", async () => {
    const adapter = new LocalStorageAdapter();
    const state = createInitialState();
    await adapter.set(APP_STATE_KEY, { version: 3, timestamp: Date.now(), data: state });
    const result = await hydrateState(adapter);
    expect(result.state?.laptops.length).toBe(state.laptops.length);
  });
});
