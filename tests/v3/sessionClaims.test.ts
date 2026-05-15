import { describe, expect, it } from "vitest";
import { StaticTokenClaimsVerifier } from "@/v3/auth/sessionClaims";

describe("v3 session claims verifier", () => {
  it("returns claim for valid non-expired token", () => {
    const verifier = new StaticTokenClaimsVerifier();
    verifier.register("tkn", {
      subject: "u1",
      tenantId: "t1",
      roles: ["admin"],
      issuedAtIso: new Date(Date.now() - 1000).toISOString(),
      expiresAtIso: new Date(Date.now() + 10000).toISOString(),
    });

    expect(verifier.verify("tkn")?.tenantId).toBe("t1");
  });

  it("rejects expired token", () => {
    const verifier = new StaticTokenClaimsVerifier();
    verifier.register("tkn", {
      subject: "u1",
      tenantId: "t1",
      roles: ["admin"],
      issuedAtIso: new Date(Date.now() - 20000).toISOString(),
      expiresAtIso: new Date(Date.now() - 1000).toISOString(),
    });

    expect(verifier.verify("tkn")).toBeNull();
  });
});
