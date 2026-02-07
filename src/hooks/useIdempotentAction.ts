import { useCallback, useState } from "react";
import { buildIdempotencyKey, useActionLogger } from "@/hooks/useActionLogger";

export type IdempotentResult = {
  idempotencyKey: string;
  status: "pending" | "done" | "error";
  message?: string;
};

export function useIdempotentAction(actionName: string, entityType: string) {
  const logger = useActionLogger();
  const [last, setLast] = useState<IdempotentResult | null>(null);

  const run = useCallback(
    (entityId?: string, payload?: Record<string, unknown>) => {
      const key = buildIdempotencyKey(actionName, entityId);
      setLast({ idempotencyKey: key, status: "pending" });
      const res = logger.logAction({ action: actionName, entityType, entityId, payload });
      setLast({ idempotencyKey: res.idempotencyKey, status: "done", message: res.message });
      return res;
    },
    [actionName, entityType, logger]
  );

  return { run, last };
}
