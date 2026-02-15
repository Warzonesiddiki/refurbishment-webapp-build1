import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  loading?: boolean;
  typeToConfirm?: string;
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  typeToConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !typeToConfirm) void onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm, typeToConfirm]);

  if (!open) return null;

  const canConfirm = !loading && (!typeToConfirm || typed === typeToConfirm);

  return (
    <div data-component="ui-ConfirmDialog" data-testid="component-ui-ConfirmDialog" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="glass-card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="text-sm text-cyan-200/70">{message}</div>
        {typeToConfirm && <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`Type ${typeToConfirm}`} />}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}>{cancelText}</button>
          <button
            className={cn(variant === "danger" ? "text-red-300" : variant === "warning" ? "text-yellow-300" : "text-cyan-300")}
            onClick={() => void onConfirm()}
            disabled={!canConfirm}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
