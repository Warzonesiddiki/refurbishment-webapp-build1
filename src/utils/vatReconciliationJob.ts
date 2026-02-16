import {
  applyVatSubmissionAcknowledgement,
  ingestVatSubmissionAcknowledgements,
  processVatAcknowledgements,
  type VatAcknowledgementProcessingSummary,
  type VatSubmissionAcknowledgement,
  type VatSubmissionEnvelope,
} from "@/utils/vatSubmission";

export type VatReconciliationJobReport = {
  runId: string;
  generatedAt: string;
  authority: VatSubmissionEnvelope["authority"];
  baseline: {
    submissionId: string;
    netVat: number;
    issueCount: number;
  };
  summary: VatAcknowledgementProcessingSummary;
  ingestion: {
    accepted: number;
    rejected: number;
    rejectedRecords: Array<{
      index: number;
      reason: string;
    }>;
  };
  latestAcknowledgedEnvelope: VatSubmissionEnvelope | null;
  alerts: string[];
};

export function runVatAcknowledgementReconciliationJob(
  envelope: VatSubmissionEnvelope,
  acknowledgements: VatSubmissionAcknowledgement[]
): VatReconciliationJobReport {
  const summary = processVatAcknowledgements(envelope, acknowledgements);
  const latest = acknowledgements.length > 0 ? acknowledgements[acknowledgements.length - 1] : null;

  const latestAcknowledgedEnvelope =
    latest && latest.authority === envelope.authority ? applyVatSubmissionAcknowledgement(envelope, latest) : null;

  const alerts: string[] = [];
  if (summary.mismatched > 0) {
    alerts.push(`VAT reconciliation mismatches detected: ${summary.mismatched}`);
  }
  if (summary.errors > 0) {
    alerts.push(`VAT reconciliation processing errors detected: ${summary.errors}`);
  }
  if (summary.total === 0) {
    alerts.push("No VAT acknowledgements received for reconciliation window");
  }

  return {
    runId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    authority: envelope.authority,
    baseline: {
      submissionId: envelope.submissionId,
      netVat: envelope.diagnostics.netVat,
      issueCount: envelope.diagnostics.issueCount,
    },
    summary,
    ingestion: {
      accepted: acknowledgements.length,
      rejected: 0,
      rejectedRecords: [],
    },
    latestAcknowledgedEnvelope,
    alerts,
  };
}

export function runVatAcknowledgementReconciliationJobFromRaw(
  envelope: VatSubmissionEnvelope,
  rawAcknowledgements: unknown[]
): VatReconciliationJobReport {
  const ingestion = ingestVatSubmissionAcknowledgements(rawAcknowledgements);
  const baseReport = runVatAcknowledgementReconciliationJob(envelope, ingestion.accepted);

  const ingestionSummary = {
    accepted: ingestion.accepted.length,
    rejected: ingestion.rejected.length,
    rejectedRecords: ingestion.rejected,
  };

  const alerts =
    ingestion.rejected.length > 0
      ? [...baseReport.alerts, `Rejected acknowledgement records during ingestion: ${ingestion.rejected.length}`]
      : baseReport.alerts;

  return {
    ...baseReport,
    ingestion: ingestionSummary,
    alerts,
  };
}
