import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateMarginReport } from "@/utils/reportGenerator";

describe("margin report", () => {
  it("groups by supplier", () => {
    const report = generateMarginReport(createInitialState(), new Date("2020-01-01"), new Date("2030-01-01"));
    expect(Array.isArray(report.bySupplier)).toBe(true);
  });
});
