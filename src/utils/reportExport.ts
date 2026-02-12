export type Report = Record<string, unknown>;

export type ReportMetadata = {
  generatedAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  filters: Record<string, unknown>;
  version: string;
};

export type PDFOptions = { letterhead?: string; footer?: string; pageSize?: string; orientation?: "portrait" | "landscape" };
export type CSVOptions = { includeMetadata?: boolean; dateFormat?: string; numberFormat?: string };
export type JSONOptions = { includeMetadata?: boolean; pretty?: boolean };

export function generateReportMetadata(report: Report): ReportMetadata {
  return {
    generatedAt: new Date().toISOString(),
    periodStart: typeof report.periodStart === "string" ? report.periodStart : null,
    periodEnd: typeof report.periodEnd === "string" ? report.periodEnd : null,
    filters: (report.filters as Record<string, unknown>) ?? {},
    version: "1.0.0",
  };
}

function flatten(obj: Record<string, unknown>, prefix = "", out: Record<string, unknown> = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v as Record<string, unknown>, key, out);
    else out[key] = v;
  }
  return out;
}

export function exportReportToCSV(report: Report, options: CSVOptions = {}) {
  const metadata = generateReportMetadata(report);
  const rows: string[][] = [];
  if (options.includeMetadata) {
    rows.push(["# generatedAt", metadata.generatedAt]);
    rows.push(["# periodStart", metadata.periodStart ?? ""]);
    rows.push(["# periodEnd", metadata.periodEnd ?? ""]);
  }
  const flat = flatten(report);
  rows.push(["field", "value"]);
  Object.entries(flat).forEach(([k, v]) => rows.push([k, String(v ?? "")]));
  return rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function exportReportToJSON(report: Report, options: JSONOptions = {}) {
  const wrapped = options.includeMetadata ? { metadata: generateReportMetadata(report), data: report } : report;
  return JSON.stringify(wrapped, null, options.pretty ? 2 : 0);
}

export async function exportReportToPDF(report: Report, options: PDFOptions = {}): Promise<Blob> {
  const payload = [
    `REPORT PDF`,
    `orientation=${options.orientation ?? "portrait"}`,
    `pageSize=${options.pageSize ?? "A4"}`,
    JSON.stringify(report),
  ].join("\n");
  return new Blob([payload], { type: "application/pdf" });
}
