import type { AppState } from "@/store/appState";
import { computeChecksum } from "@/utils/integrityChecker";
import { generateVatExceptionReport, generateVATReport } from "@/utils/reportGenerator";

export type VatSubmissionAuthority = "uae-fzta" | "generic-json";

export type VatSubmissionEnvelope = {
  submissionId: string;
  authority: VatSubmissionAuthority;
  generatedAt: string;
  submittedBy: string;
  period: {
    start: string;
    end: string;
  };
  payload: Record<string, unknown>;
  diagnostics: {
    issueCount: number;
    netVat: number;
  };
  acknowledgement: {
    status: "pending" | "acknowledged";
    acknowledgementRef: string | null;
    acknowledgedAt?: string;
  };
  integrity: {
    checksum: string;
    signature: string;
    signatureAlgorithm: "sha256";
  };
};

export type VatSubmissionAcknowledgement = {
  authority: VatSubmissionAuthority;
  acknowledgementRef: string;
  acceptedAt: string;
  reportedNetVat: number;
  reportedIssueCount?: number;
};

export type VatSubmissionReconciliation = {
  status: "matched" | "mismatch";
  differences: string[];
};

export type VatAcknowledgementProcessingResult = {
  acknowledgementRef: string;
  status: "matched" | "mismatch" | "error";
  differences: string[];
  error?: string;
};

export type VatAcknowledgementProcessingSummary = {
  total: number;
  matched: number;
  mismatched: number;
  errors: number;
  results: VatAcknowledgementProcessingResult[];
};

export type VatAcknowledgementIngestionResult = {
  accepted: VatSubmissionAcknowledgement[];
  rejected: Array<{
    index: number;
    reason: string;
  }>;
};

type VatSubmissionAdapter = (input: {
  vatReturn: ReturnType<typeof generateVATReport>;
  issueCount: number;
}) => Record<string, unknown>;

const adapters: Record<VatSubmissionAuthority, VatSubmissionAdapter> = {
  "generic-json": ({ vatReturn, issueCount }) => ({
    vatReturn,
    issueCount,
  }),
  "uae-fzta": ({ vatReturn, issueCount }) => ({
    taxpayerCountry: "AE",
    taxPeriodStart: vatReturn.periodStart,
    taxPeriodEnd: vatReturn.periodEnd,
    boxes: vatReturn.lines.map((box) => ({
      code: `BOX_${box.box}`,
      description: box.description,
      amount: box.amount,
    })),
    totals: {
      outputVat: vatReturn.outputVAT,
      inputVat: vatReturn.inputVAT,
      payableVat: vatReturn.netVAT,
    },
    diagnostics: {
      exceptionIssueCount: issueCount,
    },
  }),
};

export async function buildVatSubmissionEnvelope(
  state: AppState,
  periodStart: Date,
  periodEnd: Date,
  authority: VatSubmissionAuthority,
  submittedBy = "system"
): Promise<VatSubmissionEnvelope> {
  const vatReturn = generateVATReport(state, periodStart, periodEnd);
  const issueCount = generateVatExceptionReport(state, periodStart, periodEnd).issueCount;

  const payload = adapters[authority]({ vatReturn, issueCount });

  const checksum = await computeChecksum(payload);
  const signature = await computeChecksum({
    checksum,
    authority,
    submittedBy,
    periodStart: vatReturn.periodStart,
    periodEnd: vatReturn.periodEnd,
  });

  return {
    submissionId: crypto.randomUUID(),
    authority,
    generatedAt: new Date().toISOString(),
    submittedBy,
    period: {
      start: vatReturn.periodStart,
      end: vatReturn.periodEnd,
    },
    payload,
    diagnostics: {
      issueCount,
      netVat: vatReturn.netVAT,
    },
    acknowledgement: {
      status: "pending",
      acknowledgementRef: null,
    },
    integrity: {
      checksum,
      signature,
      signatureAlgorithm: "sha256",
    },
  };
}

export function applyVatSubmissionAcknowledgement(
  envelope: VatSubmissionEnvelope,
  acknowledgement: VatSubmissionAcknowledgement
): VatSubmissionEnvelope {
  if (envelope.authority !== acknowledgement.authority) {
    throw new Error(`Acknowledgement authority mismatch: expected ${envelope.authority}, got ${acknowledgement.authority}`);
  }

  return {
    ...envelope,
    acknowledgement: {
      status: "acknowledged",
      acknowledgementRef: acknowledgement.acknowledgementRef,
      acknowledgedAt: acknowledgement.acceptedAt,
    },
  };
}

