import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateProfitLossReport } from "@/utils/reportGenerator";

describe("profit loss", () => {
  it("computes net profit", () => {
    const state = createInitialState();
    const report = generateProfitLossReport(state, new Date("2020-01-01"), new Date("2030-01-01"));
    expect(report.netProfit).toBe(report.grossProfit - report.expenses.totalExpenses);
  });
});
