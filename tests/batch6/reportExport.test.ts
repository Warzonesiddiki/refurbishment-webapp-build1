import { describe, expect, it } from "vitest";
import { exportReportToCSV, exportReportToJSON, exportReportToPDF } from "@/utils/reportExport";

describe("report exports", () => {
  it("csv and json include metadata", async () => {
    const report = { periodStart: "2024-01-01", periodEnd: "2024-01-31", revenue: 100 };
    const csv = exportReportToCSV(report, { includeMetadata: true });
    expect(csv).toContain("# generatedAt");
    const json = exportReportToJSON(report, { includeMetadata: true, pretty: true });
    expect(json).toContain("metadata");
    const pdf = await exportReportToPDF(report);
    expect(pdf.type).toBe("application/pdf");
  });
});
