import type { InMemoryCommandBus } from "@/v3/commands/commandBus";

export type LegacySaleRecord = {
  id: string;
  invoice: string;
  date: string;
  customer: string;
  total: number;
};

export type SalesDualWriteDeps = {
  tenantId: string;
  commandBus: InMemoryCommandBus;
  applyLegacySale: (sale: LegacySaleRecord) => void;
};

export function dualWriteSaleRecord(sale: LegacySaleRecord, deps: SalesDualWriteDeps) {
  deps.applyLegacySale(sale);

  deps.commandBus.dispatch({
    idempotencyKey: `sale-${sale.id}`,
    tenantId: deps.tenantId,
    name: "RecordSale",
    payload: {
      saleId: sale.id,
      invoice: sale.invoice,
      date: sale.date,
      customer: sale.customer,
      total: sale.total,
    },
  });
}
