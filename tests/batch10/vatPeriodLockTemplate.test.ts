import { describe, expect, it } from "vitest";
import { buildVatPeriodLockEvidenceTemplate } from "@/utils/vatEvidence";

describe("buildVatPeriodLockEvidenceTemplate", () => {
  it("creates a checklist template with required VAT period-lock sections", () => {
    const template = buildVatPeriodLockEvidenceTemplate(new Date("2026-01-01"), new Date("2026-01-31"));

    expect(template.sections.length).toBeGreaterThanOrEqual(4);
    expect(template.sections.every((section) => section.required)).toBe(true);
    expect(template.sections.some((section) => section.id === "vat-box-mapping-review")).toBe(true);
    expect(template.declaration.preparedBy).toBe("");
    expect(template.snapshot).toBeNull();
  });

  it("captures report snapshot metrics when provided", () => {
    const template = buildVatPeriodLockEvidenceTemplate(new Date("2026-01-01"), new Date("2026-01-31"), {
      issueCount: 2,
      outputVat: 1250,
      inputVat: 500,
      netVatPayable: 750,
      boxCount: 5,
    });

    expect(template.snapshot).toEqual({
      issueCount: 2,
      outputVat: 1250,
      inputVat: 500,
      netVatPayable: 750,
      boxCount: 5,
    });
  });
});
