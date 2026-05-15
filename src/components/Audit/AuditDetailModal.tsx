import type { AuditLogRecord } from "@/store/types/AuditTypes";
import { Modal } from "@/components/ui/Modal";

export function AuditDetailModal({ entry, open, onClose }: { entry: AuditLogRecord | null; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Audit Detail">
      {!entry ? <p>No entry selected.</p> : (
        <div data-component="Audit-AuditDetailModal" data-testid="component-Audit-AuditDetailModal" className="space-y-2 text-sm">
          <div><strong>Action:</strong> {entry.action}</div>
          <div><strong>Timestamp:</strong> {entry.timestamp}</div>
          <div><strong>Result:</strong> {entry.result}</div>
          <div><strong>Entity:</strong> {entry.entityType} {entry.entityRef ?? ""}</div>
          <div><strong>Changes:</strong> {entry.changes.length}</div>
        </div>
      )}
    </Modal>
  );
}
