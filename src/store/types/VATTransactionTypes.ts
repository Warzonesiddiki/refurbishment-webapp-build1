import type { VATCategory } from "./VATTypes";

export type VATTransactionType = "OUTPUT" | "INPUT";
export type VATTransactionSourceType = "SALE" | "PURCHASE" | "ADJUSTMENT" | "IMPORT";

export type VATTransaction = {
  id: string;
  type: VATTransactionType;
  category: VATCategory;
  sourceType: VATTransactionSourceType;
  sourceId: string;
  sourceRef: string;
  counterpartyId: string | null;
  counterpartyName: string;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  transactionDate: string;
  periodId: string | null;
  isReversed: boolean;
  reversalId: string | null;
  reversalReason?: string;
  createdAt: string;
};

export type VATReturnLine = {
  box: number;
  description: string;
  amount: number;
};

export type VATReturnStatus = "DRAFT" | "CALCULATED" | "FILED" | "PAID";

export type VATReturn = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: VATReturnStatus;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  adjustments: number;
  finalAmount: number;
  lines: VATReturnLine[];
  transactionCount: number;
  filedDate: string | null;
  paidDate: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
