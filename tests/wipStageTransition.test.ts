import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("wip stage transition rules", () => {
  it("allows moving to immediate next stage", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-6666",
        laptop: state.laptops[0].barcode,
        brand: `${state.laptops[0].brand} ${state.laptops[0].model}`,
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

    const wip = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-6666")!;
    state = appReducer(state, { type: "WIP_MOVE_STAGE", wipId: wip.id, toStage: "Diagnosis" });

    expect(state.wipJobs.find((w) => w.id === wip.id)?.stage).toBe("Diagnosis");
  });

  it("blocks skipping stages", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-5555",
        laptop: state.laptops[1].barcode,
        brand: `${state.laptops[1].brand} ${state.laptops[1].model}`,
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

    const wip = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-5555")!;
    state = appReducer(state, { type: "WIP_MOVE_STAGE", wipId: wip.id, toStage: "Repair" });

    expect(state.wipJobs.find((w) => w.id === wip.id)?.stage).toBe("Queue");
    expect(state.alerts[0]?.title).toBe("Invalid stage transition");
  });

  it("reroutes Track C jobs to Track D testing when reaching To Testing", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-4444",
        laptop: state.laptops[2].barcode,
        brand: `${state.laptops[2].brand} ${state.laptops[2].model}`,
        track: "Track C",
        stage: "Repair Complete",
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

    const wip = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-4444")!;
    state = appReducer(state, { type: "WIP_MOVE_STAGE", wipId: wip.id, toStage: "To Testing" });

    const moved = state.wipJobs.find((w) => w.id === wip.id)!;
    expect(moved.track).toBe("Track D");
    expect(moved.stage).toBe("L1 Queue");
    expect(moved.history.some((h) => h.action.includes("Auto-routed to Track D"))).toBe(true);
  });


  it("creates Track E follow-up when Track D reaches L2 Failed", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-3333",
        laptop: state.laptops[0].barcode,
        brand: `${state.laptops[0].brand} ${state.laptops[0].model}`,
        track: "Track D",
        stage: "L2 Testing",
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

    const failed = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-3333")!;
    state = appReducer(state, { type: "WIP_MOVE_STAGE", wipId: failed.id, toStage: "L2 Failed" });

    const original = state.wipJobs.find((w) => w.id === failed.id)!;
    expect(original.status).toBe("Completed");

    const followup = state.wipJobs.find((w) => w.id !== failed.id && w.laptop === failed.laptop && w.track === "Track E");
    expect(followup).toBeTruthy();
    expect(followup?.stage).toBe("Queue");
    expect(state.alerts[0]?.title).toBe("Track E follow-up created");
  });


  it("does not create duplicate active Track E follow-ups for same laptop", () => {
    let state = createInitialState();
    const laptop = state.laptops[0];

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-2222",
        laptop: laptop.barcode,
        brand: `${laptop.brand} ${laptop.model}`,
        track: "Track E",
        stage: "Queue",
        assignedTo: "Tech",
        partsUsed: 0,
        partsCost: 0,
        laborHrs: 0,
        priority: "High",
        status: "Active",
        opened: "Feb 1",
        diagnosisNotes: "",
        parts: [],
        laborEntries: [],
        history: [],
      },
    });

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-1112",
        laptop: laptop.barcode,
        brand: `${laptop.brand} ${laptop.model}`,
        track: "Track D",
        stage: "L2 Testing",
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

    // Re-open prior Track E job to simulate existing active harvest follow-up.
    const existingTrackE = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-2222");
    expect(existingTrackE).toBeTruthy();
    state = appReducer(state, { type: "UPDATE_WIP", id: existingTrackE!.id, payload: { status: "Active" } });

    const beforeTrackECount = state.wipJobs.filter((w) => w.laptop === laptop.barcode && w.track === "Track E" && w.status !== "Completed").length;
    const failed = state.wipJobs.find((w) => w.wip === "ALM-WIP-20240201-1112")!;

    state = appReducer(state, { type: "WIP_MOVE_STAGE", wipId: failed.id, toStage: "L2 Failed" });

    const afterTrackECount = state.wipJobs.filter((w) => w.laptop === laptop.barcode && w.track === "Track E" && w.status !== "Completed").length;
    expect(afterTrackECount).toBe(beforeTrackECount);
    expect(state.alerts[0]?.title).toBe("Track E follow-up already open");
  });

});
