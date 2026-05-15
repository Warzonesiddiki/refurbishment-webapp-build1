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

  it("blocks invalid laptop status transition", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: {
        barcode: "ALM-LP-TXN-0001",
        brand: "Dell",
        model: "Guard",
        specs: "",
        grade: "B",
        status: "Pending Verification",
        track: "-",
        cost: 100,
        date: "2024-02-01",
      },
    });

    const laptop = state.laptops.find((l) => l.barcode === "ALM-LP-TXN-0001");
    expect(laptop).toBeTruthy();

    const next = appReducer(state, { type: "UPDATE_LAPTOP", id: laptop!.id, payload: { status: "Sold" } });

    expect(next.laptops.find((l) => l.id === laptop!.id)?.status).toBe("Pending Verification");
    expect(next.alerts[0]?.title).toBe("Invalid laptop transition");
  });

  it("blocks invalid lot status transition", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LOT",
      payload: { lot: "ALM-LOT-202402-TXN", supplier: "Vendor", received: "2024-02-01", status: "Pending", items: 1, verified: 0, graded: 0, cost: 100 },
    });

    const lot = state.lots.find((l) => l.lot === "ALM-LOT-202402-TXN");
    expect(lot).toBeTruthy();

    const next = appReducer(state, { type: "UPDATE_LOT", id: lot!.id, payload: { status: "Completed" } });

    expect(next.lots.find((l) => l.id === lot!.id)?.status).toBe("Pending");
    expect(next.alerts[0]?.title).toBe("Invalid lot transition");
  });

  it("updates lot status to Partially Verified and then Partially Graded based on laptop progress", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LOT",
      payload: { lot: "ALM-LOT-202402-PCT", supplier: "Vendor", received: "2024-02-01", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 },
    });

    state = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: { barcode: "ALM-LP-PCT-0001", brand: "Dell", model: "One", specs: "", grade: "B", status: "Pending Verification", track: "-", cost: 100, date: "2024-02-01", lot: "ALM-LOT-202402-PCT" },
    });
    state = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: { barcode: "ALM-LP-PCT-0002", brand: "Dell", model: "Two", specs: "", grade: "B", status: "Pending Verification", track: "-", cost: 100, date: "2024-02-01", lot: "ALM-LOT-202402-PCT" },
    });

    const first = state.laptops.find((l) => l.barcode === "ALM-LP-PCT-0001")!;
    state = appReducer(state, { type: "UPDATE_LAPTOP", id: first.id, payload: { status: "Pending Grading" } });

    expect(state.lots.find((l) => l.lot === "ALM-LOT-202402-PCT")?.status).toBe("Partially Verified");

    const second = state.laptops.find((l) => l.barcode === "ALM-LP-PCT-0002")!;
    state = appReducer(state, { type: "UPDATE_LAPTOP", id: second.id, payload: { status: "Pending Grading" } });
    state = appReducer(state, { type: "UPDATE_LAPTOP", id: first.id, payload: { status: "In Processing" } });

    expect(state.lots.find((l) => l.lot === "ALM-LOT-202402-PCT")?.status).toBe("Partially Graded");
  });


});
