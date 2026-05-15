import { describe, expect, it, vi } from "vitest";
import { wrapReducerWithAudit } from "@/store/middleware/auditMiddleware";

type S = { count: number };
type A = { type: string; by?: number };

const reducer = (s: S, a: A): S => {
  if (a.type === "INC") return { count: s.count + (a.by ?? 1) };
  if (a.type === "THROW") throw new Error("boom");
  return s;
};

describe("audit middleware", () => {
  it("creates audit logs for actions and records failure", () => {
    const cb = vi.fn();
    const wrapped = wrapReducerWithAudit(reducer, { excludeActions: ["@@INIT"] }, cb);
    const next = wrapped({ count: 0 }, { type: "INC", by: 2 });
    expect(next.count).toBe(2);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].result).toBe("SUCCESS");

    expect(() => wrapped({ count: 0 }, { type: "THROW" })).toThrow();
    expect(cb.mock.calls[1][0].result).toBe("FAILURE");
  });
});
