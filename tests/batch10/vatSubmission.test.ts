import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import {
  applyVatSubmissionAcknowledgement,
  buildVatSubmissionEnvelope,
  ingestVatSubmissionAcknowledgements,
  parseVatSubmissionAcknowledgement,
  processVatAcknowledgements,
  reconcileVatSubmissionAcknowledgement,
} from "@/utils/vatSubmission";

describe("buildVatSubmissionEnvelope", () => {
  it("builds uae-fzta payload with integrity and pending acknowledgement", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta", "auditor");

    expect(envelope.authority).toBe("uae-fzta");
    expect(envelope.submittedBy).toBe("auditor");
    expect(envelope.acknowledgement.status).toBe("pending");
    expect(envelope.integrity.signatureAlgorithm).toBe("sha256");
    expect(envelope.integrity.checksum).toBeTruthy();
    expect(envelope.integrity.signature).toBeTruthy();
    expect(envelope.payload).toHaveProperty("boxes");
  });

  it("supports generic-json adapter payload", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "generic-json", "system");

    expect(envelope.authority).toBe("generic-json");
    expect(envelope.payload).toHaveProperty("vatReturn");
    expect(envelope.payload).toHaveProperty("issueCount");
  });

  it("applies acknowledgement and reconciles as matched when totals align", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta", "auditor");

    const acknowledgement = {
      authority: "uae-fzta" as const,
      acknowledgementRef: "FZTA-ACK-001",
      acceptedAt: "2026-02-02T10:00:00.000Z",
      reportedNetVat: envelope.diagnostics.netVat,
      reportedIssueCount: envelope.diagnostics.issueCount,
    };

    const acknowledged = applyVatSubmissionAcknowledgement(envelope, acknowledgement);
    const reconciliation = reconcileVatSubmissionAcknowledgement(acknowledged, acknowledgement);

    expect(acknowledged.acknowledgement.status).toBe("acknowledged");
    expect(acknowledged.acknowledgement.acknowledgementRef).toBe("FZTA-ACK-001");
    expect(reconciliation).toEqual({ status: "matched", differences: [] });
  });

  it("flags mismatch during reconciliation when authority or net VAT differ", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta", "auditor");

    const mismatch = reconcileVatSubmissionAcknowledgement(envelope, {
      authority: "generic-json",
      acknowledgementRef: "GEN-ACK-01",
      acceptedAt: "2026-02-02T11:00:00.000Z",
      reportedNetVat: envelope.diagnostics.netVat + 2,
    });

    expect(mismatch.status).toBe("mismatch");
    expect(mismatch.differences).toContain("authority");
    expect(mismatch.differences).toContain("netVat");
  });

  it("processes acknowledgement batches with matched and mismatched counts", async () => {
    const state = createInitialState();
    const envelope = await buildVatSubmissionEnvelope(state, new Date("2026-01-01"), new Date("2026-01-31"), "uae-fzta", "auditor");

    const summary = processVatAcknowledgements(envelope, [
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-MATCH-01",
        acceptedAt: "2026-02-03T10:00:00.000Z",
        reportedNetVat: envelope.diagnostics.netVat,
        reportedIssueCount: envelope.diagnostics.issueCount,
      },
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-MISMATCH-01",
        acceptedAt: "2026-02-03T11:00:00.000Z",
        reportedNetVat: envelope.diagnostics.netVat + 1,
      },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.matched).toBe(1);
    expect(summary.mismatched).toBe(1);
    expect(summary.errors).toBe(0);
    expect(summary.results[1]?.differences).toContain("netVat");
  });

  it("parses a valid acknowledgement payload", () => {
    const parsed = parseVatSubmissionAcknowledgement({
      authority: "uae-fzta",
      acknowledgementRef: "ACK-123",
      acceptedAt: "2026-02-03T12:00:00.000Z",
      reportedNetVat: 150,
      reportedIssueCount: 0,
    });

    expect(parsed.authority).toBe("uae-fzta");
    expect(parsed.acknowledgementRef).toBe("ACK-123");
    expect(parsed.reportedNetVat).toBe(150);
  });

  it("ingests acknowledgement arrays with accepted and rejected records", () => {
    const result = ingestVatSubmissionAcknowledgements([
      {
        authority: "uae-fzta",
        acknowledgementRef: "ACK-OK",
        acceptedAt: "2026-02-03T12:00:00.000Z",
        reportedNetVat: 99,
      },
      {
        authority: "unknown-authority",
        acknowledgementRef: "ACK-BAD",
        acceptedAt: "not-a-date",
        reportedNetVat: "oops",
      },
    ]);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.index).toBe(1);
    expect(result.rejected[0]?.reason).toContain("Invalid acknowledgement authority");
  });
});
