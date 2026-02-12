import { describe, expect, it } from "vitest";
import { exportAuditLogs, verifyExportIntegrity } from "@/utils/auditExport";
import type { AuditLogRecord } from "@/store/types/AuditTypes";

const sample: AuditLogRecord = {
  id: "1", timestamp: new Date().toISOString(), action: "ADD_SALE", category: "SALES", entityType: "SALE", entityId: "1", entityRef: "INV-1",
  userId: "u", userName: "john doe", sessionId: "s", changes: [{ field: "amount", fieldLabel: "Amount", oldValue: 0, newValue: 1000, changeType: "UPDATE" }], metadata: {}, ipAddress: null, userAgent: null, result: "SUCCESS", errorMessage: null, duration: 10,
};

describe("audit export", () => {
  it("exports and verifies seal", async () => {
    const out = await exportAuditLogs([sample], { format: "json", includeIntegritySeal: true, maskSensitive: true });
    expect(out.header.recordCount).toBe(1);
    const verified = await verifyExportIntegrity(out);
    expect(verified.valid).toBe(true);
  });
});
