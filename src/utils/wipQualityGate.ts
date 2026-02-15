import type { WipRecord } from "@/store/appState";

export type QualityGateResult = {
  canComplete: boolean;
  checks: { label: string; pass: boolean }[];
};

export function evaluateWipCompletionGate(wip: WipRecord): QualityGateResult {
  const checks = [
    { label: "Diagnosis notes captured", pass: wip.diagnosisNotes.trim().length > 0 },
    { label: "At least one approved labor entry", pass: wip.laborEntries.some((entry) => entry.approved !== false) },
    { label: "At least one part or replacement recorded", pass: wip.parts.length > 0 },
  ];

  return {
    checks,
    canComplete: checks.every((check) => check.pass),
  };
}
