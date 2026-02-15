import { describe, expect, it, vi } from "vitest";
import { InMemoryCommandBus } from "@/v3/commands/commandBus";

describe("InMemoryCommandBus", () => {
  it("dispatches registered handlers and dedupes idempotency keys", () => {
    const bus = new InMemoryCommandBus();
    const handler = vi.fn();
    bus.register("RecordSale", handler);

    const command = {
      idempotencyKey: "sale-1",
      tenantId: "t1",
      name: "RecordSale" as const,
      payload: { saleId: "sale-1", invoice: "INV-1", date: "2026-02-01", customer: "A", total: 100 },
    };

    expect(bus.dispatch(command)).toBe("processed");
    expect(bus.dispatch(command)).toBe("deduped");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
