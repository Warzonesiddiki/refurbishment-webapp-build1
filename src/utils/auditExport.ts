import type { AuditFilter, AuditLogRecord } from "@/store/types/AuditTypes";
import { maskAuditLog } from "@/utils/dataMasking";
import { computeChecksum } from "@/utils/integrityChecker";

export type IntegritySeal = {
  checksum: string;
  timestamp: string;
  recordCount: number;
  version: string;
  signature: string;
  signatureAlgorithm: "sha256";
  signedBy: string;
};

export type ExportOptions = {
  format: "json" | "csv";
  maskSensitive?: boolean;
  includeIntegritySeal?: boolean;
  dateRange?: { start: string; end: string };
  filters?: Partial<AuditFilter>;
  exportedBy?: string;
};

export type AuditExport = {
  header: {
    exportId: string;
    exportedAt: string;
    exportedBy: string;
    filters: Partial<AuditFilter>;
    recordCount: number;
    dateRange: { start: string | null; end: string | null };
    integritySeal: IntegritySeal | null;
  };
  records: AuditLogRecord[];
  csv?: string;
};

function applyFilters(logs: AuditLogRecord[], filters: Partial<AuditFilter> = {}) {
  const term = filters.searchTerm?.toLowerCase();
  return logs.filter((log) => {
    if (filters.result && log.result !== filters.result) return false;
    if (filters.actions?.length && !filters.actions.includes(log.action)) return false;
    if (filters.categories?.length && !filters.categories.includes(log.category)) return false;
    if (filters.entityId && log.entityId !== filters.entityId) return false;
    if (filters.entityTypes?.length && !filters.entityTypes.includes(log.entityType)) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.startDate && +new Date(log.timestamp) < +new Date(filters.startDate)) return false;
    if (filters.endDate && +new Date(log.timestamp) > +new Date(filters.endDate)) return false;
    if (term) {
      const hay = `${log.action} ${log.entityType} ${log.entityRef ?? ""} ${log.userName ?? ""} ${log.errorMessage ?? ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
}

function toCsv(logs: AuditLogRecord[]) {
  const header = ["timestamp", "action", "category", "entityType", "entityRef", "user", "result"];
  const rows = logs.map((l) => [l.timestamp, l.action, l.category, l.entityType, l.entityRef ?? "", l.userName ?? "", l.result]);
  return [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

async function buildSignature(input: { checksum: string; timestamp: string; recordCount: number; version: string; signedBy: string }) {
  return computeChecksum(input);
}

export async function generateIntegritySeal(data: unknown, signedBy = "system"): Promise<IntegritySeal> {
  const records = Array.isArray(data) ? data.length : 1;
  const checksum = await computeChecksum(data);
  const timestamp = new Date().toISOString();
  const version = "1.1.0";

  return {
    checksum,
    timestamp,
    recordCount: records,
    version,
    signatureAlgorithm: "sha256",
    signedBy,
    signature: await buildSignature({ checksum, timestamp, recordCount: records, version, signedBy }),
  };
}

export async function exportAuditLogs(logs: AuditLogRecord[], options: ExportOptions): Promise<AuditExport> {
  let filtered = applyFilters(logs, options.filters);
  if (options.dateRange) {
    filtered = filtered.filter((x) => +new Date(x.timestamp) >= +new Date(options.dateRange!.start) && +new Date(x.timestamp) <= +new Date(options.dateRange!.end));
  }
  const records = options.maskSensitive ? filtered.map(maskAuditLog) : filtered;
  const exportedBy = options.exportedBy ?? "system";
  const integritySeal = options.includeIntegritySeal ? await generateIntegritySeal(records, exportedBy) : null;
  const out: AuditExport = {
    header: {
      exportId: crypto.randomUUID(),
      exportedAt: new Date().toISOString(),
      exportedBy,
      filters: options.filters ?? {},
      recordCount: records.length,
      dateRange: { start: options.dateRange?.start ?? null, end: options.dateRange?.end ?? null },
      integritySeal,
    },
    records,
  };
  if (options.format === "csv") out.csv = toCsv(records);
  return out;
}

export async function verifyExportIntegrity(exportData: AuditExport) {
  const errors: string[] = [];
  if (!exportData.header.integritySeal) {
    errors.push("Missing integrity seal");
    return { valid: false, errors };
  }
  const seal = exportData.header.integritySeal;
  const checksum = await computeChecksum(exportData.records);
  if (checksum !== seal.checksum) errors.push("Checksum mismatch");
  if (exportData.records.length !== exportData.header.recordCount) errors.push("Record count mismatch");

  const expectedSignature = await buildSignature({
    checksum: seal.checksum,
    timestamp: seal.timestamp,
    recordCount: seal.recordCount,
    version: seal.version,
    signedBy: seal.signedBy,
  });
  if (expectedSignature !== seal.signature) errors.push("Signature mismatch");
  if (seal.signatureAlgorithm !== "sha256") errors.push("Unsupported signature algorithm");

  return { valid: errors.length === 0, errors };
}

export function formatAuditForCompliance(logs: AuditLogRecord[], standard: "SOX" | "GDPR" | "HIPAA") {
  const retained = standard === "GDPR" ? logs.map(maskAuditLog) : logs;
  return { standard, generatedAt: new Date().toISOString(), records: retained };
}
