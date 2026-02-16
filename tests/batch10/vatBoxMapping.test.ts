import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateVatBoxMappingReport } from "@/utils/reportGenerator";

describe("generateVatBoxMappingReport", () => {
  it("returns standard VAT box mapping lines", () => {
    const state = createInitialState();
    const report = generateVatBoxMappingReport(state, new Date("2026-01-01"), new Date("2026-01-31"));

    expect(report.lines.length).toBeGreaterThanOrEqual(4);
    expect(report.lines.some((line) => line.box === 1)).toBe(true);
    expect(report.lines.some((line) => line.box === 5)).toBe(true);
  });
});
