import type { AuditCategory, AuditChange, AuditLogRecord } from "@/store/types/AuditTypes";
import { computeDiff } from "@/utils/diffCalculator";
import { isSensitiveField, maskSensitiveData } from "@/utils/dataMasking";

export type AuditMiddlewareConfig = {
  excludeActions?: string[];
  sensitiveFields?: string[];
};

const defaultConfig: Required<AuditMiddlewareConfig> = {
  excludeActions: ["@@INIT"],
  sensitiveFields: ["password", "token", "secret", "pin"],
};

function inferCategory(action: string): AuditCategory {
  if (action.includes("SALE")) return "SALES";
  if (action.includes("PURCHASE")) return "PURCHASES";
  if (action.includes("WIP")) return "WIP";
  if (action.includes("CASH") || action.includes("OWNER") || action.includes("VAT")) return "FINANCE";
  if (action.includes("SETTINGS")) return "SETTINGS";
  return "SYSTEM";
}

export function wrapReducerWithAudit<State, Action extends { type: string }>(
  reducer: (state: State, action: Action) => State,
  config: AuditMiddlewareConfig = {},
  onAuditCreated?: (entry: AuditLogRecord) => void
) {
  const cfg = { ...defaultConfig, ...config };
  return (state: State, action: Action): State => {
    if (cfg.excludeActions.some((x) => action.type.startsWith(x)) || action.type.startsWith("UI_")) return reducer(state, action);
    const started = performance.now();
    const id = crypto.randomUUID();
    try {
      const next = reducer(state, action);
      const rawChanges = computeDiff(state as unknown, next as unknown).filter((d) => d.type !== "UNCHANGED");
      const changes = rawChanges.map((d) => ({
        field: d.field,
        fieldLabel: d.path,
        oldValue: isSensitiveField(d.field) ? maskSensitiveData(d.oldValue) : d.oldValue,
        newValue: isSensitiveField(d.field) ? maskSensitiveData(d.newValue) : d.newValue,
        changeType: (d.type === "ADDED" ? "CREATE" : d.type === "REMOVED" ? "DELETE" : "UPDATE") as AuditChange["changeType"],
      }));
      onAuditCreated?.({
        id,
        timestamp: new Date().toISOString(),
        action: action.type,
        category: inferCategory(action.type),
        entityType: "APP_STATE",
        entityId: null,
        entityRef: null,
        userId: null,
        userName: null,
        sessionId: null,
        changes,
        metadata: {},
        ipAddress: null,
        userAgent: navigator.userAgent,
        result: "SUCCESS",
        errorMessage: null,
        duration: Math.round(performance.now() - started),
      });
      return next;
    } catch (error) {
      onAuditCreated?.({
        id,
        timestamp: new Date().toISOString(),
        action: action.type,
        category: inferCategory(action.type),
        entityType: "APP_STATE",
        entityId: null,
        entityRef: null,
        userId: null,
        userName: null,
        sessionId: null,
        changes: [],
        metadata: {},
        ipAddress: null,
        userAgent: navigator.userAgent,
        result: "FAILURE",
        errorMessage: error instanceof Error ? error.message : String(error),
        duration: Math.round(performance.now() - started),
      });
      throw error;
    }
  };
}
