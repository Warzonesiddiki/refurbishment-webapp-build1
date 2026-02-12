export type PeriodType = "MONTH" | "QUARTER" | "YEAR";
export type PeriodStatus = "OPEN" | "CLOSING" | "CLOSED";

export type PeriodBalances = {
  cash: number;
  receivables: number;
  inventory: number;
  payables: number;
  ownerEquity: number;
  retainedEarnings: number;
};

export type FinancialPeriod = {
  id: string;
  name: string;
  type: PeriodType;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closedAt: string | null;
  closedBy: string | null;
  openingBalances: PeriodBalances;
  closingBalances: PeriodBalances | null;
  notes: string | null;
};

export type PeriodCloseChecklist = {
  allSalesInvoiced: boolean;
  allPurchasesReceived: boolean;
  allReceiptsRecorded: boolean;
  allPaymentsRecorded: boolean;
  inventoryReconciled: boolean;
  vatReturnPrepared: boolean;
  bankReconciled: boolean;
};
