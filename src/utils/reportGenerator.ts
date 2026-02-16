import type { AppState } from "@/store/appState";
import type { BalanceSheet, MarginBreakdown, MarginReport, ProfitLossReport } from "@/store/types/ReportTypes";
import type { VATReturn } from "@/store/types/VATTransactionTypes";

const inRange = (date: string, start: Date, end: Date) => {
  const d = +new Date(date);
  return d >= +start && d <= +end;
};
const round2 = (n: number) => Number(n.toFixed(2));

export type ManagementAccountingSnapshot = {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  operatingCashflow: number;
  receivablesDays: number;
  payablesDays: number;
  inventoryTurnover: number;
  breakEvenRevenue: number;
};


export type AgedBucketSummary = {
  bucket: "0-30" | "31-60" | "61-90" | "90+";
  amount: number;
  count: number;
};

export type AgedBalanceSnapshot = {
  asOfDate: string;
  receivables: AgedBucketSummary[];
  payables: AgedBucketSummary[];
  totalReceivablesDue: number;
  totalPayablesDue: number;
};

export type CashFlowStatement = {
  periodStart: string;
  periodEnd: string;
  direct: {
    cashReceivedFromCustomers: number;
    cashPaidToSuppliers: number;
    ownerContributions: number;
    ownerDrawings: number;
    netCashFromOperations: number;
  };
  indirect: {
    netProfit: number;
    workingCapitalAdjustments: number;
    netCashFromOperations: number;
  };
};

export type TaxationSummary = {
  periodStart: string;
  periodEnd: string;
  outputVAT: number;
  inputVAT: number;
  netVATPayable: number;
  taxableRevenue: number;
  zeroRatedRevenue: number;
  effectiveTaxRatePercent: number;
};

export type VatExceptionItem = {
  source: "sale" | "purchase";
  id: string;
  reference: string;
  date: string;
  issue: "missing_vat_value" | "invalid_vat_value" | "unexpected_zero_vat" | "vat_mismatch";
  expectedVat: number;
  actualVat: number;
  variance: number;
};

export type VatExceptionReport = {
  periodStart: string;
  periodEnd: string;
  issueCount: number;
  issues: VatExceptionItem[];
};

export type VatBoxMappingLine = {
  box: number;
  label: string;
  amount: number;
  source: "sales" | "purchases" | "derived";
};

export type VatBoxMappingReport = {
  periodStart: string;
  periodEnd: string;
  lines: VatBoxMappingLine[];
};

export function generateProfitLossReport(
  state: AppState,
  periodStart: Date,
  periodEnd: Date,
  comparisonPeriod?: { start: Date; end: Date }
): ProfitLossReport {
  const sales = state.sales.filter((s) => inRange(s.date, periodStart, periodEnd) && ["confirmed", "paid"].includes(s.status.toLowerCase()));
  const salesRevenue = round2(sales.reduce((sum, s) => sum + s.subtotal, 0));
  const cogs = round2(sales.reduce((sum, s) => sum + s.lineItems.reduce((a, l) => a + (l.cost || 0), 0), 0));
  const totalRevenue = salesRevenue;
  const grossProfit = round2(totalRevenue - cogs);
  const expenses = {
    parts: round2(state.wipJobs.reduce((s, w) => s + (w.partsCost || 0), 0)),
    labor: round2(state.wipJobs.reduce((s, w) => s + (w.laborEntries || []).reduce((a, l) => a + l.hours * l.rate, 0), 0)),
    overhead: 0,
    other: 0,
    totalExpenses: 0,
  };
  expenses.totalExpenses = round2(expenses.parts + expenses.labor + expenses.overhead + expenses.other);
  const operatingProfit = round2(grossProfit - expenses.totalExpenses);
  const netProfit = operatingProfit;

  const report: ProfitLossReport = {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    revenue: { salesRevenue, otherIncome: 0, totalRevenue },
    costOfGoodsSold: { openingInventory: 0, purchases: cogs, closingInventory: 0, totalCOGS: cogs },
    grossProfit,
    grossMarginPercent: totalRevenue ? round2((grossProfit / totalRevenue) * 100) : 0,
    expenses,
    operatingProfit,
    otherExpenses: 0,
    netProfit,
    netMarginPercent: totalRevenue ? round2((netProfit / totalRevenue) * 100) : 0,
    comparison: null,
  };

  if (comparisonPeriod) {
    report.comparison = generateProfitLossReport(state, comparisonPeriod.start, comparisonPeriod.end);
  }
  return report;
}

