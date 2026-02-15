import type {
  PermissionAction,
  PermissionCheck,
  User,
  UserRole,
} from "@/store/types/SecurityTypes";

export const RESOURCES = [
  "inventory",
  "parts",
  "wip",
  "sales",
  "purchases",
  "finance",
  "cash",
  "owner",
  "vat",
  "reports",
  "suppliers",
  "lots",
  "backup",
  "settings",
  "audit",
] as const;

export const ACTIONS = ["create", "read", "update", "delete", "export", "approve"] as const;

type Resource = (typeof RESOURCES)[number];

type RolePermissionMap = Record<UserRole, Record<Resource, PermissionAction[]>>;

const AUTH_PERMISSIVE_REASON = "Auth not enabled; permissive mode.";
const USER_INACTIVE_REASON = "User is inactive.";

const allActions: PermissionAction[] = [...ACTIONS];
const readOnlyActions: PermissionAction[] = ["read"];

function mapResourcesToActions(actions: PermissionAction[]): Record<Resource, PermissionAction[]> {
  return RESOURCES.reduce<Record<Resource, PermissionAction[]>>((acc, resource) => {
    acc[resource] = [...actions];
    return acc;
  }, {} as Record<Resource, PermissionAction[]>);
}

const fullResourceAccess = mapResourcesToActions(allActions);

const managerAccess: Record<Resource, PermissionAction[]> = {
  inventory: ["create", "read", "update", "export"],
  parts: ["create", "read", "update", "export"],
  wip: ["create", "read", "update", "approve"],
  sales: ["create", "read", "update", "export", "approve"],
  purchases: ["create", "read", "update", "export", "approve"],
  finance: ["read", "export", "approve"],
  cash: ["create", "read", "update", "export", "approve"],
  owner: ["read", "export"],
  vat: ["read", "export", "approve"],
  reports: ["read", "export"],
  suppliers: ["create", "read", "update", "export"],
  lots: ["create", "read", "update", "export"],
  backup: ["create", "read", "export", "approve"],
  settings: ["read", "update"],
  audit: ["read", "export"],
};

const operatorAccess: Record<Resource, PermissionAction[]> = {
  inventory: ["create", "read", "update"],
  parts: ["create", "read", "update"],
  wip: ["create", "read", "update"],
  sales: ["create", "read", "update"],
  purchases: ["create", "read", "update"],
  finance: ["read"],
  cash: ["create", "read", "update"],
  owner: [],
  vat: ["read"],
  reports: ["read"],
  suppliers: ["read"],
  lots: ["create", "read", "update"],
  backup: ["create", "read"],
  settings: ["read"],
  audit: ["read"],
};

const viewerAccess = mapResourcesToActions(readOnlyActions);
const guestAccess = mapResourcesToActions([]);

const roleMatrix: RolePermissionMap = {
  ADMIN: fullResourceAccess,
  MANAGER: managerAccess,
  OPERATOR: operatorAccess,
  VIEWER: viewerAccess,
  GUEST: guestAccess,
};

function normalizeAction(action: string): PermissionAction | null {
  const normalized = action.trim().toLowerCase();
  return ACTIONS.includes(normalized as PermissionAction) ? (normalized as PermissionAction) : null;
}

function normalizeResource(resource: string): Resource | null {
  const normalized = resource.trim().toLowerCase();
  return RESOURCES.includes(normalized as Resource) ? (normalized as Resource) : null;
}

export function checkPermission(user: User | null, resource: string, action: string): PermissionCheck {
  if (!user) {
    return {
      resource,
      action,
      allowed: true,
      reason: AUTH_PERMISSIVE_REASON,
    };
  }

  const normalizedResource = normalizeResource(resource);
  if (!normalizedResource) {
    return {
      resource,
      action,
      allowed: false,
      reason: `Unknown resource: ${resource}.`,
    };
  }

  const normalizedAction = normalizeAction(action);
  if (!normalizedAction) {
    return {
      resource,
      action,
      allowed: false,
      reason: `Unknown action: ${action}.`,
    };
  }

  if (!user.isActive) {
    return {
      resource,
      action,
      allowed: false,
      reason: USER_INACTIVE_REASON,
    };
  }

  const roleAllowedActions = roleMatrix[user.role][normalizedResource] ?? [];
  if (!roleAllowedActions.includes(normalizedAction)) {
    return {
      resource,
      action,
      allowed: false,
      reason: `${user.role} cannot ${action} on ${resource}.`,
    };
  }

  const customPermission = user.permissions.find((permission) => permission.resource === normalizedResource);
  if (!customPermission) {
    return {
      resource,
      action,
      allowed: true,
      reason: null,
    };
  }

  const customAllowed = customPermission.actions.includes(normalizedAction);
  return {
    resource,
    action,
    allowed: customAllowed,
    reason: customAllowed ? null : `Missing explicit permission for ${action} on ${resource}.`,
  };
}

export function requirePermission(user: User | null, resource: string, action: string) {
  const result = checkPermission(user, resource, action);
  if (!result.allowed) throw new Error(result.reason ?? "Permission denied");
}

export function filterByPermission<T>(items: T[], user: User | null, resource: string, action: string) {
  return checkPermission(user, resource, action).allowed ? items : [];
}
