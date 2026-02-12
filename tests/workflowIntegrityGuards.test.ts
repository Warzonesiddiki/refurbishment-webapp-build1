import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("workflow integrity guards", () => {
  it("blocks duplicate laptop barcode creation", () => {
    const state = createInitialState();
    const existing = state.laptops[0];

    const next = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: {
        barcode: existing.barcode,
        brand: "Dell",
        model: "Duplicate",
        specs: "",
        grade: "B",
        status: "Pending Verification",
        track: "-",
        cost: 100,
        date: "2024-02-01",
      },
    });

    expect(next.laptops.length).toBe(state.laptops.length);
    expect(next.alerts[0]?.title).toBe("Duplicate barcode");
  });

  it("blocks WIP creation when laptop is missing", () => {
    const state = createInitialState();

    const next = appReducer(state, {
      type: "ADD_WIP",
      payload: {
        wip: "ALM-WIP-20240201-1111",
        laptop: "UNKNOWN-LAPTOP",
        brand: "Unknown",
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

    expect(next.wipJobs.length).toBe(state.wipJobs.length);
    expect(next.alerts[0]?.title).toBe("WIP blocked");
  });

  it("blocks lot deletion when laptops are still linked", () => {
    const state = createInitialState();
    const lot = state.lots.find((l) => state.laptops.some((lp) => lp.lot === l.lot));
    expect(lot).toBeTruthy();

    const next = appReducer(state, { type: "DELETE_LOT", id: lot!.id });

    expect(next.lots.length).toBe(state.lots.length);
    expect(next.alerts[0]?.title).toBe("Lot delete blocked");
  });

  it("blocks lot deletion when purchases are linked", () => {
    let state = createInitialState();

    state = appReducer(state, { type: "ADD_LOT", payload: { lot: "ALM-LOT-202402-DEL", supplier: "Vendor", received: "2024-02-01", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 } });
    state = appReducer(state, { type: "ADD_PURCHASE", payload: { purchase: "ALM-PO-202402-DEL", date: "2024-02-01", supplier: "Vendor", lot: "ALM-LOT-202402-DEL", subtotal: 100, vat: 5, total: 105, paid: "Due", status: "Open" } });

    const lot = state.lots.find((l) => l.lot === "ALM-LOT-202402-DEL");
    expect(lot).toBeTruthy();

    const next = appReducer(state, { type: "DELETE_LOT", id: lot!.id });

    expect(next.lots.some((l) => l.lot === "ALM-LOT-202402-DEL")).toBe(true);
    expect(next.alerts[0]?.title).toBe("Lot delete blocked");
  });


  it("blocks supplier deletion when operational links exist", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LOT",
      payload: { lot: "ALM-LOT-202402-SUP", supplier: "Locked Supplier", received: "2024-02-01", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 },
    });

    const supplier = state.suppliers.find((s) => s.name === "Locked Supplier");
    expect(supplier).toBeTruthy();

    const next = appReducer(state, { type: "DELETE_SUPPLIER", id: supplier!.id });

    expect(next.suppliers.length).toBe(state.suppliers.length);
    expect(next.alerts[0]?.title).toBe("Supplier delete blocked");
  });

  it("cascades supplier rename to lots and purchases", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LOT",
      payload: { lot: "ALM-LOT-202402-RN", supplier: "Rename Me", received: "2024-02-01", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 },
    });
    state = appReducer(state, {
      type: "ADD_PURCHASE",
      payload: { purchase: "ALM-PO-202402-RN", date: "2024-02-01", supplier: "Rename Me", lot: "ALM-LOT-202402-RN", subtotal: 100, vat: 5, total: 105, paid: "Due", status: "Open" },
    });

    const supplier = state.suppliers.find((s) => s.name === "Rename Me");
    expect(supplier).toBeTruthy();

    state = appReducer(state, { type: "UPDATE_SUPPLIER", id: supplier!.id, payload: { name: "Renamed Vendor" } });

    expect(state.lots.find((l) => l.lot === "ALM-LOT-202402-RN")?.supplier).toBe("Renamed Vendor");
    expect(state.purchases.find((p) => p.purchase === "ALM-PO-202402-RN")?.supplier).toBe("Renamed Vendor");
  });


  it("clamps lot counters on update and auto-marks verified when complete", () => {
    const state = createInitialState();
    const lot = state.lots[0];

    const next = appReducer(state, {
      type: "UPDATE_LOT",
      id: lot.id,
      payload: { items: 5, verified: 9, graded: 8, status: "Pending" },
    });

    const updated = next.lots.find((l) => l.id === lot.id)!;
    expect(updated.items).toBe(5);
    expect(updated.verified).toBe(5);
    expect(updated.graded).toBe(5);
    expect(updated.status).toBe("Verified");
  });

});
