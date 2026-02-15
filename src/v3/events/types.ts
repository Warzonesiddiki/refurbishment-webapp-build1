export type V3DomainEventName =
  | "SaleRecorded"
  | "PurchaseRecorded"
  | "ReceiptRecorded"
  | "PaymentRecorded";

export type EventPayloadByName = {
  SaleRecorded: { saleId: string; invoice: string; date: string; customer: string; total: number };
  PurchaseRecorded: { purchaseId: string; purchase: string; date: string; supplier: string; total: number };
  ReceiptRecorded: { receiptId: string; receipt: string; date: string; invoice: string; amount: number };
  PaymentRecorded: { paymentId: string; payment: string; date: string; supplier: string; amount: number };
};

type BaseEvent = {
  id: string;
  ts: string;
  tenantId: string;
  aggregateId: string;
};

export type V3DomainEvent = {
  [K in V3DomainEventName]: BaseEvent & {
    name: K;
    payload: EventPayloadByName[K];
  };
}[V3DomainEventName];

export type NewV3DomainEvent = Omit<V3DomainEvent, "id" | "ts"> & Partial<Pick<V3DomainEvent, "id" | "ts">>;
export type V3EventEnvelope = V3DomainEvent;
