import type { AppState } from "@/store/appState";
import {
  evaluateFinanceReadiness,
  type FinanceReadinessCheck,
  type FinanceReadinessSnapshot,
} from "@/utils/financeReadiness";
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

const COMPLETION_AREA_TRIGGER_PERCENT = 90;
const FINANCE_TARGET_PERCENT = 95;

type CompletionAreaRecommendation = Omit<CompletionRoadmapItem, "area"> & { areaKey: string };

const completionAreaRecommendationCatalog: CompletionAreaRecommendation[] = [
  {
    id: "platform-quality-gate",
    title: "Harden platform quality gates for release confidence",
    areaKey: "platform",
    priority: "P1",
    impactPoints: 6,
    rationale: "Stabilize lint/type/test quality gates to keep delivery speed high without regressions.",
  },
  {
    id: "runtime-observability",
    title: "Increase runtime observability and release telemetry hooks",
    areaKey: "runtime",
    priority: "P1",
    impactPoints: 7,
    rationale: "Structured error and release diagnostics reduce blind spots during production incident triage.",
  },
  {
    id: "core-module-workflow-completion",
    title: "Close remaining cross-module workflow and reconciliation gaps",
    areaKey: "core-modules",
    priority: "P1",
    impactPoints: 7,
    rationale: "Core module parity is needed so end-to-end operations stay consistent across inventory, WIP, sales, and finance.",
  },
  {
    id: "restore-rehearsal-suite",
    title: "Expand restore rehearsal coverage into browser end-to-end flows",
    areaKey: "backup-restore",
    priority: "P1",
    impactPoints: 7,
    rationale: "Integration checks exist, but browser-driven restore drills are still needed for release confidence.",
  },
  {
    id: "workflow-onboarding-checklists",
    title: "Finish onboarding/checklist coverage across modules",
    areaKey: "ux-guidance",
    priority: "P2",
    impactPoints: 5,
    rationale: "Guided first-run and go-live checklists reduce operator mistakes on rarely used flows.",
  },
  {
    id: "deployment-bootstrap-verification",
    title: "Strengthen deployment/bootstrap verification checks",
    areaKey: "deployment-ops",
    priority: "P2",
    impactPoints: 4,
    rationale: "Repeatable local/prod bootstrap checks reduce release-day environment surprises.",
  },
];

type FinanceRecommendation = Omit<CompletionRoadmapItem, "area"> & {
  checkKey?: FinanceReadinessCheck["key"];
  minScoreExclusive?: number;
};

const financeRecommendationCatalog: FinanceRecommendation[] = [
  {
    id: "ledger-trial-balance-guard",
    title: "Implement blocking trial-balance guard",
    priority: "P0",
    impactPoints: 9,
    rationale: "Balance mismatch is the highest-risk issue for month-end confidence and reporting integrity.",
    checkKey: "trial-balance",
  },
  {
    id: "receivables-overrun-controls",
    title: "Add receivables over-collection guardrails",
    priority: "P0",
    impactPoints: 8,
    rationale: "Receipts beyond invoiced totals indicate reconciliation drift and customer ledger risk.",
    checkKey: "receivables-control",
  },
  {
    id: "payables-overpayment-controls",
    title: "Add payable overpayment controls",
    priority: "P0",
    impactPoints: 7,
    rationale: "Overpayment handling should be explicit (credit notes / prepayments) to avoid hidden liabilities.",
    checkKey: "payables-control",
  },
  {
    id: "period-close-workflow",
    title: "Finalize period close workflow with role gates",
    priority: "P1",
    impactPoints: 8,
    rationale: "A formal close process is required for repeatable production finance operations.",
    minScoreExclusive: FINANCE_TARGET_PERCENT,
  },
  {
    id: "tax-filing-evidence-pack",
    title: "Implement VAT filing evidence exports",
    priority: "P2",
    impactPoints: 8,
    rationale: "Tax operations need period-locked exports and exception evidence for auditability.",
    checkKey: "vat-coverage",
  },
];

function hasFailedFinanceCheck(finance: FinanceReadinessSnapshot, checkKey: FinanceReadinessCheck["key"]): boolean {
  return finance.checks.some((check) => check.key === checkKey && !check.passed);
}

function estimateSprintsRemaining(
  currentPercent: number,
  targetPercent: number,
  velocityPerSprint = 3,
): CompletionForecast {
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

const priorityRank: Record<CompletionRoadmapItem["priority"], number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

export function buildCompletionRoadmap(state: AppState, asOfDate = new Date()): CompletionRoadmap {
  const completion = evaluateProjectCompletion(state, asOfDate);
  const finance = evaluateFinanceReadiness(state, asOfDate);

  const actions: CompletionRoadmapItem[] = [];
  const completionAreas = new Map(completion.areas.map((area) => [area.key, area]));

  for (const recommendation of financeRecommendationCatalog) {
    const failedCheck = recommendation.checkKey ? hasFailedFinanceCheck(finance, recommendation.checkKey) : false;
    const scoreBelowThreshold =
      recommendation.minScoreExclusive !== undefined ? finance.scorePercent < recommendation.minScoreExclusive : false;

    if (failedCheck || scoreBelowThreshold) {
      actions.push({
        id: recommendation.id,
        title: recommendation.title,
        area: "Finance Accounting Parity",
        priority: recommendation.priority,
        impactPoints: recommendation.impactPoints,
        rationale: recommendation.rationale,
      });
    }
  }

  for (const recommendation of completionAreaRecommendationCatalog) {
    const area = completionAreas.get(recommendation.areaKey);
    if (area && area.percent < COMPLETION_AREA_TRIGGER_PERCENT) {
      actions.push({
        id: recommendation.id,
        title: recommendation.title,
        area: area.label,
        priority: recommendation.priority,
        impactPoints: recommendation.impactPoints,
        rationale: recommendation.rationale,
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      id: "maintain-readiness",
      title: "Maintain readiness with release smoke + restore rehearsal in CI",
      area: "Sustainability",
      priority: "P2",
      impactPoints: 3,
      rationale: "All weighted checkpoints are passing; keep automated guardrails green to preserve completion levels.",
    });
  }

  const recommendedActions = Array.from(new Map(actions.map((item) => [item.id, item])).values())
    .sort((a, b) => {
      const impactDelta = b.impactPoints - a.impactPoints;
      if (impactDelta !== 0) return impactDelta;
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 6);

  return {
    generatedAt: asOfDate.toISOString(),
    overallPercent: completion.overallPercent,
    financePercent: finance.scorePercent,
    recommendedActions,
    forecastToTarget: estimateSprintsRemaining(completion.overallPercent, FINANCE_TARGET_PERCENT, 3),
  };
}
