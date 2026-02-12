import { describe, it, expect } from "vitest";
import { resolveActionRoute } from "@/utils/actionRouting";

describe("action routing", () => {
  it("resolves known action keys to pages", () => {
    expect(resolveActionRoute("scan")).toBe("scanner");
    expect(resolveActionRoute("new-sale")).toBe("sales-new");
    expect(resolveActionRoute("export-vat")).toBe("finance-vat");
    expect(resolveActionRoute("add-wip-job")).toBe("processing-wip");
  });

  it("returns null for unmapped actions", () => {
    expect(resolveActionRoute("backup")).toBeNull();
    expect(resolveActionRoute("refresh")).toBeNull();
  });
});
