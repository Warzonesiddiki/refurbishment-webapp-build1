import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("wip completion linkage", () => {
  it("updates laptop readiness and lot graded counters on completion", () => {
    let state = createInitialState();
    const laptop = state.laptops.find((l) => l.status === "Pending Grading") ?? state.laptops[0];

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-7777",
        laptop: laptop.barcode,
        brand: `${laptop.brand} ${laptop.model}`,
        track: "Track C",
        stage: "Queue",
        assignedTo: "Tech",
        partsUsed: 0,
        partsCost: 0,
        laborHrs: 0,
        priority: "Normal",
        status: "Active",
        opened: "Feb 1",
        diagnosisNotes: "",
        parts: [],
        laborEntries: [],
        history: [],
      },
    });

    const created = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-7777");
    expect(created).toBeTruthy();

    state = appReducer(state, { type: "WIP_COMPLETE", wipId: created!.id });

    expect(state.laptops.find((l) => l.barcode === laptop.barcode)?.status).toBe("Ready for Sale");
    const lot = state.lots.find((x) => x.lot === laptop.lot);
    if (lot) {
      expect(lot.graded).toBeGreaterThanOrEqual(1);
    }
  });
});
