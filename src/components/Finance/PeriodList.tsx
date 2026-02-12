import type { FinancialPeriod } from "@/store/types/FinancialPeriodTypes";

export function PeriodList({ periods }: { periods: FinancialPeriod[] }) {
  return <ul>{periods.map((p) => <li key={p.id}>{p.name} - {p.status}</li>)}</ul>;
}
