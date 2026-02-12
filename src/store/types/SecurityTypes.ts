export type DeviceInfo = {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
};

export type Session = {
  id: string;
  userId: string | null;
  userName: string | null;
  startedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
  deviceInfo: DeviceInfo;
  activityCount: number;
};

export type UserRole = "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | "GUEST";
export type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

export type Permission = {
  resource: string;
  actions: PermissionAction[];
};

export type User = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type PermissionCheck = {
  resource: string;
  action: string;
  allowed: boolean;
  reason: string | null;
};
