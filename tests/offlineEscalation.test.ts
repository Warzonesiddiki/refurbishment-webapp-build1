import { describe, expect, it } from "vitest";
import { acknowledgeEscalation, clearEscalationAck, shouldShowEscalation } from "@/utils/offlineEscalation";

describe("offlineEscalation", () => {
  it("shows escalation when 5+ conflicts and no ack", () => {
    clearEscalationAck();
    const queue = [1, 2, 3, 4, 5].map((n) => ({ id: String(n), ts: "x", type: "A", summary: "s", status: "conflict" as const }));
    expect(shouldShowEscalation(queue)).toBe(true);
  });

  it("suppresses escalation for ack window", () => {
    clearEscalationAck();
    const now = Date.now();
    acknowledgeEscalation(now);
    const queue = [1, 2, 3, 4, 5].map((n) => ({ id: String(n), ts: "x", type: "A", summary: "s", status: "conflict" as const }));
    expect(shouldShowEscalation(queue, now + 1000)).toBe(false);
    expect(shouldShowEscalation(queue, now + 5 * 60 * 60 * 1000)).toBe(true);
  });
});
