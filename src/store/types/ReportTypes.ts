export type ProfitLossReport = {
  periodStart: string;
  periodEnd: string;
  revenue: { salesRevenue: number; otherIncome: number; totalRevenue: number };
  costOfGoodsSold: { openingInventory: number; purchases: number; closingInventory: number; totalCOGS: number };
  grossProfit: number;
  grossMarginPercent: number;
  expenses: { parts: number; labor: number; overhead: number; other: number; totalExpenses: number };
  operatingProfit: number;
  otherExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  comparison: ProfitLossReport | null;
};

export type BalanceSheet = {
  asOfDate: string;
  assets: {
    currentAssets: { cash: number; receivables: number; inventory: number; prepaidExpenses: number; totalCurrent: number };
    fixedAssets: { equipment: number; accumulatedDepreciation: number; totalFixed: number };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: { payables: number; vatPayable: number; accruedExpenses: number; totalCurrent: number };
    longTermLiabilities: { loans: number; totalLongTerm: number };
    totalLiabilities: number;
  };
  equity: {
    ownerCapital: number;
    drawings: number;
    retainedEarnings: number;
    currentPeriodProfit: number;
    totalEquity: number;
  };
  balanceCheck: boolean;
};

export type MarginBreakdown = {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
};

export type MarginReport = {
  periodStart: string;
  periodEnd: string;
  overall: { unitsSold: number; revenue: number; cost: number; margin: number; marginPercent: number };
  bySupplier: MarginBreakdown[];
  byLot: MarginBreakdown[];
  byGrade: MarginBreakdown[];
  byModel: MarginBreakdown[];
};
