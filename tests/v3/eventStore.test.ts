import { describe, expect, it } from "vitest";
import { InMemoryEventStore } from "@/v3/events/eventStore";

describe("InMemoryEventStore", () => {
  it("appends and queries events", () => {
    const store = new InMemoryEventStore();

    store.append({
      tenantId: "t1",
      aggregateId: "sale-1",
      name: "SaleRecorded",
      payload: { saleId: "sale-1", invoice: "INV-1", date: "2026-02-01", customer: "Acme", total: 100 },
    });

    store.append({
      tenantId: "t1",
      aggregateId: "purchase-1",
      name: "PurchaseRecorded",
      payload: { purchaseId: "purchase-1", purchase: "PO-1", date: "2026-02-02", supplier: "Supply", total: 60 },
    });

    expect(store.all()).toHaveLength(2);
    expect(store.byAggregate("sale-1")).toHaveLength(1);
  });
});
