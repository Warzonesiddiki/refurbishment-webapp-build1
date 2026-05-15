import { describe, expect, it } from "vitest";
import { InMemoryEventAdapter, PersistentEventStore } from "@/v3/events/persistentEventStore";

describe("v3 persistent event store", () => {
  it("persists events and can reload from adapter", () => {
    const adapter = new InMemoryEventAdapter();
    const store = new PersistentEventStore("events:test", adapter);

    store.append({
      tenantId: "t1",
      aggregateId: "a1",
      name: "SaleRecorded",
      payload: { saleId: "s1", invoice: "INV-1", date: "2026-02-10", customer: "Acme", total: 150 },
    });

    const reloaded = new PersistentEventStore("events:test", adapter);
    expect(reloaded.all()).toHaveLength(1);
    expect(reloaded.byAggregate("a1")).toHaveLength(1);
  });

  it("clears persisted events", () => {
    const adapter = new InMemoryEventAdapter();
    const store = new PersistentEventStore("events:test-clear", adapter);

    store.append({
      tenantId: "t1",
      aggregateId: "a1",
      name: "PaymentRecorded",
      payload: { paymentId: "pm1", payment: "PAY-1", date: "2026-02-10", supplier: "Supply", amount: 12 },
    });

    store.clear();
    expect(store.all()).toEqual([]);
  });
});
