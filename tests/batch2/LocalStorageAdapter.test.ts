import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { APP_STATE_KEY } from "@/store/persistence/IStorageAdapter";
import { StorageQuotaError } from "@/store/persistence/errors";

describe("LocalStorageAdapter", () => {
  const adapter = new LocalStorageAdapter();

  beforeEach(async () => {
    window.localStorage.clear();
    await adapter.clear();
  });

  it("get/set roundtrip preserves data", async () => {
    await adapter.set(APP_STATE_KEY, { a: 1, b: "x" });
    const loaded = await adapter.get<{ a: number; b: string }>(APP_STATE_KEY);
    expect(loaded).toEqual({ a: 1, b: "x" });
  });

  it("get returns null for missing key", async () => {
    await expect(adapter.get("tahir-erp:missing")).resolves.toBeNull();
  });

  it("clear removes only prefixed keys", async () => {
    window.localStorage.setItem("external", "1");
    await adapter.set("tahir-erp:test", { x: true });
    await adapter.clear();
    expect(window.localStorage.getItem("external")).toBe("1");
    expect(await adapter.get("tahir-erp:test")).toBeNull();
  });

  it("throws StorageQuotaError on quota exceeded", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    await expect(adapter.set("tahir-erp:test", { x: true })).rejects.toBeInstanceOf(StorageQuotaError);
    spy.mockRestore();
  });
});
