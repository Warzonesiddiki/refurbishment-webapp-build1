import type { WipRecord } from "@/store/appState";
import { evaluateWipCompletionGate } from "@/utils/wipQualityGate";

export type WipQualityAnalytics = {
  readyToComplete: number;
  pendingLaborApproval: number;
  approvedLaborRatePct: number;
};

export function computeWipQualityAnalytics(wipJobs: WipRecord[]): WipQualityAnalytics {
  const readyToComplete = wipJobs.filter((job) => evaluateWipCompletionGate(job).canComplete).length;
  const allLabor = wipJobs.flatMap((job) => job.laborEntries);
  const approvedLabor = allLabor.filter((entry) => entry.approved !== false).length;
  const pendingLaborApproval = allLabor.filter((entry) => entry.approved === false).length;
  const approvedLaborRatePct = allLabor.length > 0 ? Math.round((approvedLabor / allLabor.length) * 100) : 100;

  return {
    readyToComplete,
    pendingLaborApproval,
    approvedLaborRatePct,
  };
}
