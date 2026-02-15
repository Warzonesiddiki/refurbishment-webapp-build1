export type JournalDrilldownScope = "all" | "sales" | "purchases" | "receipts" | "payments";
export type JournalWindow = "all-time" | "this-month" | "last-30-days";

export type JournalDrilldownRow = {
  id: string;
  date: string;
  source: Exclude<JournalDrilldownScope, "all">;
  reference: string;
  counterparty: string;
  amount: number;
};

type JournalStateSlice = {
  sales: { id: string; invoice: string; date: string; customer: string; total: number }[];
  purchases: { id: string; purchase: string; date: string; supplier: string; total: number }[];
  receipts: { id: string; receipt: string; date: string; invoice: string; amount: number }[];
  payments: { id: string; payment: string; date: string; supplier: string; amount: number }[];
};

export function buildJournalDrilldownRows(state: JournalStateSlice): JournalDrilldownRow[] {
  const invoiceToCustomer = new Map(state.sales.map((sale) => [sale.invoice, sale.customer]));

  return [
    ...state.sales.map((sale) => ({
      id: `sale-${sale.id}`,
      date: sale.date,
      source: "sales" as const,
      reference: sale.invoice,
      counterparty: sale.customer,
      amount: sale.total,
    })),
    ...state.purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      date: purchase.date,
      source: "purchases" as const,
      reference: purchase.purchase,
      counterparty: purchase.supplier,
      amount: purchase.total,
    })),
    ...state.receipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      date: receipt.date,
      source: "receipts" as const,
      reference: receipt.receipt,
      counterparty: invoiceToCustomer.get(receipt.invoice) ?? "Unknown",
      amount: receipt.amount,
    })),
    ...state.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      date: payment.date,
      source: "payments" as const,
      reference: payment.payment,
      counterparty: payment.supplier,
      amount: payment.amount,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function filterJournalDrilldownRows(rows: JournalDrilldownRow[], scope: JournalDrilldownScope, window: JournalWindow, now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);

  return rows.filter((row) => {
    const matchesScope = scope === "all" || row.source === scope;
    if (!matchesScope) return false;

    if (window === "all-time") return true;
    const rowDate = new Date(row.date);
    if (Number.isNaN(rowDate.getTime())) return false;
    if (window === "this-month") return rowDate >= monthStart;
    return rowDate >= last30;
  });
}

export function summarizeJournalRows(rows: JournalDrilldownRow[]) {
  const bySource: Record<JournalDrilldownScope, number> = {
    all: 0,
    sales: 0,
    purchases: 0,
    receipts: 0,
    payments: 0,
  };

  for (const row of rows) {
    bySource[row.source] += row.amount;
    bySource.all += row.amount;
  }

  return {
    totalAmount: bySource.all,
    bySource,
  };
}