export function generateVATReport(state: AppState, periodStart: Date, periodEnd: Date): VATReturn {
  const sales = state.sales.filter((s) => inRange(s.date, periodStart, periodEnd));
  const purchases = state.purchases.filter((p) => inRange(p.date, periodStart, periodEnd));
  const outputVAT = round2(sales.reduce((sum, s) => sum + s.vat, 0));
  const inputVAT = round2(purchases.reduce((sum, p) => sum + p.vat, 0));
  const netVAT = round2(outputVAT - inputVAT);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    status: "CALCULATED",
    outputVAT,
    inputVAT,
    netVAT,
    adjustments: 0,
    finalAmount: netVAT,
    lines: [
      { box: 1, description: "Output VAT", amount: outputVAT },
      { box: 4, description: "Input VAT", amount: inputVAT },
      { box: 5, description: "Net VAT", amount: netVAT },
    ],
    transactionCount: sales.length + purchases.length,
    filedDate: null,
    paidDate: null,
    reference: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function generateTaxationSummary(state: AppState, periodStart: Date, periodEnd: Date): TaxationSummary {
  const sales = state.sales.filter((s) => inRange(s.date, periodStart, periodEnd));
  const purchases = state.purchases.filter((p) => inRange(p.date, periodStart, periodEnd));
  const taxableRevenue = round2(sales.reduce((sum, s) => sum + s.subtotal, 0));
  const zeroRatedRevenue = 0;
  const outputVAT = round2(sales.reduce((sum, s) => sum + s.vat, 0));
  const inputVAT = round2(purchases.reduce((sum, p) => sum + p.vat, 0));
  const netVATPayable = round2(outputVAT - inputVAT);
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    outputVAT,
    inputVAT,
    netVATPayable,
    taxableRevenue,
    zeroRatedRevenue,
    effectiveTaxRatePercent: taxableRevenue ? round2((outputVAT / taxableRevenue) * 100) : 0,
  };
}


function detectVatIssue(
  source: "sale" | "purchase",
  row: { id: string; reference: string; date: string; subtotal: number; vat: number },
  vatRatePercent: number,
  mismatchTolerance: number
): VatExceptionItem | null {
  if (row.vat === null || row.vat === undefined) {
    return {
      source,
      id: row.id,
      reference: row.reference,
      date: row.date,
      issue: "missing_vat_value",
      expectedVat: round2((row.subtotal * vatRatePercent) / 100),
      actualVat: 0,
      variance: round2((row.subtotal * vatRatePercent) / 100),
    };
  }

  if (!Number.isFinite(row.vat)) {
    return {
      source,
      id: row.id,
      reference: row.reference,
      date: row.date,
      issue: "invalid_vat_value",
      expectedVat: round2((row.subtotal * vatRatePercent) / 100),
      actualVat: Number.isFinite(row.vat) ? row.vat : 0,
      variance: round2((row.subtotal * vatRatePercent) / 100),
    };
  }

  const expectedVat = round2((row.subtotal * vatRatePercent) / 100);
  const variance = round2(row.vat - expectedVat);

  if (row.subtotal > 0 && vatRatePercent > 0 && row.vat === 0) {
    return {
      source,
      id: row.id,
      reference: row.reference,
      date: row.date,
      issue: "unexpected_zero_vat",
      expectedVat,
      actualVat: row.vat,
      variance,
    };
  }

  if (Math.abs(variance) > mismatchTolerance) {
    return {
      source,
      id: row.id,
      reference: row.reference,
      date: row.date,
      issue: "vat_mismatch",
      expectedVat,
      actualVat: row.vat,
      variance,
    };
  }

  return null;
}

export function generateVatExceptionReport(
  state: AppState,
  periodStart: Date,
  periodEnd: Date,
  options?: { mismatchTolerance?: number }
): VatExceptionReport {
  const mismatchTolerance = options?.mismatchTolerance ?? 0.05;
  const vatRatePercent = Number(state.settings.vatRate) || 0;

  const saleIssues = state.sales
    .filter((sale) => inRange(sale.date, periodStart, periodEnd))
    .map((sale) =>
      detectVatIssue(
        "sale",
        {
          id: sale.id,
          reference: sale.invoice,
          date: sale.date,
          subtotal: Number(sale.subtotal || 0),
          vat: sale.vat,
        },
        vatRatePercent,
        mismatchTolerance
      )
    )
    .filter((issue): issue is VatExceptionItem => issue !== null);

  const purchaseIssues = state.purchases
    .filter((purchase) => inRange(purchase.date, periodStart, periodEnd))
    .map((purchase) =>
      detectVatIssue(
        "purchase",
        {
          id: purchase.id,
          reference: purchase.purchase,
          date: purchase.date,
          subtotal: Number((purchase as { subtotal?: number }).subtotal ?? purchase.total - purchase.vat),
          vat: purchase.vat,
        },
        vatRatePercent,
        mismatchTolerance
      )
    )
    .filter((issue): issue is VatExceptionItem => issue !== null);

  const issues = [...saleIssues, ...purchaseIssues];

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    issueCount: issues.length,
    issues,
  };
}


