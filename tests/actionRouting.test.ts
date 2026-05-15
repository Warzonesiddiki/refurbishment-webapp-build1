import { describe, it, expect } from "vitest";
import { resolveActionRoute } from "@/utils/actionRouting";

describe("action routing", () => {
  it("resolves known action keys to pages", () => {
    expect(resolveActionRoute("scan")).toBe("scanner");
    expect(resolveActionRoute("new-sale")).toBe("sales-new");
    expect(resolveActionRoute("export-vat")).toBe("finance-vat");
    expect(resolveActionRoute("add-wip-job")).toBe("processing-wip");
  });

  it("resolves formerly-unmapped operational actions", () => {
    expect(resolveActionRoute("open-day")).toBe("finance-cash");
    expect(resolveActionRoute("close-day")).toBe("finance-cash");
    expect(resolveActionRoute("add-receipt")).toBe("sales-receipts");
    expect(resolveActionRoute("add-payment")).toBe("purchases-payments");
    expect(resolveActionRoute("add-supplier")).toBe("master-suppliers");
    expect(resolveActionRoute("add-lot")).toBe("master-lots");
  });

  it("returns null for non-route actions", () => {
    expect(resolveActionRoute("backup")).toBeNull();
    expect(resolveActionRoute("refresh")).toBeNull();
  });
});
