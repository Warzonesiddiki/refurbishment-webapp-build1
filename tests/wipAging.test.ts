import { describe, expect, it } from "vitest";
import { classifyWipAgingRisk, compareWipBySlaRisk, getWipAgingDays, getWipSlaRiskDeltaDays } from "@/utils/wipAging";

describe("wip aging risk", () => {
  const now = new Date("2026-02-20T00:00:00.000Z");

  it("computes aging days from short month format", () => {
    expect(getWipAgingDays("Feb 18", now)).toBe(2);
  });

  it("classifies risk buckets", () => {
    expect(classifyWipAgingRisk("Feb 19", "Active", now)).toBe("Healthy");
    expect(classifyWipAgingRisk("Feb 17", "Active", now)).toBe("Watch");
    expect(classifyWipAgingRisk("Feb 10", "Active", now)).toBe("Risk");
    expect(classifyWipAgingRisk("Feb 10", "Completed", now)).toBe("Healthy");
  });

  it("sorts jobs by risk first then aging days", () => {
    const rows = [
      { opened: "Feb 19", status: "Active", id: "healthy" },
      { opened: "Feb 16", status: "Active", id: "watch" },
      { opened: "Feb 10", status: "Active", id: "risk" },
    ];

    const sorted = [...rows].sort((a, b) => compareWipBySlaRisk(a, b, now));
    expect(sorted.map((r) => r.id)).toEqual(["risk", "watch", "healthy"]);
  });

  it("computes remaining days to SLA risk threshold", () => {
    expect(getWipSlaRiskDeltaDays("Feb 19", "Active", now)).toBe(4);
    expect(getWipSlaRiskDeltaDays("Feb 15", "Active", now)).toBe(0);
    expect(getWipSlaRiskDeltaDays("Feb 14", "Active", now)).toBe(-1);
    expect(getWipSlaRiskDeltaDays("Feb 10", "Completed", now)).toBeNull();
  });
});
