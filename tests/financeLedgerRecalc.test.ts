import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("finance ledger recalculation", () => {
  it("recalculates cash balances and normalizes amount signs", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_CASH_ENTRY",
      payload: {
        time: "23:59",
        type: "Cash Out",
        desc: "Late expense",
        amount: 120,
        balance: 999999,
      },
    });

    const last = state.cashEntries[state.cashEntries.length - 1];
    const prev = state.cashEntries[state.cashEntries.length - 2];
    expect(last.amount).toBe(-120);
    expect(last.balance).toBe(prev.balance - 120);

    state = appReducer(state, { type: "DELETE_CASH_ENTRY", id: last.id });
    const restored = state.cashEntries[state.cashEntries.length - 1];
    expect(restored.balance).toBe(prev.balance);
  });

  it("recalculates owner balances and normalizes drawing sign", () => {
    let state = createInitialState();

    state = appReducer(state, {
      type: "ADD_OWNER_ENTRY",
      payload: {
        date: "2024-02-20",
        type: "Drawing",
        desc: "Owner withdrawal",
        amount: 1000,
        balance: 999999,
      },
    });

    const last = state.ownerEntries[state.ownerEntries.length - 1];
    const prev = state.ownerEntries[state.ownerEntries.length - 2];
    expect(last.amount).toBe(-1000);
    expect(last.balance).toBe(prev.balance - 1000);

    state = appReducer(state, { type: "DELETE_OWNER_ENTRY", id: last.id });
    const restored = state.ownerEntries[state.ownerEntries.length - 1];
    expect(restored.balance).toBe(prev.balance);
  });

  it("blocks owner drawings that exceed available capital", () => {
    let state = createInitialState();

    const initialCount = state.ownerEntries.length;
    const initialBalance = state.ownerEntries[state.ownerEntries.length - 1]?.balance ?? 0;

    state = appReducer(state, {
      type: "ADD_OWNER_ENTRY",
      payload: {
        date: "2024-02-21",
        type: "Drawing",
        desc: "Too-large owner withdrawal",
        amount: Math.abs(initialBalance) + 1,
        balance: 999999,
      },
    });

    expect(state.ownerEntries).toHaveLength(initialCount);
    expect(state.alerts[0]?.title).toBe("Owner drawing blocked");
  });
});
