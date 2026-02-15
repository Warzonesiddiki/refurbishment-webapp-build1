import type { V3Command } from "@/v3/commands/types";
import type { JournalProjectionSnapshot, JournalRow } from "@/v3/finance/journalProjection";

export const V3_API_VERSION = "v1" as const;

export type V3CommandRequest = {
  version: typeof V3_API_VERSION;
  tenantId: string;
  authToken: string;
  command: V3Command;
};

export type V3CommandResponse =
  | { ok: true; status: "processed" | "deduped"; eventId?: string }
  | { ok: false; error: "unauthorized" | "tenant_mismatch" | "validation_error"; message: string };

export type JournalQueryScope = "all" | "sales" | "purchases" | "receipts" | "payments";
export type JournalQueryWindow = "all-time" | "this-month" | "last-30-days";

export type JournalQueryRequest = {
  version: typeof V3_API_VERSION;
  tenantId: string;
  authToken: string;
  scope?: JournalQueryScope;
  window?: JournalQueryWindow;
  limit?: number;
  nowIso?: string;
};

export type JournalQueryResponse =
  | {
      ok: true;
      rows: JournalRow[];
      snapshot: JournalProjectionSnapshot;
    }
  | { ok: false; error: "unauthorized" | "tenant_mismatch"; message: string };
