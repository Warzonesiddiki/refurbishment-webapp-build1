import { describe, expect, it } from "vitest";
import { classifyWipAgingRisk, getWipAgingDays } from "@/utils/wipAging";

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
});
