import { InMemoryCommandBus } from "@/v3/commands/commandBus";
import type { V3CommandName } from "@/v3/commands/types";
import { InMemoryEventStore } from "@/v3/events/eventStore";
import type { V3DomainEvent } from "@/v3/events/types";
import { dualWriteSaleRecord, type LegacySaleRecord } from "@/v3/migration/salesDualWriteAdapter";

export type JournalRowSource = "sales" | "purchases" | "receipts" | "payments";

export type JournalRow = {
  id: string;
  date: string;
  source: JournalRowSource;
  reference: string;
  counterparty: string;
  amount: number;
};

export type JournalProjectionSnapshot = {
  version: 1;
  capturedAt: string;
  eventCount: number;
  rows: JournalRow[];
};

export function projectJournalRows(events: V3DomainEvent[]) {
  const invoiceToCustomer = new Map<string, string>();

  for (const event of events) {
    if (event.name === "SaleRecorded") {
      invoiceToCustomer.set(event.payload.invoice, event.payload.customer);
    }
  }

  return events
    .map<JournalRow | null>((event) => {
      switch (event.name) {
        case "SaleRecorded":
          return {
            id: `sale-${event.payload.saleId}`,
            date: event.payload.date,
            source: "sales",
            reference: event.payload.invoice,
            counterparty: event.payload.customer,
            amount: event.payload.total,
          };
        case "PurchaseRecorded":
          return {
            id: `purchase-${event.payload.purchaseId}`,
            date: event.payload.date,
            source: "purchases",
            reference: event.payload.purchase,
            counterparty: event.payload.supplier,
            amount: event.payload.total,
          };
        case "ReceiptRecorded":
          return {
            id: `receipt-${event.payload.receiptId}`,
            date: event.payload.date,
            source: "receipts",
            reference: event.payload.receipt,
            counterparty: invoiceToCustomer.get(event.payload.invoice) ?? "Unknown",
            amount: event.payload.amount,
          };
        case "PaymentRecorded":
          return {
            id: `payment-${event.payload.paymentId}`,
            date: event.payload.date,
            source: "payments",
            reference: event.payload.payment,
            counterparty: event.payload.supplier,
            amount: event.payload.amount,
          };
        default:
          return null;
      }
    })
    .filter((row): row is JournalRow => Boolean(row))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function snapshotJournalProjection(rows: JournalRow[], eventCount: number): JournalProjectionSnapshot {
  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    eventCount,
    rows: [...rows],
  };
}

export function restoreJournalProjectionFromSnapshot(snapshot: JournalProjectionSnapshot) {
  return [...snapshot.rows];
}

export function rebuildJournalProjectionFromEvents(events: V3DomainEvent[]) {
  return snapshotJournalProjection(projectJournalRows(events), events.length);
}

function registerJournalCommandHandlers(bus: InMemoryCommandBus, store: InMemoryEventStore) {
  const map: Record<V3CommandName, (command: any) => void> = {
    RecordSale: (command) => {
      store.append({
        tenantId: command.tenantId,
        aggregateId: command.payload.saleId,
        name: "SaleRecorded",
        payload: command.payload,
      });
    },
    RecordPurchase: (command) => {
      store.append({
        tenantId: command.tenantId,
        aggregateId: command.payload.purchaseId,
        name: "PurchaseRecorded",
        payload: command.payload,
      });
    },
    RecordReceipt: (command) => {
      store.append({
        tenantId: command.tenantId,
        aggregateId: command.payload.receiptId,
        name: "ReceiptRecorded",
        payload: command.payload,
      });
    },
    RecordPayment: (command) => {
      store.append({
        tenantId: command.tenantId,
        aggregateId: command.payload.paymentId,
        name: "PaymentRecorded",
        payload: command.payload,
      });
    },
  };

  (Object.keys(map) as V3CommandName[]).forEach((name) => {
    bus.register(name, map[name] as any);
  });
}

export function buildJournalRowsViaV3Pipeline(input: {
  tenantId: string;
  sales: LegacySaleRecord[];
  purchases: { id: string; purchase: string; date: string; supplier: string; total: number }[];
  receipts: { id: string; receipt: string; date: string; invoice: string; amount: number }[];
  payments: { id: string; payment: string; date: string; supplier: string; amount: number }[];
}) {
  const store = new InMemoryEventStore();
  const bus = new InMemoryCommandBus();
  registerJournalCommandHandlers(bus, store);

  const mirroredLegacySales: LegacySaleRecord[] = [];

  input.sales.forEach((sale) => {
    dualWriteSaleRecord(sale, {
      tenantId: input.tenantId,
      commandBus: bus,
      applyLegacySale: (legacySale) => {
        mirroredLegacySales.push(legacySale);
      },
    });
  });

  input.purchases.forEach((purchase) => {
    bus.dispatch({
      idempotencyKey: `purchase-${purchase.id}`,
      tenantId: input.tenantId,
      name: "RecordPurchase",
      payload: {
        purchaseId: purchase.id,
        purchase: purchase.purchase,
        date: purchase.date,
        supplier: purchase.supplier,
        total: purchase.total,
      },
    });
  });

  input.receipts.forEach((receipt) => {
    bus.dispatch({
      idempotencyKey: `receipt-${receipt.id}`,
      tenantId: input.tenantId,
      name: "RecordReceipt",
      payload: {
        receiptId: receipt.id,
        receipt: receipt.receipt,
        date: receipt.date,
        invoice: receipt.invoice,
        amount: receipt.amount,
      },
    });
  });

  input.payments.forEach((payment) => {
    bus.dispatch({
      idempotencyKey: `payment-${payment.id}`,
      tenantId: input.tenantId,
      name: "RecordPayment",
      payload: {
        paymentId: payment.id,
        payment: payment.payment,
        date: payment.date,
        supplier: payment.supplier,
        amount: payment.amount,
      },
    });
  });

  return {
    rows: projectJournalRows(store.all()),
    snapshot: rebuildJournalProjectionFromEvents(store.all()),
    mirroredLegacySales,
  };
}
