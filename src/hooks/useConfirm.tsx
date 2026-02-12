import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  typeToConfirm?: string;
};

export function useConfirm() {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  };

  const dialog = pending ? (
    <ConfirmDialog
      open
      title={pending.title}
      message={pending.message}
      confirmText={pending.confirmText}
      cancelText={pending.cancelText}
      variant={pending.variant}
      typeToConfirm={pending.typeToConfirm}
      onConfirm={() => {
        pending.resolve(true);
        setPending(null);
      }}
      onCancel={() => {
        pending.resolve(false);
        setPending(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}
