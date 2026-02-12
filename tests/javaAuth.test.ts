import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAuthToken, fetchCurrentUser, loginUser, registerUser } from "@/utils/javaAuth";

describe("javaAuth network and API handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns helpful network error when register cannot reach server", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(registerUser({ email: "e@test.com", fullName: "E", password: "password123" })).rejects.toThrow(
      /Unable to register\. Could not reach auth server/
    );
  });

  it("stores auth token after successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "abc", user: { id: "1", email: "e@test.com", fullName: "E" } }), { status: 200 })
    );

    const result = await loginUser({ email: "e@test.com", password: "password123" });
    expect(result.token).toBe("abc");
    expect(localStorage.getItem("alm_auth_token")).toBe("abc");
  });

  it("clears token when fetchCurrentUser is unauthorized", async () => {
    localStorage.setItem("alm_auth_token", "stale-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Unauthorized", { status: 401 }));

    const user = await fetchCurrentUser();
    expect(user).toBeNull();
    expect(localStorage.getItem("alm_auth_token")).toBeNull();
  });

  it("clears token when current user endpoint throws", async () => {
    localStorage.setItem("alm_auth_token", "stale-token");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const user = await fetchCurrentUser();
    expect(user).toBeNull();
    expect(localStorage.getItem("alm_auth_token")).toBeNull();
  });

  it("surfaces backend response message on login failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Invalid credentials", { status: 401 }));

    await expect(loginUser({ email: "e@test.com", password: "wrong" })).rejects.toThrow("Invalid credentials");
  });

  it("clearAuthToken removes auth key", () => {
    localStorage.setItem("alm_auth_token", "token");
    clearAuthToken();
    expect(localStorage.getItem("alm_auth_token")).toBeNull();
  });
});
