export type V3Role = "admin" | "finance" | "ops" | "viewer";

export type SessionClaim = {
  subject: string;
  tenantId: string;
  roles: V3Role[];
  issuedAtIso: string;
  expiresAtIso: string;
};

export interface SessionClaimsVerifier {
  verify(token: string): SessionClaim | null;
}

export class StaticTokenClaimsVerifier implements SessionClaimsVerifier {
  private readonly claimsByToken = new Map<string, SessionClaim>();

  register(token: string, claim: SessionClaim) {
    this.claimsByToken.set(token, claim);
  }

  verify(token: string): SessionClaim | null {
    const claim = this.claimsByToken.get(token);
    if (!claim) return null;

    const now = Date.now();
    const exp = new Date(claim.expiresAtIso).getTime();
    if (Number.isNaN(exp) || exp < now) return null;
    return claim;
  }
}
