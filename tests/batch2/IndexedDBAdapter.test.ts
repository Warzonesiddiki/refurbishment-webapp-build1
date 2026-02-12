import { afterEach, describe, expect, it, vi } from "vitest";
import { IndexedDBAdapter } from "@/store/persistence/IndexedDBAdapter";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  IndexedDBAdapter.resetWarningStateForTests();
});

describe("IndexedDBAdapter", () => {
  it("get/set roundtrip works (with fallback in jsdom)", async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.set("almasfufa:idb-key", { ok: true });
    const loaded = await adapter.get<{ ok: boolean }>("almasfufa:idb-key");
    expect(loaded?.ok).toBe(true);
  });

  it("handles missing key gracefully", async () => {
    const adapter = new IndexedDBAdapter();
    await expect(adapter.get("almasfufa:none")).resolves.toBeNull();
  });

  it("warns once per fallback operation type", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = new IndexedDBAdapter();

    await adapter.get("almasfufa:first-miss");
    await adapter.get("almasfufa:second-miss");
    await adapter.set("almasfufa:key", { ok: true });
    await adapter.set("almasfufa:key2", { ok: true });

    const warnMessages = warnSpy.mock.calls.map(([msg]) => String(msg));
    expect(warnMessages.filter((m) => m.includes("localStorage get"))).toHaveLength(1);
    expect(warnMessages.filter((m) => m.includes("localStorage set"))).toHaveLength(1);
  });
});
