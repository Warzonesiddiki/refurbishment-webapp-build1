import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("finance cash guard rails", () => {
  it("blocks cash movements when cash day is closed", () => {
    let state = createInitialState();
    state = appReducer(state, { type: "TOGGLE_CASH_DAY" });

    const next = appReducer(state, {
      type: "ADD_CASH_ENTRY",
      payload: {
        time: "10:00",
        type: "Cash In",
        desc: "Counter sale",
        amount: 100,
        balance: 100,
      },
    });

    expect(next.cashEntries.length).toBe(state.cashEntries.length);
    expect(next.alerts[0]?.title).toBe("Cash day closed");
  });

  it("blocks duplicate opening when cash day is already open", () => {
    const state = createInitialState();

    const next = appReducer(state, {
      type: "ADD_CASH_ENTRY",
      payload: {
        time: "09:00",
        type: "Opening",
        desc: "Open again",
        amount: 0,
        balance: 0,
      },
    });

    expect(next.cashEntries.length).toBe(state.cashEntries.length);
    expect(next.alerts[0]?.title).toBe("Cash day already open");
  });

  it("blocks closing when day is already closed", () => {
    let state = createInitialState();
    state = appReducer(state, { type: "TOGGLE_CASH_DAY" });

    const next = appReducer(state, {
      type: "ADD_CASH_ENTRY",
      payload: {
        time: "20:00",
        type: "Closing",
        desc: "Close",
        amount: 0,
        balance: 0,
      },
    });

    expect(next.cashEntries.length).toBe(state.cashEntries.length);
    expect(next.alerts[0]?.title).toBe("Cash day already closed");
  });
});
