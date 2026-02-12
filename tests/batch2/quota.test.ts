import { describe, expect, it, vi } from "vitest";
import { checkStorageQuota } from "@/store/persistence/quota";

describe("storage quota", () => {
  it("calculates percentage from estimate", async () => {
    const estimate = vi.fn().mockResolvedValue({ usage: 80, quota: 100 });
    Object.defineProperty(navigator, "storage", { value: { estimate }, configurable: true });
    const quota = await checkStorageQuota();
    expect(quota.percent).toBe(80);
  });
});
