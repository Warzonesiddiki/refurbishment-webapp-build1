import { evaluateFinanceReadiness } from "@/utils/financeReadiness";
import type { AppState } from "@/store/appState";

export type CompletionArea = {
  key: string;
  label: string;
  weight: number;
  percent: number;
  details: string;
};

export type ProjectCompletionSnapshot = {
  generatedAt: string;
  overallPercent: number;
  weightedPoints: number;
  totalWeight: number;
  areas: CompletionArea[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Number(value.toFixed(2))));

export function evaluateProjectCompletion(state: AppState, asOfDate = new Date()): ProjectCompletionSnapshot {
  const finance = evaluateFinanceReadiness(state, asOfDate);

  const areas: CompletionArea[] = [
    { key: "platform", label: "Platform & Tooling", weight: 15, percent: 90, details: "Typecheck/tests/build/tooling baseline is operational." },
    { key: "runtime", label: "Runtime Security & Auth", weight: 15, percent: 86, details: "Java auth hardening, telemetry, throttling, and payload guards are implemented." },
    { key: "core-modules", label: "Core ERP Modules", weight: 20, percent: 82, details: "Inventory, sales, purchases, WIP, finance, and reporting workflows are in place." },
    { key: "backup-restore", label: "Backup / Restore Reliability", weight: 15, percent: 80, details: "Validation, preview, scoped restore, and warning surfaces are implemented." },
    { key: "finance-parity", label: "Finance Accounting Parity", weight: 20, percent: finance.scorePercent, details: `Derived from finance readiness checks (${finance.scorePercent}%).` },
    { key: "ux-guidance", label: "UX Guidance & Operator Safety", weight: 10, percent: 84, details: "Contextual hints and guided flows are available across major pages." },
    { key: "deployment-ops", label: "Deployment & Local Ops", weight: 5, percent: 86, details: "Docker/bootstrap/local launcher and Java service wiring are available." },
  ];

  const totalWeight = areas.reduce((sum, area) => sum + area.weight, 0);
  const weightedPoints = clamp(areas.reduce((sum, area) => sum + area.weight * clamp(area.percent), 0) / totalWeight);

  return {
    generatedAt: asOfDate.toISOString(),
    overallPercent: weightedPoints,
    weightedPoints,
    totalWeight,
    areas,
  };
}
