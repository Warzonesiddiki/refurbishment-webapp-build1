import type { ProfitLossReport } from "@/store/types/ReportTypes";

export function ProfitLoss({ report }: { report: ProfitLossReport }) {
  return <div className="glass-card p-4"><h2 className="font-bold">Profit & Loss</h2><div>Revenue: {report.revenue.totalRevenue}</div><div>COGS: {report.costOfGoodsSold.totalCOGS}</div><div>Net Profit: {report.netProfit}</div></div>;
}
