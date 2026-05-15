import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("WIP labor timer + approval", () => {
  it("adds timer labor entry as pending approval", () => {
    let state = createInitialState();
    const wip = state.wipJobs[0];

    state = appReducer(state, {
      type: "WIP_ADD_LABOR",
      wipId: wip.id,
      tech: "Tech Timer",
      hours: 1.25,
      source: "timer",
      startedAt: "2026-01-01T10:00:00.000Z",
      endedAt: "2026-01-01T11:15:00.000Z",
    });

    const next = state.wipJobs.find((x) => x.id === wip.id)!;
    const entry = next.laborEntries[next.laborEntries.length - 1];
    expect(entry.source).toBe("timer");
    expect(entry.approved).toBe(false);
    expect(entry.startedAt).toContain("2026-01-01T10:00:00");
  });

  it("approves a pending labor entry", () => {
    let state = createInitialState();
    const wip = state.wipJobs[0];

    state = appReducer(state, {
      type: "WIP_ADD_LABOR",
      wipId: wip.id,
      tech: "Tech Timer",
      hours: 0.5,
      source: "timer",
    });

    const withPending = state.wipJobs.find((x) => x.id === wip.id)!;
    const pendingIndex = withPending.laborEntries.length - 1;

    state = appReducer(state, {
      type: "WIP_APPROVE_LABOR_ENTRY",
      wipId: wip.id,
      index: pendingIndex,
      approvedBy: "Supervisor",
    });

    const approved = state.wipJobs.find((x) => x.id === wip.id)!.laborEntries[pendingIndex];
    expect(approved.approved).toBe(true);
    expect(approved.approvedBy).toBe("Supervisor");
  });
});
