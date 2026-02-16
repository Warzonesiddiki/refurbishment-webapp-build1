import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { buildVatFilingEvidencePackage } from "@/utils/vatEvidence";

describe("buildVatFilingEvidencePackage", () => {
  it("builds signed VAT filing evidence package", async () => {
    const state = createInitialState();

    const evidence = await buildVatFilingEvidencePackage(state, new Date("2026-01-01"), new Date("2026-01-31"), "auditor");

    expect(evidence.preparedBy).toBe("auditor");
    expect(evidence.integrity.signatureAlgorithm).toBe("sha256");
    expect(evidence.integrity.checksum).toBeTruthy();
    expect(evidence.integrity.signature).toBeTruthy();
    expect(evidence.evidenceId).toBeTruthy();
  });
});
