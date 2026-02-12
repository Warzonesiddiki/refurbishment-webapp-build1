export type AuditCategory =
  | "INVENTORY"
  | "SALES"
  | "PURCHASES"
  | "FINANCE"
  | "WIP"
  | "MASTER_DATA"
  | "SYSTEM"
  | "SECURITY"
  | "BACKUP"
  | "SETTINGS";

export type AuditResult = "SUCCESS" | "FAILURE" | "BLOCKED";

export type AuditChange = {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "CREATE" | "UPDATE" | "DELETE";
};

export type AuditLogRecord = {
  id: string;
  timestamp: string;
  action: string;
  category: AuditCategory;
  entityType: string;
  entityId: string | null;
  entityRef: string | null;
  userId: string | null;
  userName: string | null;
  sessionId: string | null;
  changes: AuditChange[];
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  result: AuditResult;
  errorMessage: string | null;
  duration: number | null;
};

export type AuditFilter = {
  startDate: string | null;
  endDate: string | null;
  categories: AuditCategory[];
  entityTypes: string[];
  entityId: string | null;
  userId: string | null;
  actions: string[];
  searchTerm: string | null;
  result: AuditResult | null;
};
