import type { AppState } from "@/store/appState";
import type { FinancialPeriod } from "@/store/types/FinancialPeriodTypes";
import type { MarginBreakdown } from "@/store/types/ReportTypes";
import { generateMarginReport, generateProfitLossReport } from "@/utils/reportGenerator";

export function selectCurrentPeriod(state: AppState & { financialPeriods?: { periods: Record<string, FinancialPeriod>; currentPeriodId: string | null } }) {
  const fp = state.financialPeriods;
  if (!fp?.currentPeriodId) return null;
  return fp.periods[fp.currentPeriodId] ?? null;
}

export function selectPeriodTransactionCounts(state: AppState, periodId: string) {
  const [year, month] = periodId.split("-");
  const prefix = month ? `${year}-${month}` : year;
  return {
    sales: state.sales.filter((x) => x.date.startsWith(prefix)).length,
    purchases: state.purchases.filter((x) => x.date.startsWith(prefix)).length,
    receipts: state.receipts.filter((x) => x.date.startsWith(prefix)).length,
    payments: state.payments.filter((x) => x.date.startsWith(prefix)).length,
  };
}

export const selectVATLiability = (state: AppState, asOfDate: Date) =>
  state.sales.filter((s) => +new Date(s.date) <= +asOfDate).reduce((sum, s) => sum + s.vat, 0) -
  state.purchases.filter((p) => +new Date(p.date) <= +asOfDate).reduce((sum, p) => sum + p.vat, 0);

export const selectInventoryValue = (state: AppState) =>
  state.laptops.filter((l) => l.status !== "sold").reduce((sum, l) => sum + Number(l.cost || 0), 0);

export const selectRetainedEarnings = (state: AppState, asOfDate: Date) =>
  generateProfitLossReport(state, new Date(asOfDate.getFullYear(), 0, 1), asOfDate).netProfit;

export const selectMTDProfitSummary = (state: AppState) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const pl = generateProfitLossReport(state, start, now);
  return { revenue: pl.revenue.totalRevenue, cogs: pl.costOfGoodsSold.totalCOGS, grossProfit: pl.grossProfit, netProfit: pl.netProfit };
};

export const selectYTDProfitSummary = (state: AppState) => {
  const now = new Date();
  const pl = generateProfitLossReport(state, new Date(now.getFullYear(), 0, 1), now);
  return { revenue: pl.revenue.totalRevenue, cogs: pl.costOfGoodsSold.totalCOGS, grossProfit: pl.grossProfit, netProfit: pl.netProfit };
};

export function selectAverageMarginByGroup(
  state: AppState,
  groupBy: "supplier" | "lot" | "grade" | "model",
  period: { start: Date; end: Date }
): MarginBreakdown[] {
  const report = generateMarginReport(state, period.start, period.end);
  if (groupBy === "supplier") return report.bySupplier;
  if (groupBy === "lot") return report.byLot;
  if (groupBy === "grade") return report.byGrade;
  return report.byModel;
}

export const selectCostFrozenStatus = (
  state: AppState & { costTracking?: { unitCosts: Record<string, { costFrozenAt: string | null; totalCost: number }> } },
  laptopId: string
) => {
  const unit = state.costTracking?.unitCosts[laptopId];
  return { isFrozen: Boolean(unit?.costFrozenAt), frozenAt: unit?.costFrozenAt ?? null, totalCost: unit?.totalCost ?? 0 };
};
