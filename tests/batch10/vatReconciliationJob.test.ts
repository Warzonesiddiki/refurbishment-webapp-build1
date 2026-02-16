import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import {
  runVatAcknowledgementReconciliationJob,
  runVatAcknowledgementReconciliationJobFromRaw,
} from "@/utils/vatReconciliationJob";
import { buildVatSubmissionEnvelope } from "@/utils/vatSubmission";

describe("runVatAcknowledgementReconciliationJob", () => {
  it("returns matched summary and latest acknowledged envelope when acknowledgement aligns", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta");

    const report = runVatAcknowledgementReconciliationJob(envelope, [
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-OK-01",
        acceptedAt: "2026-02-05T10:00:00.000Z",
        reportedNetVat: envelope.diagnostics.netVat,
        reportedIssueCount: envelope.diagnostics.issueCount,
      },
    ]);

    expect(report.summary.total).toBe(1);
    expect(report.summary.matched).toBe(1);
    expect(report.summary.mismatched).toBe(0);
    expect(report.ingestion.accepted).toBe(1);
    expect(report.ingestion.rejected).toBe(0);
    expect(report.latestAcknowledgedEnvelope?.acknowledgement.status).toBe("acknowledged");
    expect(report.alerts).toHaveLength(0);
  });

  it("surfaces mismatch/empty alerts when acknowledgements are missing or drifted", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta");

    const mismatchReport = runVatAcknowledgementReconciliationJob(envelope, [
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-BAD-01",
        acceptedAt: "2026-02-05T11:00:00.000Z",
        reportedNetVat: envelope.diagnostics.netVat + 2,
      },
    ]);

    expect(mismatchReport.summary.mismatched).toBe(1);
    expect(mismatchReport.ingestion.accepted).toBe(1);
    expect(mismatchReport.alerts.some((alert) => alert.includes("mismatches"))).toBe(true);

    const emptyReport = runVatAcknowledgementReconciliationJob(envelope, []);
    expect(emptyReport.summary.total).toBe(0);
    expect(emptyReport.ingestion.accepted).toBe(0);
    expect(emptyReport.alerts.some((alert) => alert.includes("No VAT acknowledgements"))).toBe(true);
  });

  it("ingests raw acknowledgement payloads and reports rejected record alerts", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta");

    const report = runVatAcknowledgementReconciliationJobFromRaw(envelope, [
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-RAW-OK",
        acceptedAt: "2026-02-05T12:00:00.000Z",
        reportedNetVat: envelope.diagnostics.netVat,
      },
      {
        authority: "bad-authority",
        acknowledgementRef: "ACK-RAW-BAD",
        acceptedAt: "invalid",
        reportedNetVat: "n/a",
      },
    ]);

    expect(report.summary.total).toBe(1);
    expect(report.summary.matched).toBe(1);
    expect(report.ingestion.accepted).toBe(1);
    expect(report.ingestion.rejected).toBe(1);
    expect(report.ingestion.rejectedRecords[0]?.index).toBe(1);
    expect(report.ingestion.rejectedRecords[0]?.reason).toContain("Invalid acknowledgement authority");
    expect(report.alerts.some((alert) => alert.includes("Rejected acknowledgement records"))).toBe(true);
  });
});
