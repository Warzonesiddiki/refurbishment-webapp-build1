import { describe, expect, it, vi } from "vitest";
import { InMemoryCommandBus } from "@/v3/commands/commandBus";
import { InMemoryEventStore } from "@/v3/events/eventStore";
import { dualWriteSaleRecord } from "@/v3/migration/salesDualWriteAdapter";

describe("v3 sales dual-write adapter", () => {
  it("writes to legacy handler and v3 command bus", () => {
    const bus = new InMemoryCommandBus();
    const store = new InMemoryEventStore();
    const legacyHandler = vi.fn();

    bus.register("RecordSale", (command) => {
      store.append({
        tenantId: command.tenantId,
        aggregateId: command.payload.saleId,
        name: "SaleRecorded",
        payload: command.payload,
      });
    });

    dualWriteSaleRecord(
      { id: "s1", invoice: "INV-1", date: "2026-02-10", customer: "Acme", total: 99 },
      { tenantId: "t1", commandBus: bus, applyLegacySale: legacyHandler },
    );

    expect(legacyHandler).toHaveBeenCalledOnce();
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0].name).toBe("SaleRecorded");
  });
});
