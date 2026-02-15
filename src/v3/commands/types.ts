export type V3CommandName = "RecordSale" | "RecordPurchase" | "RecordReceipt" | "RecordPayment";

export type CommandPayloadByName = {
  RecordSale: { saleId: string; invoice: string; date: string; customer: string; total: number };
  RecordPurchase: { purchaseId: string; purchase: string; date: string; supplier: string; total: number };
  RecordReceipt: { receiptId: string; receipt: string; date: string; invoice: string; amount: number };
  RecordPayment: { paymentId: string; payment: string; date: string; supplier: string; amount: number };
};

export type V3Command<T extends V3CommandName = V3CommandName> = {
  idempotencyKey: string;
  tenantId: string;
  name: T;
  payload: CommandPayloadByName[T];
};
