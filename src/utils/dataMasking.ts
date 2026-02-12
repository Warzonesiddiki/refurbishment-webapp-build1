import type { AuditLogRecord } from "@/store/types/AuditTypes";
import type { EntitySnapshot } from "@/store/types/SnapshotTypes";

export type MaskConfig = {
  sensitiveFields?: Record<string, string[]>;
  maskChar?: string;
};

const DEFAULT_MASK_CONFIG: Required<MaskConfig> = {
  sensitiveFields: {
    global: ["password", "token", "secret", "pin", "ssn", "taxid"],
    customer: ["email", "phone", "address"],
    supplier: ["bankaccount", "taxid"],
    finance: ["amount", "balance"],
  },
  maskChar: "*",
};

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

function maskEmail(email: string) {
  const [name, domain = ""] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return `***-***-${digits.slice(-4)}`;
}

function maskName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => `${x[0]?.toUpperCase() ?? ""}.`)
    .join(" ");
}

function maskAmountRange(value: number) {
  if (value < 1000) return "0-1,000";
  if (value < 5000) return "1,000-5,000";
  if (value < 10000) return "5,000-10,000";
  return "10,000+";
}

export function isSensitiveField(fieldName: string, entityType = "global", config: MaskConfig = DEFAULT_MASK_CONFIG) {
  const c = { ...DEFAULT_MASK_CONFIG, ...config };
  const key = fieldName.toLowerCase();
  const entity = entityType.toLowerCase();
  return (
    c.sensitiveFields.global.includes(key) ||
    (c.sensitiveFields[entity] ?? []).includes(key)
  );
}

export function maskSensitiveData(data: unknown, config: MaskConfig = DEFAULT_MASK_CONFIG): unknown {
  if (Array.isArray(data)) return data.map((x) => maskSensitiveData(x, config));
  if (!isObject(data)) {
    if (typeof data === "string") {
      if (data.includes("@")) return maskEmail(data);
      if (/\d{7,}/.test(data)) return maskPhone(data);
      if (/^[A-Za-z]+\s+[A-Za-z]+/.test(data)) return maskName(data);
    }
    if (typeof data === "number") return maskAmountRange(data);
    return data;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (isSensitiveField(k, "global", config)) {
      out[k] = config.maskChar?.repeat(8) ?? "********";
      continue;
    }
    if (["email"].includes(k.toLowerCase()) && typeof v === "string") out[k] = maskEmail(v);
    else if (["phone", "mobile", "contact"].includes(k.toLowerCase()) && typeof v === "string") out[k] = maskPhone(v);
    else if (["name", "fullname"].includes(k.toLowerCase()) && typeof v === "string") out[k] = maskName(v);
    else if (["amount", "balance"].includes(k.toLowerCase()) && typeof v === "number") out[k] = maskAmountRange(v);
    else out[k] = maskSensitiveData(v, config);
  }
  return out;
}

export function maskAuditLog(log: AuditLogRecord): AuditLogRecord {
  return {
    ...log,
    changes: log.changes.map((change) =>
      isSensitiveField(change.field, log.entityType)
        ? { ...change, oldValue: maskSensitiveData(change.oldValue), newValue: maskSensitiveData(change.newValue) }
        : change
    ),
  };
}

export function maskEntitySnapshot(snapshot: EntitySnapshot): EntitySnapshot {
  return { ...snapshot, data: maskSensitiveData(snapshot.data) as Record<string, unknown> };
}
