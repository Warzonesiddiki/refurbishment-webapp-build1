import type { AppState } from "@/store/appState";
import type { IntegrityIssue, IntegrityRecord, IntegrityReport } from "@/store/types/IntegrityTypes";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeChecksum(data: unknown) {
  const encoded = new TextEncoder().encode(stableStringify(data));
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(hash);
}

export async function verifyChecksum(data: unknown, expectedChecksum: string) {
  const actual = await computeChecksum(data);
  return actual === expectedChecksum;
}

export async function computeRecordChecksum(record: unknown) {
  return computeChecksum(record);
}

function makeIssue(partial: Omit<IntegrityIssue, "severity"> & { severity?: IntegrityIssue["severity"] }): IntegrityIssue {
  return { severity: partial.severity ?? "MEDIUM", ...partial };
}

export async function runIntegrityCheck(state: AppState): Promise<IntegrityReport> {
  const started = performance.now();
  const issues: IntegrityIssue[] = [];

  for (let i = 1; i < state.cashEntries.length; i += 1) {
    const expected = Number((state.cashEntries[i - 1].balance + state.cashEntries[i].amount).toFixed(2));
    if (Number(state.cashEntries[i].balance.toFixed(2)) !== expected) {
      issues.push(makeIssue({
        entityType: "CashEntry",
        entityId: state.cashEntries[i].id,
        entityRef: state.cashEntries[i].desc,
        issueType: "BALANCE_MISMATCH",
        description: "Cash running balance mismatch",
        expectedValue: expected,
        actualValue: state.cashEntries[i].balance,
        severity: "HIGH",
      }));
    }
  }

  state.ownerEntries.forEach((entry) => {
    if (entry.balance < 0) {
      issues.push(makeIssue({
        entityType: "OwnerEntry",
        entityId: entry.id,
        entityRef: entry.desc,
        issueType: "BALANCE_MISMATCH",
        description: "Owner ledger balance below zero",
        expectedValue: ">= 0",
        actualValue: entry.balance,
        severity: "MEDIUM",
      }));
    }
  });

  state.receipts.forEach((r) => {
    const saleExists = state.sales.some((s) => s.invoice === r.invoice);
    if (!saleExists) {
      issues.push(makeIssue({
        entityType: "ReceiptRecord",
        entityId: r.id,
        entityRef: r.receipt,
        issueType: "ORPHAN_REFERENCE",
        description: "Receipt references unknown sale invoice",
        expectedValue: "existing sale",
        actualValue: r.invoice,
        severity: "CRITICAL",
      }));
    }
  });

  const totalRecords = state.cashEntries.length + state.ownerEntries.length + state.sales.length + state.receipts.length;
  const invalidCount = issues.length;
  const validCount = Math.max(0, totalRecords - invalidCount);
  const duration = Math.round(performance.now() - started);

  return {
    generatedAt: new Date().toISOString(),
    totalRecords,
    verifiedCount: totalRecords,
    validCount,
    invalidCount,
    skippedCount: 0,
    issues,
    duration,
  };
}

export function scheduleIntegrityCheck(intervalMs: number, callback: () => void) {
  return window.setInterval(callback, intervalMs);
}

export async function createIntegrityRecord(entityType: string, entityId: string, data: unknown, isValid = true): Promise<IntegrityRecord> {
  return {
    entityType,
    entityId,
    checksum: await computeChecksum(data),
    computedAt: new Date().toISOString(),
    isValid,
    lastVerifiedAt: null,
    verificationCount: 0,
  };
}