export function generateVatBoxMappingReport(state: AppState, periodStart: Date, periodEnd: Date): VatBoxMappingReport {
  const sales = state.sales.filter((sale) => inRange(sale.date, periodStart, periodEnd));
  const purchases = state.purchases.filter((purchase) => inRange(purchase.date, periodStart, periodEnd));

  const taxableSupplies = round2(sales.reduce((sum, sale) => sum + sale.subtotal, 0));
  const outputVat = round2(sales.reduce((sum, sale) => sum + sale.vat, 0));
  const inputVat = round2(purchases.reduce((sum, purchase) => sum + purchase.vat, 0));
  const netVat = round2(outputVat - inputVat);

  const lines: VatBoxMappingLine[] = [
    { box: 1, label: "Taxable supplies (standard rate)", amount: taxableSupplies, source: "sales" },
    { box: 2, label: "Output VAT due", amount: outputVat, source: "sales" },
    { box: 4, label: "Input VAT recoverable", amount: inputVat, source: "purchases" },
    { box: 5, label: "Net VAT payable/(reclaimable)", amount: netVat, source: "derived" },
  ];

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    lines,
  };
}

export function generateBalanceSheet(state: AppState, asOfDate: Date): BalanceSheet {
  const cash = round2(state.cashEntries.filter((c) => +new Date(c.time) <= +asOfDate).reduce((s, c) => s + c.amount, 0));
  const receivables = round2(
    state.sales.filter((s) => +new Date(s.date) <= +asOfDate).reduce((sum, s) => sum + s.total, 0) -
      state.receipts.filter((r) => +new Date(r.date) <= +asOfDate).reduce((sum, r) => sum + r.amount, 0)
  );
  const inventory = round2(state.laptops.filter((l) => l.status !== "sold").reduce((s, l) => s + Number(l.cost || 0), 0));
  const payables = round2(
    state.purchases.filter((p) => +new Date(p.date) <= +asOfDate).reduce((sum, p) => sum + p.total, 0) -
      state.payments.filter((p) => +new Date(p.date) <= +asOfDate).reduce((sum, p) => sum + p.amount, 0)
  );
  const vatPayable = round2(
    state.sales.filter((s) => +new Date(s.date) <= +asOfDate).reduce((sum, s) => sum + s.vat, 0) -
      state.purchases.filter((p) => +new Date(p.date) <= +asOfDate).reduce((sum, p) => sum + p.vat, 0)
  );
  const currentProfit = generateProfitLossReport(state, new Date(asOfDate.getFullYear(), 0, 1), asOfDate).netProfit;

  const assetsCurrent = { cash, receivables, inventory, prepaidExpenses: 0, totalCurrent: round2(cash + receivables + inventory) };
  const fixedAssets = { equipment: 0, accumulatedDepreciation: 0, totalFixed: 0 };
  const totalAssets = round2(assetsCurrent.totalCurrent + fixedAssets.totalFixed);
  const liabilitiesCurrent = { payables, vatPayable, accruedExpenses: 0, totalCurrent: round2(payables + vatPayable) };
  const liabilities = { currentLiabilities: liabilitiesCurrent, longTermLiabilities: { loans: 0, totalLongTerm: 0 }, totalLiabilities: liabilitiesCurrent.totalCurrent };
  const equity = {
    ownerCapital: round2(state.ownerEntries.filter((o) => o.type.toLowerCase().includes("invest")).reduce((s, o) => s + o.amount, 0)),
    drawings: round2(state.ownerEntries.filter((o) => o.type.toLowerCase().includes("draw")).reduce((s, o) => s + o.amount, 0)),
    retainedEarnings: 0,
    currentPeriodProfit: currentProfit,
    totalEquity: 0,
  };
  equity.totalEquity = round2(equity.ownerCapital - equity.drawings + equity.retainedEarnings + equity.currentPeriodProfit);
  return {
    asOfDate: asOfDate.toISOString(),
    assets: { currentAssets: assetsCurrent, fixedAssets, totalAssets },
    liabilities,
    equity,
    balanceCheck: round2(totalAssets) === round2(liabilities.totalLiabilities + equity.totalEquity),
  };
}

