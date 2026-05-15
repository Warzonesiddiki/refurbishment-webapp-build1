import { useMemo } from "react";
import type { User } from "@/store/types/SecurityTypes";
import { checkPermission, requirePermission } from "@/store/security/permissions";

export function useCurrentUser(): User | null {
  return null;
}

export function usePermission(resource: string, action: string) {
  const user = useCurrentUser();
  return useMemo(() => {
    const result = checkPermission(user, resource, action);
    return { ...result, check: () => checkPermission(user, resource, action) };
  }, [user, resource, action]);
}

export function useRequirePermission(resource: string, action: string) {
  const user = useCurrentUser();
  return () => requirePermission(user, resource, action);
}
