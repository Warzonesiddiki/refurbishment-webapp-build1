import { useMemo } from "react";
import { useAppState } from "@/context/StoreContext";
import { AuditLogViewer } from "@/components/Audit/AuditLogViewer";
import { AuditTimeline } from "@/components/Audit/AuditTimeline";
import type { AuditLogRecord } from "@/store/types/AuditTypes";

export function AuditPage() {
  const state = useAppState();
  const logs = useMemo<AuditLogRecord[]>(() => {
    return state.auditLog.map((l) => ({
      id: l.id,
      timestamp: l.ts,
      action: l.action,
      category: "SYSTEM",
      entityType: l.entityType,
      entityId: l.entityId,
      entityRef: l.ref ?? null,
      userId: l.user,
      userName: l.user,
      sessionId: null,
      changes: [],
      metadata: l.note ? { note: l.note } : {},
      ipAddress: null,
      userAgent: null,
      result: "SUCCESS",
      errorMessage: null,
      duration: null,
    }));
  }, [state.auditLog]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>AUDIT & SECURITY</h1>
      <AuditLogViewer logs={logs} />
      <AuditTimeline logs={logs.slice(0, 20)} />
    </div>
  );
}
