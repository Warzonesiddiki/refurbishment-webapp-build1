import type { AppState } from "@/store/appState";
import { evaluateFinanceReadiness } from "@/utils/financeReadiness";
import { evaluateProjectCompletion } from "@/utils/projectCompletion";

export type CompletionRoadmapItem = {
  id: string;
  title: string;
  area: string;
  priority: "P0" | "P1" | "P2";
  impactPoints: number;
  rationale: string;
};

export type CompletionForecast = {
  targetPercent: number;
  currentPercent: number;
  gapPercent: number;
  estimatedSprintsRemaining: number;
  assumedVelocityPerSprint: number;
};

export type CompletionRoadmap = {
  generatedAt: string;
  overallPercent: number;
  financePercent: number;
  recommendedActions: CompletionRoadmapItem[];
  forecastToTarget: CompletionForecast;
};

function estimateSprintsRemaining(currentPercent: number, targetPercent: number, velocityPerSprint = 3): CompletionForecast {
  const safeVelocity = Math.max(1, velocityPerSprint);
  const gapPercent = Math.max(0, Number((targetPercent - currentPercent).toFixed(2)));
  const estimatedSprintsRemaining = gapPercent === 0 ? 0 : Math.ceil(gapPercent / safeVelocity);
  return {
    targetPercent,
    currentPercent,
    gapPercent,
    estimatedSprintsRemaining,
    assumedVelocityPerSprint: safeVelocity,
  };
}

export function buildCompletionRoadmap(state: AppState, asOfDate = new Date()): CompletionRoadmap {
  const completion = evaluateProjectCompletion(state, asOfDate);
  const finance = evaluateFinanceReadiness(state, asOfDate);

  const actions: CompletionRoadmapItem[] = [];

  if (finance.checks.some((check) => !check.passed && check.key === "trial-balance")) {
    actions.push({
      id: "ledger-trial-balance-guard",
      title: "Implement blocking trial-balance guard",
      area: "Finance Accounting Parity",
      priority: "P0",
      impactPoints: 9,
      rationale: "Balance mismatch is the highest-risk issue for month-end confidence and reporting integrity.",
    });
  }

  if (finance.checks.some((check) => !check.passed && check.key === "receivables-control")) {
    actions.push({
      id: "receivables-overrun-controls",
      title: "Add receivables over-collection guardrails",
      area: "Finance Accounting Parity",
      priority: "P0",
      impactPoints: 8,
      rationale: "Receipts beyond invoiced totals indicate reconciliation drift and customer ledger risk.",
    });
  }

  if (finance.checks.some((check) => !check.passed && check.key === "payables-control")) {
    actions.push({
      id: "payables-overpayment-controls",
      title: "Add payable overpayment controls",
      area: "Finance Accounting Parity",
      priority: "P0",
      impactPoints: 7,
      rationale: "Overpayment handling should be explicit (credit notes / prepayments) to avoid hidden liabilities.",
    });
  }

  actions.push(
    {
      id: "period-close-workflow",
      title: "Finalize period close workflow with role gates",
      area: "Finance Accounting Parity",
      priority: "P1",
      impactPoints: 8,
      rationale: "A formal close process is required for repeatable production finance operations.",
    },
    {
      id: "restore-rehearsal-suite",
      title: "Add end-to-end backup restore rehearsal suite",
      area: "Backup / Restore Reliability",
      priority: "P1",
      impactPoints: 7,
      rationale: "Production confidence requires proving backup reset/restore invariants on realistic snapshots.",
    },
    {
      id: "tax-filing-evidence-pack",
      title: "Implement VAT filing evidence exports",
      area: "Finance Accounting Parity",
      priority: "P2",
      impactPoints: 6,
      rationale: "Tax operations need period-locked exports and exception evidence for auditability.",
    },
    {
      id: "close-readiness-dashboard",
      title: "Expose completion and finance readiness in an admin dashboard",
      area: "UX Guidance & Operator Safety",
      priority: "P2",
      impactPoints: 5,
      rationale: "Operational teams should be able to track readiness and forecast in-product without reading docs.",
    }
  );

  const recommendedActions = actions.sort((a, b) => b.impactPoints - a.impactPoints).slice(0, 6);

  return {
    generatedAt: asOfDate.toISOString(),
    overallPercent: completion.overallPercent,
    financePercent: finance.scorePercent,
    recommendedActions,
    forecastToTarget: estimateSprintsRemaining(completion.overallPercent, 95, 3),
  };
}
