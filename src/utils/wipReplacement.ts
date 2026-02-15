export const REPLACEMENT_DESTINATIONS = ["Harvest QA Bin", "Scrap Bin"] as const;

export type ReplacementDestination = (typeof REPLACEMENT_DESTINATIONS)[number];

export type WipReplacementDraft = {
  installedPartBarcode: string;
  removedName: string;
  removedComponent: string;
  removedSpec?: string;
  removedCondition?: string;
  estimatedValue?: number;
  removedSerial?: string;
  destination?: string;
};

export function normalizeReplacementDestination(input?: string): ReplacementDestination {
  if (input === "Scrap Bin") return "Scrap Bin";
  return "Harvest QA Bin";
}

export function buildHarvestedPartName(removedName: string): string {
  return `${removedName.trim()} (Harvested)`;
}

export function sanitizeReplacementDraft(draft: WipReplacementDraft): WipReplacementDraft {
  return {
    ...draft,
    installedPartBarcode: draft.installedPartBarcode.trim(),
    removedName: draft.removedName.trim(),
    removedComponent: draft.removedComponent.trim(),
    removedSpec: draft.removedSpec?.trim() || undefined,
    removedCondition: draft.removedCondition?.trim() || undefined,
    removedSerial: draft.removedSerial?.trim() || undefined,
    destination: normalizeReplacementDestination(draft.destination),
    estimatedValue: draft.estimatedValue && draft.estimatedValue > 0 ? draft.estimatedValue : undefined,
  };
}

export function calculateReplacementNetCost(installedCost: number, estimatedRecoveredValue?: number): number {
  const recovered = Math.max(0, estimatedRecoveredValue ?? 0);
  return Math.max(0, Math.max(0, installedCost) - recovered);
}
