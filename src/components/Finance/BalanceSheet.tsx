import type { BalanceSheet as BalanceSheetType } from "@/store/types/ReportTypes";

export function BalanceSheet({ report }: { report: BalanceSheetType }) {
  return <div className="glass-card p-4"><h2 className="font-bold">Balance Sheet</h2><div>Total Assets: {report.assets.totalAssets}</div><div>Total Liabilities: {report.liabilities.totalLiabilities}</div><div>Total Equity: {report.equity.totalEquity}</div><div>{report.balanceCheck ? "✅ Balanced" : "⚠️ Not balanced"}</div></div>;
}
