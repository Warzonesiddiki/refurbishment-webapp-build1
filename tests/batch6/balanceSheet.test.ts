import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { generateBalanceSheet } from "@/utils/reportGenerator";

describe("balance sheet", () => {
  it("has balance check", () => {
    const state = createInitialState();
    const bs = generateBalanceSheet(state, new Date("2030-01-01"));
    expect(bs.balanceCheck).toBe(bs.assets.totalAssets === bs.liabilities.totalLiabilities + bs.equity.totalEquity);
  });
});
