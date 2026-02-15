import { describe, expect, it } from "vitest";
import {
  clearOfflineQueue,
  countOfflineConflicts,
  enqueueOfflineAction,
  readOfflineQueue,
  removeOfflineAction,
  replayOfflineAction,
  countRepeatedConflictExceptions,
} from "@/utils/offlineQueue";

describe("offlineQueue utils", () => {
  it("enqueues and reads offline actions", () => {
    clearOfflineQueue();
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    const queue = readOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("WIP_ADD_PART");
    expect(queue[0].status).toBe("pending");
  });

  it("marks duplicate actions as conflicts", () => {
    clearOfflineQueue();
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    const queue = readOfflineQueue();
    expect(countOfflineConflicts(queue)).toBe(1);
  });

  it("counts repeated conflict exceptions", () => {
    clearOfflineQueue();
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued add part", payload: { wipId: "W1" } });
    const queue = readOfflineQueue();
    expect(countRepeatedConflictExceptions(queue)).toBe(1);
  });

  it("replays and removes one queued action", () => {
    clearOfflineQueue();
    enqueueOfflineAction({ type: "WIP_ADD_LABOR", summary: "Queued labor" });
    const id = readOfflineQueue()[0].id;
    const replayed = replayOfflineAction(id);
    expect(replayed?.type).toBe("WIP_ADD_LABOR");
    expect(readOfflineQueue().length).toBe(0);
  });

  it("removes one queued action", () => {
    clearOfflineQueue();
    enqueueOfflineAction({ type: "WIP_ADD_LABOR", summary: "Queued labor" });
    enqueueOfflineAction({ type: "WIP_ADD_PART", summary: "Queued part" });
    const queue = readOfflineQueue();
    const trimmed = removeOfflineAction(queue[0].id);
    expect(trimmed.length).toBe(1);
  });

  it("clears queue", () => {
    enqueueOfflineAction({ type: "WIP_ADD_LABOR", summary: "Queued labor" });
    clearOfflineQueue();
    expect(readOfflineQueue()).toEqual([]);
  });
});
