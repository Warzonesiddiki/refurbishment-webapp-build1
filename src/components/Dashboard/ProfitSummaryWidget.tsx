export function ProfitSummaryWidget({ revenue, cogs, grossProfit, netProfit }: { revenue: number; cogs: number; grossProfit: number; netProfit: number }) {
  return <div className="glass-card p-4"><h3>MTD Profit</h3><div>Revenue {revenue}</div><div>COGS {cogs}</div><div>Gross {grossProfit}</div><div>Net {netProfit}</div></div>;
}
