import type { MarginReport as MarginReportType } from "@/store/types/ReportTypes";

export function MarginReport({ report }: { report: MarginReportType }) {
  return <div className="glass-card p-4"><h2 className="font-bold">Margin Analysis</h2><div>Overall Margin: {report.overall.marginPercent}%</div><table><tbody>{report.bySupplier.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.marginPercent}%</td></tr>)}</tbody></table></div>;
}
