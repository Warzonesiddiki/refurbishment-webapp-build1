import { describe, expect, it } from "vitest";
import { evaluateWipCompletionGate } from "@/utils/wipQualityGate";
import { createInitialState } from "@/store/appState";

describe("evaluateWipCompletionGate", () => {
  it("fails when required evidence is missing", () => {
    const wip = createInitialState().wipJobs[0];
    const gate = evaluateWipCompletionGate({ ...wip, diagnosisNotes: "", laborEntries: [], parts: [] });
    expect(gate.canComplete).toBe(false);
  });

  it("fails when labor exists but unapproved", () => {
    const wip = createInitialState().wipJobs[0];
    const gate = evaluateWipCompletionGate({
      ...wip,
      diagnosisNotes: "POST check complete",
      laborEntries: [{ tech: "Ali", hours: 1, rate: 15, date: "today", source: "timer", approved: false }],
      parts: [{ name: "RAM", barcode: "P1", cost: 10 }],
    });
    expect(gate.canComplete).toBe(false);
  });

  it("passes when notes, labor and parts exist", () => {
    const wip = createInitialState().wipJobs[0];
    const gate = evaluateWipCompletionGate({
      ...wip,
      diagnosisNotes: "POST check complete",
      laborEntries: [{ tech: "Ali", hours: 1, rate: 15, date: "today" }],
      parts: [{ name: "RAM", barcode: "P1", cost: 10 }],
    });
    expect(gate.canComplete).toBe(true);
  });
});
