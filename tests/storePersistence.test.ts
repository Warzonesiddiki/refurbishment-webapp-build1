import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "@/store/appState";
import { STORAGE_KEY, clearPersistedState, loadPersistedState, persistState } from "@/store/persistence";

describe("store persistence", () => {
  beforeEach(() => {
    clearPersistedState();
  });

  it("persists and loads app state from localStorage", () => {
    const state = createInitialState();
    state.settings.companyName = "TAHIR ERP QA";

    persistState(state);

    const loaded = loadPersistedState();
    expect(loaded).not.toBeNull();
    expect(loaded?.settings.companyName).toBe("TAHIR ERP QA");
  });

  it("returns null when persisted payload is invalid", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");

    expect(loadPersistedState()).toBeNull();
  });
});
