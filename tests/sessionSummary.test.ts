import { describe, expect, it, beforeEach } from "vitest";
import {
  appendSessionHistory,
  clearSessionHistory,
  clearLastSessionSummary,
  LAST_SESSION_SUMMARY_KEY,
  loadLastSessionSummary,
  loadSessionHistory,
  saveLastSessionSummary,
  SESSION_HISTORY_KEY,
  SESSION_SUMMARY_TTL_MS,
  evaluateSessionMomentum,
  summarizeSessionHistory,
} from "@/utils/sessionSummary";

describe("sessionSummary", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("saves and loads valid summary", () => {
    saveLastSessionSummary({ completedPercent: 88, pendingPercent: 12, endedAt: new Date().toISOString() });

    const loaded = loadLastSessionSummary();
    expect(loaded?.completedPercent).toBe(88);
    expect(loaded?.pendingPercent).toBe(12);
  });

  it("expires stale summary and clears storage", () => {
    saveLastSessionSummary({
      completedPercent: 40,
      pendingPercent: 60,
      endedAt: new Date(Date.now() - SESSION_SUMMARY_TTL_MS - 10_000).toISOString(),
    });

    const loaded = loadLastSessionSummary();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem(LAST_SESSION_SUMMARY_KEY)).toBeNull();
  });

  it("clears summary explicitly", () => {
    saveLastSessionSummary({ completedPercent: 10, pendingPercent: 90, endedAt: new Date().toISOString() });
    clearLastSessionSummary();
    expect(loadLastSessionSummary()).toBeNull();
  });

  it("appends and loads session history", () => {
    appendSessionHistory({ completedPercent: 60, pendingPercent: 40, endedAt: new Date().toISOString() });
    appendSessionHistory({ completedPercent: 90, pendingPercent: 10, endedAt: new Date().toISOString() });

    const history = loadSessionHistory();
    expect(history).toHaveLength(2);
    expect(history[0].completedPercent).toBe(90);
  });

  it("summarizes session history stats", () => {
    const stats = summarizeSessionHistory([
      { completedPercent: 90, pendingPercent: 10, endedAt: new Date().toISOString() },
      { completedPercent: 60, pendingPercent: 40, endedAt: new Date().toISOString() },
      { completedPercent: 30, pendingPercent: 70, endedAt: new Date().toISOString() },
    ]);

    expect(stats.totalSessions).toBe(3);
    expect(stats.averageCompletionPercent).toBe(60);
    expect(stats.bestCompletionPercent).toBe(90);
    expect(stats.worstCompletionPercent).toBe(30);
  });

  it("clears session history", () => {
    appendSessionHistory({ completedPercent: 77, pendingPercent: 23, endedAt: new Date().toISOString() });
    clearSessionHistory();
    expect(localStorage.getItem(SESSION_HISTORY_KEY)).toBeNull();
  });

  it("rejects future-dated summaries beyond allowed drift", () => {
    saveLastSessionSummary({
      completedPercent: 50,
      pendingPercent: 50,
      endedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    expect(loadLastSessionSummary()).toBeNull();
  });

  it("normalizes and prunes invalid history records", () => {
    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify([
        { completedPercent: 110, pendingPercent: -10, endedAt: new Date().toISOString() },
        { completedPercent: 20, pendingPercent: 80, endedAt: "invalid-date" },
      ])
    );

    const history = loadSessionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].completedPercent).toBe(100);
    expect(history[0].pendingPercent).toBe(0);
  });

  it("detects upward momentum from recent sessions", () => {
    const momentum = evaluateSessionMomentum([
      { completedPercent: 92, pendingPercent: 8, endedAt: new Date().toISOString() },
      { completedPercent: 90, pendingPercent: 10, endedAt: new Date(Date.now() - 1000).toISOString() },
      { completedPercent: 85, pendingPercent: 15, endedAt: new Date(Date.now() - 2000).toISOString() },
      { completedPercent: 60, pendingPercent: 40, endedAt: new Date(Date.now() - 3000).toISOString() },
    ]);
    expect(momentum.direction).toBe("up");
    expect(momentum.deltaPercent).toBeGreaterThan(1);
  });

  it("returns flat momentum for insufficient history", () => {
    const momentum = evaluateSessionMomentum([
      { completedPercent: 70, pendingPercent: 30, endedAt: new Date().toISOString() },
    ]);
    expect(momentum).toEqual({ direction: "flat", deltaPercent: 0 });
  });
});
