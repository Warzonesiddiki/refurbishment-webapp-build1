import { describe, expect, it } from "vitest";
import { checkSessionValidity, createSession, endSession, refreshSession } from "@/store/session/sessionManager";

describe("session manager", () => {
  it("creates refreshes and ends session", () => {
    const s = createSession("u1");
    expect(checkSessionValidity(s)).toBe(true);
    const r = refreshSession(s);
    expect(r.activityCount).toBe(1);
    const e = endSession(r);
    expect(checkSessionValidity(e)).toBe(false);
  });
});
