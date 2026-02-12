import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type UnsavedChangesGuardProps = {
  isDirty: boolean;
  message?: string;
  onConfirmLeave: () => void;
  children: React.ReactNode;
};

export function UnsavedChangesGuard({ isDirty, message = "You have unsaved changes", onConfirmLeave, children }: UnsavedChangesGuardProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {children}
      <ConfirmDialog
        open={open && isDirty}
        title="Unsaved changes"
        message={message}
        confirmText="Leave"
        cancelText="Stay"
        variant="warning"
        onCancel={() => setOpen(false)}
        onConfirm={() => { setOpen(false); onConfirmLeave(); }}
      />
      <button className="hidden" onClick={() => setOpen(true)} aria-label="Trigger unsaved guard" />
    </>
  );
}
