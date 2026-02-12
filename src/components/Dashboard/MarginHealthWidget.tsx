export function MarginHealthWidget({ averageMargin, belowThreshold, topPerformer, worstPerformer }: { averageMargin: number; belowThreshold: number; topPerformer: string; worstPerformer: string }) {
  return <div className="glass-card p-4"><h3>Margin Health</h3><div>Avg {averageMargin}%</div><div>Low margins {belowThreshold}</div><div>Top {topPerformer}</div><div>Worst {worstPerformer}</div></div>;
}
