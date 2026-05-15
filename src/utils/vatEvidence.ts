import type { AppState } from "@/store/appState";
import { computeChecksum } from "@/utils/integrityChecker";
import { generateTaxationSummary, generateVATReport, generateVatExceptionReport } from "@/utils/reportGenerator";

export type VatFilingEvidencePackage = {
  evidenceId: string;
  generatedAt: string;
  preparedBy: string;
  period: {
    start: string;
    end: string;
  };
  taxationSummary: ReturnType<typeof generateTaxationSummary>;
  vatReturn: ReturnType<typeof generateVATReport>;
  exceptions: ReturnType<typeof generateVatExceptionReport>;
  integrity: {
    checksum: string;
    signature: string;
    signatureAlgorithm: "sha256";
  };
};

export async function buildVatFilingEvidencePackage(
  state: AppState,
  periodStart: Date,
  periodEnd: Date,
  preparedBy = "system"
): Promise<VatFilingEvidencePackage> {
  const taxationSummary = generateTaxationSummary(state, periodStart, periodEnd);
  const vatReturn = generateVATReport(state, periodStart, periodEnd);
  const exceptions = generateVatExceptionReport(state, periodStart, periodEnd);

  const payload = {
    taxationSummary,
    vatReturn,
    exceptions,
  };

  const checksum = await computeChecksum(payload);
  const signature = await computeChecksum({
    checksum,
    preparedBy,
    periodStart: taxationSummary.periodStart,
    periodEnd: taxationSummary.periodEnd,
    issueCount: exceptions.issueCount,
  });

  return {
    evidenceId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    preparedBy,
    period: {
      start: taxationSummary.periodStart,
      end: taxationSummary.periodEnd,
    },
    taxationSummary,
    vatReturn,
    exceptions,
    integrity: {
      checksum,
      signature,
      signatureAlgorithm: "sha256",
    },
  };
}

export type VatPeriodLockEvidenceTemplate = {
  templateId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  sections: Array<{
    id: string;
    title: string;
    required: boolean;
    guidance: string;
    evidenceRef: string | null;
    completed: boolean;
  }>;
  declaration: {
    preparedBy: string;
    reviewedBy: string | null;
    approvedBy: string | null;
    approvalDate: string | null;
  };
  snapshot: {
    issueCount: number;
    outputVat: number;
    inputVat: number;
    netVatPayable: number;
    boxCount: number;
  } | null;
};

export type VatPeriodLockEvidenceSnapshot = {
  issueCount: number;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  boxCount: number;
};

export function buildVatPeriodLockEvidenceTemplate(
  periodStart: Date,
  periodEnd: Date,
  snapshot: VatPeriodLockEvidenceSnapshot | null = null
): VatPeriodLockEvidenceTemplate {
  return {
    templateId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    sections: [
      {
        id: "vat-box-mapping-review",
        title: "VAT box mapping review",
        required: true,
        guidance: "Attach VAT box mapping detail and confirm each box ties to source transactions.",
        evidenceRef: null,
        completed: false,
      },
      {
        id: "vat-exception-resolution",
        title: "VAT exception resolution",
        required: true,
        guidance: "Attach exception report and remediation notes for all outstanding anomalies.",
        evidenceRef: null,
        completed: false,
      },
      {
        id: "vat-return-approval",
        title: "VAT return approval",
        required: true,
        guidance: "Attach signed VAT return approval prior to locking the filing period.",
        evidenceRef: null,
        completed: false,
      },
      {
        id: "filing-reference",
        title: "Filing reference + payment evidence",
        required: true,
        guidance: "Record filing reference and payment or reclaim confirmation evidence.",
        evidenceRef: null,
        completed: false,
      },
    ],
    declaration: {
      preparedBy: "",
      reviewedBy: null,
      approvedBy: null,
      approvalDate: null,
    },
    snapshot,
  };
}
