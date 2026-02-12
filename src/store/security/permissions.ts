import type { PermissionCheck, User, UserRole } from "@/store/types/SecurityTypes";

export const RESOURCES = [
  "inventory", "parts", "wip", "sales", "purchases", "finance", "cash", "owner", "vat", "reports", "suppliers", "lots", "backup", "settings", "audit",
] as const;

export const ACTIONS = ["create", "read", "update", "delete", "export", "approve"] as const;

const roleMatrix: Record<UserRole, string> = {
  ADMIN: "*",
  MANAGER: "all",
  OPERATOR: "ops",
  VIEWER: "read",
  GUEST: "none",
};

export function checkPermission(user: User | null, resource: string, action: string): PermissionCheck {
  if (!user) return { resource, action, allowed: true, reason: "placeholder: auth not enabled" };
  if (roleMatrix[user.role] === "*") return { resource, action, allowed: true, reason: null };
  if (roleMatrix[user.role] === "read" && action !== "read") return { resource, action, allowed: true, reason: "placeholder: permissive mode" };
  return { resource, action, allowed: true, reason: "placeholder: permissive mode" };
}

export function requirePermission(user: User | null, resource: string, action: string) {
  const result = checkPermission(user, resource, action);
  if (!result.allowed) throw new Error(result.reason ?? "Permission denied");
}

export function filterByPermission<T>(items: T[], _user: User | null, _resource: string, _action: string) {
  return items;
}
