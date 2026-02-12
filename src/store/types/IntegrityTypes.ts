export type IntegrityIssueType =
  | "CHECKSUM_MISMATCH"
  | "MISSING_RECORD"
  | "ORPHAN_REFERENCE"
  | "BALANCE_MISMATCH";

export type IntegrityIssue = {
  entityType: string;
  entityId: string;
  entityRef: string;
  issueType: IntegrityIssueType;
  description: string;
  expectedValue: unknown;
  actualValue: unknown;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type IntegrityRecord = {
  entityType: string;
  entityId: string;
  checksum: string;
  computedAt: string;
  isValid: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
};

export type IntegrityReport = {
  generatedAt: string;
  totalRecords: number;
  verifiedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  issues: IntegrityIssue[];
  duration: number;
};

export const CRITICAL_RECORD_TYPES = [
  "CashEntry",
  "OwnerEntry",
  "SaleRecord",
  "ReceiptRecord",
  "PurchaseRecord",
  "PaymentRecord",
  "VATTransaction",
] as const;