export function generateCashFlowStatement(state: AppState, periodStart: Date, periodEnd: Date): CashFlowStatement {
  const cashReceivedFromCustomers = round2(
    state.receipts.filter((receipt) => inRange(receipt.date, periodStart, periodEnd)).reduce((sum, receipt) => sum + receipt.amount, 0)
  );
  const cashPaidToSuppliers = round2(
    state.payments.filter((payment) => inRange(payment.date, periodStart, periodEnd)).reduce((sum, payment) => sum + payment.amount, 0)
  );
  const ownerContributions = round2(
    state.ownerEntries
      .filter((entry) => inRange(entry.date, periodStart, periodEnd) && entry.type.toLowerCase().includes("invest"))
      .reduce((sum, entry) => sum + entry.amount, 0)
  );
  const ownerDrawings = round2(
    state.ownerEntries
      .filter((entry) => inRange(entry.date, periodStart, periodEnd) && entry.type.toLowerCase().includes("draw"))
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0)
  );

  const directOperations = round2(cashReceivedFromCustomers - cashPaidToSuppliers + ownerContributions - ownerDrawings);

  const profitLoss = generateProfitLossReport(state, periodStart, periodEnd);
  const receivablesDelta = round2(
    state.sales.filter((sale) => inRange(sale.date, periodStart, periodEnd)).reduce((sum, sale) => sum + sale.total, 0) - cashReceivedFromCustomers
  );
  const payablesDelta = round2(
    state.purchases.filter((purchase) => inRange(purchase.date, periodStart, periodEnd)).reduce((sum, purchase) => sum + purchase.total, 0) - cashPaidToSuppliers
  );
  const workingCapitalAdjustments = round2(payablesDelta - receivablesDelta);
  const indirectOperations = round2(profitLoss.netProfit + workingCapitalAdjustments);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    direct: {
      cashReceivedFromCustomers,
      cashPaidToSuppliers,
      ownerContributions,
      ownerDrawings,
      netCashFromOperations: directOperations,
    },
    indirect: {
      netProfit: profitLoss.netProfit,
      workingCapitalAdjustments,
      netCashFromOperations: indirectOperations,
    },
  };
}

export function generateManagementAccountingSnapshot(state: AppState, periodStart: Date, periodEnd: Date): ManagementAccountingSnapshot {
  const pl = generateProfitLossReport(state, periodStart, periodEnd);
  const salesInPeriod = state.sales.filter((s) => inRange(s.date, periodStart, periodEnd));
  const purchasesInPeriod = state.purchases.filter((p) => inRange(p.date, periodStart, periodEnd));
  const receipts = state.receipts.filter((r) => inRange(r.date, periodStart, periodEnd)).reduce((sum, r) => sum + r.amount, 0);
  const payments = state.payments.filter((p) => inRange(p.date, periodStart, periodEnd)).reduce((sum, p) => sum + p.amount, 0);
  const periodDays = Math.max(1, Math.round((+periodEnd - +periodStart) / (1000 * 60 * 60 * 24)));

  const avgReceivables = round2(
    salesInPeriod.reduce((sum, s) => sum + s.total, 0) - state.receipts.filter((r) => inRange(r.date, periodStart, periodEnd)).reduce((sum, r) => sum + r.amount, 0)
  );
  const avgPayables = round2(
    purchasesInPeriod.reduce((sum, p) => sum + p.total, 0) - state.payments.filter((p) => inRange(p.date, periodStart, periodEnd)).reduce((sum, p) => sum + p.amount, 0)
  );

  const inventoryValue = round2(state.laptops.filter((l) => l.status !== "sold").reduce((sum, l) => sum + Number(l.cost || 0), 0));
  const cogs = pl.costOfGoodsSold.totalCOGS;
  const contributionMargin = round2(pl.revenue.totalRevenue - pl.costOfGoodsSold.totalCOGS - pl.expenses.parts);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    revenue: pl.revenue.totalRevenue,
    cogs,
    grossProfit: pl.grossProfit,
    netProfit: pl.netProfit,
    grossMarginPercent: pl.grossMarginPercent,
    netMarginPercent: pl.netMarginPercent,
    operatingCashflow: round2(receipts - payments),
    receivablesDays: pl.revenue.totalRevenue ? round2((avgReceivables / pl.revenue.totalRevenue) * periodDays) : 0,
    payablesDays: cogs ? round2((avgPayables / cogs) * periodDays) : 0,
    inventoryTurnover: inventoryValue ? round2(cogs / inventoryValue) : 0,
    breakEvenRevenue: contributionMargin > 0 ? round2((pl.expenses.totalExpenses / contributionMargin) * pl.revenue.totalRevenue) : 0,
  };
}


