import type { AppState } from "@/store/appState";
import {
  evaluateFinanceReadiness,
  type FinanceReadinessCheck,
  type FinanceReadinessSnapshot,
} from "@/utils/financeReadiness";
import {
  evaluateSessionMomentum,
  loadSessionHistory,
  summarizeSessionHistory,
  type LastSessionSummary,
} from "@/utils/sessionSummary";
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
  velocitySource: "default" | "session-tracker";
};

export type CompletionRoadmap = {
  generatedAt: string;
  overallPercent: number;
  financePercent: number;
  pendingAreaCount: number;
  pendingAreaKeys: string[];
  recommendedActions: CompletionRoadmapItem[];
  forecastToTarget: CompletionForecast;
};

const COMPLETION_AREA_TRIGGER_PERCENT = 90;
const FINANCE_TARGET_PERCENT = 95;
const DEFAULT_VELOCITY_PER_SPRINT = 3;

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

function estimateVelocityFromSessionHistory(history: LastSessionSummary[]): CompletionForecast["assumedVelocityPerSprint"] {
  if (history.length < 3) return DEFAULT_VELOCITY_PER_SPRINT;

  const normalized = [...history]
    .sort((a, b) => Date.parse(a.endedAt) - Date.parse(b.endedAt))
    .map((entry) => Math.max(0, Math.min(100, entry.completedPercent)));

  const deltas: number[] = [];
  for (let i = 1; i < normalized.length; i += 1) {
    deltas.push(normalized[i] - normalized[i - 1]);
  }

  const positiveDeltas = deltas.filter((delta) => delta > 0);
  if (positiveDeltas.length === 0) return DEFAULT_VELOCITY_PER_SPRINT;

  const averageGain = positiveDeltas.reduce((sum, delta) => sum + delta, 0) / positiveDeltas.length;
  return Math.max(1, Math.min(8, Number(averageGain.toFixed(2))));
}

function estimateSprintsRemaining(
  currentPercent: number,
  targetPercent: number,
  velocityPerSprint = DEFAULT_VELOCITY_PER_SPRINT,
  velocitySource: CompletionForecast["velocitySource"] = "default",
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
    velocitySource,
  };
}

type SessionTrackerSignal = {
  shouldRecommend: boolean;
  rationale: string;
};

function getSessionTrackerSignal(): SessionTrackerSignal {
  const history = loadSessionHistory();
  if (history.length < 2) {
    return {
      shouldRecommend: false,
      rationale: "",
    };
  }

  const stats = summarizeSessionHistory(history);
  const momentum = evaluateSessionMomentum(history);
  const averagePendingPercent = Math.max(0, 100 - stats.averageCompletionPercent);

  if (momentum.direction === "down" || averagePendingPercent >= 25) {
    return {
      shouldRecommend: true,
      rationale:
        momentum.direction === "down"
          ? `Session progress momentum is down (${momentum.deltaPercent}%). Focus on unresolved work queues and closure checklists.`
          : `Average pending work is ${averagePendingPercent}%. Use session tracker history to recover completion consistency.`,
    };
  }

  return {
    shouldRecommend: false,
    rationale: "",
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
  const pendingAreas = completion.areas.filter((area) => area.percent < COMPLETION_AREA_TRIGGER_PERCENT);

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

  if (pendingAreas.length >= 4) {
    actions.push({
      id: "pending-area-burn-down",
      title: "Execute coordinated pending-area burn-down sprint",
      area: "Program Delivery",
      priority: "P1",
      impactPoints: 7,
      rationale: `There are ${pendingAreas.length} completion areas below ${COMPLETION_AREA_TRIGGER_PERCENT}%. Run a focused cross-team burn-down sprint.`,
    });
  }

  const sessionTrackerSignal = getSessionTrackerSignal();
  if (sessionTrackerSignal.shouldRecommend) {
    actions.push({
      id: "session-progress-recovery",
      title: "Recover session completion trend using session progress tracker",
      area: "UX Guidance & Operator Safety",
      priority: "P1",
      impactPoints: 8,
      rationale: sessionTrackerSignal.rationale,
    });
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

  const sessionHistory = loadSessionHistory();
  const adaptiveVelocity = estimateVelocityFromSessionHistory(sessionHistory);
  const velocitySource: CompletionForecast["velocitySource"] =
    sessionHistory.length >= 3 && adaptiveVelocity !== DEFAULT_VELOCITY_PER_SPRINT ? "session-tracker" : "default";

  return {
    generatedAt: asOfDate.toISOString(),
    overallPercent: completion.overallPercent,
    financePercent: finance.scorePercent,
    pendingAreaCount: pendingAreas.length,
    pendingAreaKeys: pendingAreas.map((area) => area.key),
    recommendedActions,
    forecastToTarget: estimateSprintsRemaining(
      completion.overallPercent,
      FINANCE_TARGET_PERCENT,
      adaptiveVelocity,
      velocitySource,
    ),
  };
}
