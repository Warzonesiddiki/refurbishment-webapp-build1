import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { buildCompletionRoadmap } from "@/utils/completionRoadmap";

describe("buildCompletionRoadmap", () => {
  it("returns completion percentages, forecast, and prioritized actions", () => {
    const state = createInitialState();
    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));

    expect(roadmap.overallPercent).toBeGreaterThan(0);
    expect(roadmap.overallPercent).toBeLessThanOrEqual(100);
    expect(roadmap.financePercent).toBeGreaterThanOrEqual(0);
    expect(roadmap.financePercent).toBeLessThanOrEqual(100);
    expect(roadmap.forecastToTarget.targetPercent).toBe(95);
    expect(roadmap.forecastToTarget.estimatedSprintsRemaining).toBeGreaterThanOrEqual(0);
    expect(roadmap.recommendedActions.length).toBeGreaterThan(0);
    expect(roadmap.recommendedActions[0].impactPoints).toBeGreaterThanOrEqual(roadmap.recommendedActions.at(-1)!.impactPoints);
    expect(roadmap.recommendedActions.some((a) => a.id === "core-module-workflow-completion")).toBe(true);
    expect(roadmap.recommendedActions.some((a) => a.id === "runtime-observability")).toBe(true);
  });

  it("adds period-close workflow recommendation when finance readiness is below target", () => {
    const state = createInitialState();
    state.ownerEntries = [
      {
        id: "o1",
        date: "2026-01-01",
        type: "Withdraw",
        amount: 1000,
        note: "force negative owner balance",
        balance: -100,
      },
    ];

    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));
    expect(roadmap.financePercent).toBeLessThan(95);
    expect(roadmap.recommendedActions.some((a) => a.id === "period-close-workflow")).toBe(true);
  });

  it("adds VAT evidence recommendation when vat-coverage fails", () => {
    const state = createInitialState();
    state.sales = [
      {
        id: "s1",
        invoice: "INV-1",
        date: "2026-01-01",
        customer: "Test",
        subtotal: 100,
        vat: Number.NaN,
        total: 105,
        items: 1,
        profit: 0,
        status: "Unpaid",
        method: "Cash",
        lineItems: [{ barcode: "LP-1", name: "Test Item", price: 100, cost: 100, profit: 0 }],
      },
    ];

    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));
    expect(roadmap.recommendedActions.some((a) => a.id === "tax-filing-evidence-pack")).toBe(true);
  });

  it("adds receivables control recommendation when receipts exceed sales", () => {
    const state = createInitialState();
    state.sales = [];
    state.receipts = [
      { id: "r1", receipt: "R1", date: "2026-01-01", invoice: "INV1", amount: 1000, method: "Cash", reference: "X" },
    ];

    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));
    expect(roadmap.recommendedActions.some((a) => a.id === "receivables-overrun-controls")).toBe(true);
  });

  it("deduplicates and caps recommendations to top 6 actions", () => {
    const state = createInitialState();
    state.sales = [
      {
        id: "s1",
        invoice: "INV-1",
        date: "2026-01-01",
        customer: "Test",
        subtotal: 100,
        vat: Number.NaN,
        total: 105,
        items: 1,
        profit: 0,
        status: "Unpaid",
        method: "Cash",
        lineItems: [{ barcode: "LP-1", name: "Test Item", price: 100, cost: 100, profit: 0 }],
      },
    ];
    state.receipts = [
      { id: "r1", receipt: "R1", date: "2026-01-01", invoice: "INV-1", amount: 1000, method: "Cash", reference: "X" },
    ];
    state.ownerEntries = [{ id: "o1", date: "2026-01-01", type: "Withdraw", amount: 1000, note: "", balance: -100 }];

    const roadmap = buildCompletionRoadmap(state, new Date("2026-02-12"));
    expect(roadmap.recommendedActions.length).toBeLessThanOrEqual(6);
    expect(new Set(roadmap.recommendedActions.map((a) => a.id)).size).toBe(roadmap.recommendedActions.length);
  });
});