export function reconcileVatSubmissionAcknowledgement(
  envelope: VatSubmissionEnvelope,
  acknowledgement: VatSubmissionAcknowledgement
): VatSubmissionReconciliation {
  const differences: string[] = [];

  if (envelope.authority !== acknowledgement.authority) {
    differences.push("authority");
  }

  if (Math.abs(envelope.diagnostics.netVat - acknowledgement.reportedNetVat) > 0.01) {
    differences.push("netVat");
  }

  if (
    typeof acknowledgement.reportedIssueCount === "number" &&
    envelope.diagnostics.issueCount !== acknowledgement.reportedIssueCount
  ) {
    differences.push("issueCount");
  }

  return {
    status: differences.length === 0 ? "matched" : "mismatch",
    differences,
  };
}

export function processVatAcknowledgements(
  envelope: VatSubmissionEnvelope,
  acknowledgements: VatSubmissionAcknowledgement[]
): VatAcknowledgementProcessingSummary {
  const results: VatAcknowledgementProcessingResult[] = acknowledgements.map((ack) => {
    try {
      const reconciliation = reconcileVatSubmissionAcknowledgement(envelope, ack);
      return {
        acknowledgementRef: ack.acknowledgementRef,
        status: reconciliation.status,
        differences: reconciliation.differences,
      };
    } catch (error) {
      return {
        acknowledgementRef: ack.acknowledgementRef,
        status: "error",
        differences: [],
        error: error instanceof Error ? error.message : "Unknown acknowledgement processing error",
      };
    }
  });

  const matched = results.filter((result) => result.status === "matched").length;
  const mismatched = results.filter((result) => result.status === "mismatch").length;
  const errors = results.filter((result) => result.status === "error").length;

  return {
    total: acknowledgements.length,
    matched,
    mismatched,
    errors,
    results,
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function hasValidAuthority(value: unknown): value is VatSubmissionAuthority {
  return value === "uae-fzta" || value === "generic-json";
}

export function parseVatSubmissionAcknowledgement(input: unknown): VatSubmissionAcknowledgement {
  const raw = toRecord(input);
  if (!raw) {
    throw new Error("Acknowledgement payload must be an object");
  }

  const authority = raw.authority;
  const acknowledgementRef = raw.acknowledgementRef;
  const acceptedAt = raw.acceptedAt;
  const reportedNetVat = raw.reportedNetVat;
  const reportedIssueCount = raw.reportedIssueCount;

  if (!hasValidAuthority(authority)) {
    throw new Error("Invalid acknowledgement authority");
  }
  if (typeof acknowledgementRef !== "string" || acknowledgementRef.trim().length === 0) {
    throw new Error("Invalid acknowledgement reference");
  }
  if (typeof acceptedAt !== "string" || Number.isNaN(new Date(acceptedAt).getTime())) {
    throw new Error("Invalid acknowledgement acceptedAt");
  }
  if (typeof reportedNetVat !== "number" || Number.isNaN(reportedNetVat)) {
    throw new Error("Invalid acknowledgement reportedNetVat");
  }
  if (typeof reportedIssueCount !== "undefined" && (typeof reportedIssueCount !== "number" || Number.isNaN(reportedIssueCount))) {
    throw new Error("Invalid acknowledgement reportedIssueCount");
  }

  return {
    authority,
    acknowledgementRef,
    acceptedAt,
    reportedNetVat,
    reportedIssueCount,
  };
}

export function ingestVatSubmissionAcknowledgements(rawInputs: unknown[]): VatAcknowledgementIngestionResult {
  const accepted: VatSubmissionAcknowledgement[] = [];
  const rejected: Array<{ index: number; reason: string }> = [];

  rawInputs.forEach((raw, index) => {
    try {
      accepted.push(parseVatSubmissionAcknowledgement(raw));
    } catch (error) {
      rejected.push({
        index,
        reason: error instanceof Error ? error.message : "Unknown acknowledgement ingestion error",
      });
    }
  });

  return {
    accepted,
    rejected,
  };
}
