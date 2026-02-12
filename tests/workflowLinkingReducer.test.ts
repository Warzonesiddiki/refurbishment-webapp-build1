import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("workflow linking between receiving/purchases/inventory/wip", () => {
  it("syncs lot counters when laptop in lot moves through verification and grading", () => {
    let state = createInitialState();
    const lot = state.lots[0];
    const laptop = state.laptops.find((l) => l.lot === lot.lot);
    expect(laptop).toBeTruthy();

    state = appReducer(state, { type: "UPDATE_LAPTOP", id: laptop!.id, payload: { status: "Pending Grading" } });
    const afterVerify = state.lots.find((l) => l.id === lot.id)!;
    expect(afterVerify.verified).toBeGreaterThanOrEqual(1);

    state = appReducer(state, { type: "UPDATE_LAPTOP", id: laptop!.id, payload: { status: "In Processing", track: "Track C" } });
    const afterGrade = state.lots.find((l) => l.id === lot.id)!;
    expect(afterGrade.graded).toBeGreaterThanOrEqual(1);
  });

  it("creates supplier linkage automatically when adding lot or purchase", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LOT",
      payload: {
        lot: "ALM-LOT-202402-99",
        supplier: "New Source LLC",
        received: "2024-02-15",
        status: "Pending",
        items: 2,
        verified: 0,
        graded: 0,
        cost: 2000,
      },
    });

    expect(state.suppliers.some((s) => s.name === "New Source LLC")).toBe(true);
    expect(state.suppliers.find((s) => s.name === "New Source LLC")?.lots).toBe(1);

    state = appReducer(state, {
      type: "ADD_PURCHASE",
      payload: {
        purchase: "ALM-PO-202402-9999",
        date: "2024-02-16",
        supplier: "Auto Vendor",
        lot: "ALM-LOT-202402-99",
        subtotal: 1000,
        vat: 50,
        total: 1050,
        paid: "Due",
        status: "Open",
      },
    });

    expect(state.suppliers.some((s) => s.name === "Auto Vendor")).toBe(true);
    expect(state.lots.find((l) => l.lot === "ALM-LOT-202402-99")?.supplier).toBe("Auto Vendor");
    expect(state.lots.find((l) => l.lot === "ALM-LOT-202402-99")?.cost).toBe(3000);
  });

  it("keeps laptop and lot in-processing state aligned when WIP starts", () => {
    let state = createInitialState();
    const laptop = state.laptops[0];

    state = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-9999",
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

    expect(state.laptops.find((l) => l.id === laptop.id)?.status).toBe("In Processing");
    expect(state.laptops.find((l) => l.id === laptop.id)?.track).toBe("Track C");

    const lot = state.lots.find((x) => x.lot === laptop.lot);
    if (lot) {
      expect(lot.graded).toBeGreaterThanOrEqual(1);
    }
  });

  it("creates lot placeholder when purchase references unknown lot", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_PURCHASE",
      payload: {
        purchase: "ALM-PO-202402-PLH",
        date: "2024-02-20",
        supplier: "Placeholder Vendor",
        lot: "ALM-LOT-202402-PLH",
        subtotal: 500,
        vat: 25,
        total: 525,
        paid: "Due",
        status: "Open",
      },
    });

    const lot = state.lots.find((l) => l.lot === "ALM-LOT-202402-PLH");
    expect(lot).toBeTruthy();
    expect(lot?.supplier).toBe("Placeholder Vendor");
    expect(lot?.cost).toBe(500);
  });

});
