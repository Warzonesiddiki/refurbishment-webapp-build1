import { describe, expect, it } from "vitest";
import { checkPermission, filterByPermission, requirePermission } from "@/store/security/permissions";
import type { User } from "@/store/types/SecurityTypes";

function makeUser(role: User["role"], overrides?: Partial<User>): User {
  return {
    id: "user-1",
    username: "test-user",
    displayName: "Test User",
    email: "test@example.com",
    role,
    permissions: [],
    isActive: true,
    lastLoginAt: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("permission system", () => {
  it("keeps anonymous access permissive until auth is wired", () => {
    const result = checkPermission(null, "inventory", "read");
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("permissive mode");
  });

  it("keeps anonymous requests permissive even for unknown values", () => {
    expect(checkPermission(null, "unknown-resource", "unknown-action").allowed).toBe(true);
  });

  it("denies inactive users", () => {
    const inactive = makeUser("ADMIN", { isActive: false });
    const result = checkPermission(inactive, "inventory", "read");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("inactive");
  });

  it("allows admin for all known resources/actions", () => {
    const admin = makeUser("ADMIN");
    const result = checkPermission(admin, "finance", "approve");
    expect(result.allowed).toBe(true);
  });

  it("denies manager delete on settings", () => {
    const manager = makeUser("MANAGER");
    const result = checkPermission(manager, "settings", "delete");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("MANAGER cannot delete");
  });

  it("supports explicit user-level restrictions", () => {
    const operator = makeUser("OPERATOR", {
      permissions: [{ resource: "inventory", actions: ["read"] }],
    });

    const allowed = checkPermission(operator, "inventory", "read");
    const denied = checkPermission(operator, "inventory", "update");

    expect(allowed.allowed).toBe(true);
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toContain("Missing explicit permission");
  });

  it("throws from requirePermission on denied access", () => {
    const viewer = makeUser("VIEWER");
    expect(() => requirePermission(viewer, "sales", "update")).toThrow(/VIEWER cannot update/);
  });

  it("filters data when permission is missing", () => {
    const guest = makeUser("GUEST");
    expect(filterByPermission([1, 2, 3], guest, "reports", "read")).toEqual([]);
  });


  it("normalizes authenticated resource/action casing and whitespace", () => {
    const admin = makeUser("ADMIN");
    const result = checkPermission(admin, "  InVentory ", " ReAd  ");
    expect(result.allowed).toBe(true);
  });

  it("denies unknown resources and actions", () => {
    const admin = makeUser("ADMIN");
    expect(checkPermission(admin, "unknown", "read").allowed).toBe(false);
    expect(checkPermission(admin, "inventory", "unknown").allowed).toBe(false);
  });

  it("does not throw in permissive anonymous mode", () => {
    expect(() => requirePermission(null, "unknown", "unknown")).not.toThrow();
  });

  it("returns all items in permissive anonymous mode", () => {
    expect(filterByPermission([1, 2, 3], null, "unknown", "unknown")).toEqual([1, 2, 3]);
  });
});
