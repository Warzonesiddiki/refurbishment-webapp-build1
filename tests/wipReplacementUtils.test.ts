import { describe, expect, it } from "vitest";
import {
  buildHarvestedPartName,
  calculateReplacementNetCost,
  normalizeReplacementDestination,
  sanitizeReplacementDraft,
} from "@/utils/wipReplacement";

describe("wipReplacement utils", () => {
  it("normalizes destination and trims replacement draft", () => {
    const draft = sanitizeReplacementDraft({
      installedPartBarcode: "  P-123  ",
      removedName: " 8GB DDR4 ",
      removedComponent: " RAM ",
      removedSpec: " 2666MHz ",
      removedCondition: " Used ",
      removedSerial: " RM-09 ",
      estimatedValue: 0,
      destination: "unknown",
    });

    expect(draft.installedPartBarcode).toBe("P-123");
    expect(draft.removedName).toBe("8GB DDR4");
    expect(draft.destination).toBe("Harvest QA Bin");
    expect(draft.estimatedValue).toBeUndefined();
  });

  it("builds harvested part display name and replacement net cost", () => {
    expect(buildHarvestedPartName(" 256GB SSD ")).toBe("256GB SSD (Harvested)");
    expect(calculateReplacementNetCost(40, 10)).toBe(30);
    expect(calculateReplacementNetCost(20, 50)).toBe(0);
  });

  it("keeps explicit scrap destination", () => {
    expect(normalizeReplacementDestination("Scrap Bin")).toBe("Scrap Bin");
  });
});
