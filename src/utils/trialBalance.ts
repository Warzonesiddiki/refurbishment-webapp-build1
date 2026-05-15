import type { AppState } from "@/store/appState";
import { generateBalanceSheet } from "@/utils/reportGenerator";

export type TrialBalanceSnapshot = {
  asOfDate: string;
  debitTotal: number;
  creditTotal: number;
  difference: number;
  tolerance: number;
  isBalanced: boolean;
};

function round2(n: number) {
  return Number(n.toFixed(2));
}

export function buildTrialBalanceSnapshot(state: AppState, asOfDate = new Date(), tolerance = 0.01): TrialBalanceSnapshot {
  const balanceSheet = generateBalanceSheet(state, asOfDate);
  const debitTotal = round2(balanceSheet.assets.totalAssets);
  const creditTotal = round2(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity);
  const difference = round2(debitTotal - creditTotal);

  return {
    asOfDate: asOfDate.toISOString(),
    debitTotal,
    creditTotal,
    difference,
    tolerance,
    isBalanced: Math.abs(difference) <= tolerance,
  };
}
