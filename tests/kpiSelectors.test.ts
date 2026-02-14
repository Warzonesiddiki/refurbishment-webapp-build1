import { describe, expect, it } from "vitest";
import { createInitialState, selectKpis, appReducer } from "@/store/appState";

describe("selectKpis", () => {
  it("computes pending verification from laptop statuses", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: {
        barcode: "ALM-LP-KPI-0001",
        brand: "Dell",
        model: "A",
        specs: "",
        grade: "B",
        status: "Pending Verification",
        track: "-",
        cost: 100,
        date: "2024-02-01",
      },
    });
    state = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: {
        barcode: "ALM-LP-KPI-0002",
        brand: "Dell",
        model: "B",
        specs: "",
        grade: "B",
        status: "Pending Grading",
        track: "-",
        cost: 100,
        date: "2024-02-01",
      },
    });

    const kpis = selectKpis(state);
    const expectedPending = state.laptops.filter((l) => l.status === "Pending Verification").length;
    expect(kpis.pendingVerification).toBe(expectedPending);
  });

  it("returns verification progress percent", () => {
    let state = createInitialState();
    state = {
      ...state,
      laptops: [
        ...state.laptops,
        {
          id: "kpi-1",
          barcode: "ALM-LP-KPIPCT-1",
          brand: "Dell",
          model: "One",
          specs: "",
          grade: "B",
          status: "Pending Verification",
          track: "-",
          cost: 100,
          date: "2024-01-01",
        },
        {
          id: "kpi-2",
          barcode: "ALM-LP-KPIPCT-2",
          brand: "Dell",
          model: "Two",
          specs: "",
          grade: "B",
          status: "Ready for Sale",
          track: "Track A",
          cost: 100,
          date: "2024-01-01",
        },
      ],
    };

    const kpis = selectKpis(state);
    const total = state.laptops.length;
    const verified = state.laptops.filter((l) => l.status !== "Pending Verification").length;
    expect(kpis.verificationProgressPct).toBe(Math.round((verified / total) * 100));
  });
  it("returns grading progress percent", () => {
    let state = createInitialState();
    state = {
      ...state,
      laptops: [
        {
          id: "g-1",
          barcode: "ALM-LP-GRAD-1",
          brand: "Dell",
          model: "One",
          specs: "",
          grade: "B",
          status: "Pending Verification",
          track: "-",
          cost: 100,
          date: "2024-01-01",
        },
        {
          id: "g-2",
          barcode: "ALM-LP-GRAD-2",
          brand: "Dell",
          model: "Two",
          specs: "",
          grade: "B",
          status: "Pending Grading",
          track: "-",
          cost: 100,
          date: "2024-01-01",
        },
        {
          id: "g-3",
          barcode: "ALM-LP-GRAD-3",
          brand: "Dell",
          model: "Three",
          specs: "",
          grade: "B",
          status: "Ready for Sale",
          track: "Track A",
          cost: 100,
          date: "2024-01-01",
        },
      ],
    };

    const kpis = selectKpis(state);
    expect(kpis.gradingProgressPct).toBe(33);
  });

});
