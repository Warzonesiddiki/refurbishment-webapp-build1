import type { AppState } from "@/store/appState";
import { buildTrialBalanceSnapshot } from "@/utils/trialBalance";

export type FinanceReadinessCheck = {
  key: string;
  label: string;
  weight: number;
  passed: boolean;
  details: string;
};

export type FinanceReadinessSnapshot = {
  asOf: string;
  scorePercent: number;
  passedWeight: number;
  totalWeight: number;
  checks: FinanceReadinessCheck[];
};

function round2(n: number) {
  return Number(n.toFixed(2));
}

export function evaluateFinanceReadiness(state: AppState, asOfDate = new Date()): FinanceReadinessSnapshot {
  const trialBalance = buildTrialBalanceSnapshot(state, asOfDate);
  const totalSales = state.sales.reduce((sum, s) => sum + s.total, 0);
  const totalReceipts = state.receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalPurchases = state.purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPayments = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const ownerBalance = state.ownerEntries[state.ownerEntries.length - 1]?.balance ?? 0;
  const vatTransactionCoverage = state.sales.length + state.purchases.length > 0
    ? [...state.sales.map((s) => s.vat), ...state.purchases.map((p) => p.vat)].every((vat) => Number.isFinite(vat))
    : true;

  const checks: FinanceReadinessCheck[] = [
    {
      key: "trial-balance",
      label: "Trial balance consistency",
      weight: 30,
      passed: trialBalance.isBalanced,
      details: trialBalance.isBalanced
        ? `Debits ${round2(trialBalance.debitTotal)} match credits ${round2(trialBalance.creditTotal)}.`
        : `Trial balance difference ${round2(trialBalance.difference)} exceeds tolerance ${trialBalance.tolerance}.`,
    },
    {
      key: "owner-capital",
      label: "Owner capital non-negative",
      weight: 15,
      passed: ownerBalance >= 0,
      details: `Latest owner balance = ${round2(ownerBalance)}.`,
    },
    {
      key: "receivables-control",
      label: "Receivables within expected bounds",
      weight: 20,
      passed: totalReceipts <= totalSales,
      details: `Receipts ${round2(totalReceipts)} vs sales ${round2(totalSales)}.`,
    },
    {
      key: "payables-control",
      label: "Payables within expected bounds",
      weight: 20,
      passed: totalPayments <= totalPurchases,
      details: `Payments ${round2(totalPayments)} vs purchases ${round2(totalPurchases)}.`,
    },
    {
      key: "vat-coverage",
      label: "VAT values present for taxable docs",
      weight: 15,
      passed: vatTransactionCoverage,
      details: vatTransactionCoverage ? "VAT amounts are numeric for current sales/purchases." : "Non-numeric VAT found in transactions.",
    },
  ];

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passedWeight = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);

  return {
    asOf: asOfDate.toISOString(),
    scorePercent: round2((passedWeight / totalWeight) * 100),
    passedWeight,
    totalWeight,
    checks,
  };
}
