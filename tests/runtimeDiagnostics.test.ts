import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRuntimeEvents,
  getBuildMetadata,
  listRuntimeEvents,
  recordRuntimeEvent,
} from "@/utils/runtimeDiagnostics";

describe("runtimeDiagnostics", () => {
  beforeEach(() => {
    clearRuntimeEvents();
  });

  it("records and lists runtime events", () => {
    recordRuntimeEvent({ level: "info", source: "test", message: "hello" });
    const events = listRuntimeEvents();

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe("test");
    expect(events[0].message).toBe("hello");
  });

  it("trims event history to max size", () => {
    for (let i = 0; i < 55; i += 1) {
      recordRuntimeEvent({ level: "info", source: "trim", message: `msg-${i}` });
    }
    const events = listRuntimeEvents();
    expect(events).toHaveLength(50);
  });

  it("exposes build metadata defaults", () => {
    const meta = getBuildMetadata();
    expect(meta.appVersion).toBeTruthy();
    expect(meta.buildHash).toBeTruthy();
    expect(meta.mode).toBeTruthy();
  });
});
