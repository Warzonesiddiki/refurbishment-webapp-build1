import { describe, expect, it } from "vitest";

import { createInitialState } from "@/store/appState";

describe("tab sync", () => {
  it("state contains serializable fields for sync payload", () => {
    const state = createInitialState();
    const serialized = JSON.stringify(state);
    expect(serialized.length).toBeGreaterThan(10);
    expect(JSON.parse(serialized).laptops).toBeTruthy();
  });
});
