import { describe, expect, it } from "vitest";
import { exportAuditLogs, verifyExportIntegrity } from "@/utils/auditExport";
import type { AuditLogRecord } from "@/store/types/AuditTypes";

const sample: AuditLogRecord = {
  id: "1", timestamp: new Date().toISOString(), action: "ADD_SALE", category: "SALES", entityType: "SALE", entityId: "1", entityRef: "INV-1",
  userId: "u", userName: "john doe", sessionId: "s", changes: [{ field: "amount", fieldLabel: "Amount", oldValue: 0, newValue: 1000, changeType: "UPDATE" }], metadata: {}, ipAddress: null, userAgent: null, result: "SUCCESS", errorMessage: null, duration: 10,
};

describe("audit export", () => {
  it("exports and verifies seal", async () => {
    const out = await exportAuditLogs([sample], { format: "json", includeIntegritySeal: true, maskSensitive: true, exportedBy: "auditor" });
    expect(out.header.recordCount).toBe(1);
    expect(out.header.integritySeal?.signature).toBeTruthy();
    expect(out.header.integritySeal?.signedBy).toBe("auditor");
    const verified = await verifyExportIntegrity(out);
    expect(verified.valid).toBe(true);
  });

  it("fails verification when signature is tampered", async () => {
    const out = await exportAuditLogs([sample], { format: "json", includeIntegritySeal: true });
    if (!out.header.integritySeal) throw new Error("seal required");

    out.header.integritySeal.signature = "tampered-signature";

    const verified = await verifyExportIntegrity(out);
    expect(verified.valid).toBe(false);
    expect(verified.errors).toContain("Signature mismatch");
  });
  it("fails verification when signature algorithm is tampered", async () => {
    const out = await exportAuditLogs([sample], { format: "json", includeIntegritySeal: true });
    if (!out.header.integritySeal) throw new Error("seal required");

    out.header.integritySeal.signatureAlgorithm = "sha256x" as never;

    const verified = await verifyExportIntegrity(out);
    expect(verified.valid).toBe(false);
    expect(verified.errors).toContain("Unsupported signature algorithm");
  });

});
