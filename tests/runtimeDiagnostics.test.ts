import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRuntimeEvents,
  getBuildMetadata,
  installGlobalRuntimeExceptionHandlers,
  listRuntimeEvents,
  recordRuntimeEvent,
  recordRuntimeException,
  setRuntimeTelemetrySink,
} from "@/utils/runtimeDiagnostics";

describe("runtimeDiagnostics", () => {
  beforeEach(() => {
    clearRuntimeEvents();
    setRuntimeTelemetrySink(null);
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

  it("normalizes unknown exceptions into runtime events", () => {
    recordRuntimeException({ foo: "bar" }, "test.exception");
    const events = listRuntimeEvents();

    expect(events).toHaveLength(1);
    expect(events[0].level).toBe("error");
    expect(events[0].source).toBe("test.exception");
    expect(events[0].message).toBe("Unknown runtime error");
  });

  it("emits telemetry payloads when a sink is registered", () => {
    const sink = vi.fn();
    setRuntimeTelemetrySink(sink);

    recordRuntimeEvent({ level: "warning", source: "sink", message: "hello sink" });

    expect(sink).toHaveBeenCalledTimes(1);
    const payload = sink.mock.calls[0][0];
    expect(payload.source).toBe("sink");
    expect(payload.message).toBe("hello sink");
    expect(payload.build.appVersion).toBeTruthy();
  });

  it("still emits telemetry when storage write fails", () => {
    const sink = vi.fn();
    setRuntimeTelemetrySink(sink);

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    recordRuntimeEvent({ level: "info", source: "storage-fail", message: "continue" });

    expect(setItemSpy).toHaveBeenCalled();
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0].source).toBe("storage-fail");

    setItemSpy.mockRestore();
  });

  it("registers and unregisters global runtime exception handlers", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const cleanup = installGlobalRuntimeExceptionHandlers();

    expect(addSpy).toHaveBeenCalledWith("error", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith("error", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("captures unhandled rejection events through global handlers", () => {
    const sink = vi.fn();
    setRuntimeTelemetrySink(sink);

    const cleanup = installGlobalRuntimeExceptionHandlers();

    const rejectionEvent = new Event("unhandledrejection") as Event & { reason?: unknown };
    rejectionEvent.reason = "boom";
    window.dispatchEvent(rejectionEvent);

    expect(sink).toHaveBeenCalled();
    const payload = sink.mock.calls.at(-1)?.[0];
    expect(payload.source).toBe("Window.UnhandledRejection");
    expect(payload.message).toBe("boom");

    cleanup();
  });

  it("exposes build metadata defaults", () => {
    const meta = getBuildMetadata();
    expect(meta.appVersion).toBeTruthy();
    expect(meta.buildHash).toBeTruthy();
    expect(meta.mode).toBeTruthy();
  });
});