function buildAgingBuckets() {
  return [
    { bucket: "0-30" as const, amount: 0, count: 0 },
    { bucket: "31-60" as const, amount: 0, count: 0 },
    { bucket: "61-90" as const, amount: 0, count: 0 },
    { bucket: "90+" as const, amount: 0, count: 0 },
  ];
}

function agingBucketForDays(daysOverdue: number): AgedBucketSummary["bucket"] {
  if (daysOverdue <= 30) return "0-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export function generateAgedBalanceSnapshot(state: AppState, asOfDate: Date): AgedBalanceSnapshot {
  const bucketIndex: Record<AgedBucketSummary["bucket"], number> = { "0-30": 0, "31-60": 1, "61-90": 2, "90+": 3 };
  const receivableBuckets = buildAgingBuckets();
  const payableBuckets = buildAgingBuckets();

  for (const sale of state.sales) {
    if (+new Date(sale.date) > +asOfDate) continue;
    const paidAmount = state.receipts
      .filter((receipt) => receipt.invoice === sale.invoice && +new Date(receipt.date) <= +asOfDate)
      .reduce((sum, receipt) => sum + receipt.amount, 0);
    const dueAmount = round2(Math.max(0, sale.total - paidAmount));
    if (dueAmount <= 0) continue;
    const days = Math.max(0, Math.floor((+asOfDate - +new Date(sale.date)) / (1000 * 60 * 60 * 24)));
    const bucket = agingBucketForDays(days);
    const idx = bucketIndex[bucket];
    receivableBuckets[idx].amount = round2(receivableBuckets[idx].amount + dueAmount);
    receivableBuckets[idx].count += 1;
  }

  for (const purchase of state.purchases) {
    if (+new Date(purchase.date) > +asOfDate) continue;
    const paidAmount = state.payments
      .filter((payment) => payment.purchase === purchase.purchase && +new Date(payment.date) <= +asOfDate)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const dueAmount = round2(Math.max(0, purchase.total - paidAmount));
    if (dueAmount <= 0) continue;
    const days = Math.max(0, Math.floor((+asOfDate - +new Date(purchase.date)) / (1000 * 60 * 60 * 24)));
    const bucket = agingBucketForDays(days);
    const idx = bucketIndex[bucket];
    payableBuckets[idx].amount = round2(payableBuckets[idx].amount + dueAmount);
    payableBuckets[idx].count += 1;
  }

  return {
    asOfDate: asOfDate.toISOString(),
    receivables: receivableBuckets,
    payables: payableBuckets,
    totalReceivablesDue: round2(receivableBuckets.reduce((sum, b) => sum + b.amount, 0)),
    totalPayablesDue: round2(payableBuckets.reduce((sum, b) => sum + b.amount, 0)),
  };
}

function grouped(items: AppState["sales"], key: (sale: AppState["sales"][number]) => string): MarginBreakdown[] {
  const map = new Map<string, MarginBreakdown>();
  for (const sale of items) {
    const id = key(sale) || "unknown";
    const units = sale.lineItems.length || sale.items || 0;
    const revenue = sale.total;
    const cost = sale.lineItems.reduce((s, l) => s + l.cost, 0);
    const existing = map.get(id) ?? { id, name: id, unitsSold: 0, revenue: 0, cost: 0, margin: 0, marginPercent: 0 };
    existing.unitsSold += units;
    existing.revenue += revenue;
    existing.cost += cost;
    existing.margin = round2(existing.revenue - existing.cost);
    existing.marginPercent = existing.revenue ? round2((existing.margin / existing.revenue) * 100) : 0;
    map.set(id, existing);
  }
  return [...map.values()];
}

export function generateMarginReport(state: AppState, periodStart: Date, periodEnd: Date): MarginReport {
  const sales = state.sales.filter((s) => inRange(s.date, periodStart, periodEnd));
  const revenue = round2(sales.reduce((s, x) => s + x.total, 0));
  const cost = round2(sales.reduce((s, x) => s + x.lineItems.reduce((a, l) => a + l.cost, 0), 0));
  const margin = round2(revenue - cost);
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    overall: {
      unitsSold: sales.reduce((s, x) => s + (x.items || x.lineItems.length), 0),
      revenue,
      cost,
      margin,
      marginPercent: revenue ? round2((margin / revenue) * 100) : 0,
    },
    bySupplier: grouped(sales, (s) => s.customer),
    byLot: grouped(sales, (s) => s.invoice.slice(0, 7)),
    byGrade: grouped(sales, (s) => s.status),
    byModel: grouped(sales, (s) => s.lineItems[0]?.name || "unknown"),
  };
}
