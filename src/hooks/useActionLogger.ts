import { useCallback, useMemo, useState } from "react";
import { logAudit, logMovement, recordIdempotency } from "@/domain";

export type LoggedActionResult = {
  idempotencyKey: string;
  movementId?: string;
  auditId?: string;
  status: "logged" | "error";
  message?: string;
};

export type ActionPayload = {
  action: string;
  entityType: string;
  entityId?: string;
  from?: string;
  to?: string;
  userId?: string;
  payload?: Record<string, unknown>;
};

export function buildIdempotencyKey(action: string, entityId?: string) {
  return `${action}:${entityId ?? "anonymous"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function useActionLogger(defaultUser = "system", companyId = "demo-company") {
  const [lastResult, setLastResult] = useState<LoggedActionResult | null>(null);

  const logAction = useCallback(
    (input: ActionPayload): LoggedActionResult => {
      const idempotencyKey = buildIdempotencyKey(input.action, input.entityId);
      recordIdempotency(idempotencyKey, input.entityType, input.entityId ?? "temp");

      const movement = logMovement({
        entityType: input.entityType,
        entityId: input.entityId ?? "temp",
        action: input.action,
        from: input.from,
        to: input.to,
        userId: input.userId ?? defaultUser,
        companyId,
      });

      const audit = logAudit({
        entityType: input.entityType,
        entityId: input.entityId ?? "temp",
        action: input.action,
        payload: input.payload,
        userId: input.userId ?? defaultUser,
        companyId,
      });

      const result: LoggedActionResult = {
        idempotencyKey,
        movementId: movement.id,
        auditId: audit.id,
        status: "logged",
        message: `${input.action} logged for ${input.entityType}`,
      };
      setLastResult(result);
      return result;
    },
    [defaultUser]
  );

  const helpers = useMemo(
    () => ({
      logAction,
      lastResult,
    }),
    [logAction, lastResult]
  );

  return helpers;
}
