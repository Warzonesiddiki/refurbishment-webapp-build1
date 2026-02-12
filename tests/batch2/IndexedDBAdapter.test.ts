import { describe, expect, it } from "vitest";
import { IndexedDBAdapter } from "@/store/persistence/IndexedDBAdapter";

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
});
