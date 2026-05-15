import type { V3DomainEvent } from "@/v3/events/types";
import {
  rebuildJournalProjectionFromEvents,
  restoreJournalProjectionFromSnapshot,
  type JournalProjectionSnapshot,
  type JournalRow,
} from "@/v3/finance/journalProjection";

export interface ProjectionSnapshotAdapter {
  load(key: string): JournalProjectionSnapshot | null;
  save(key: string, snapshot: JournalProjectionSnapshot): void;
  clear(key: string): void;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class LocalStorageProjectionSnapshotAdapter implements ProjectionSnapshotAdapter {
  load(key: string): JournalProjectionSnapshot | null {
    if (!canUseLocalStorage()) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!Array.isArray(parsed.rows)) return null;
      if (typeof parsed.eventCount !== "number") return null;
      if (typeof parsed.capturedAt !== "string") return null;
      return parsed as JournalProjectionSnapshot;
    } catch {
      return null;
    }
  }

  save(key: string, snapshot: JournalProjectionSnapshot) {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  }

  clear(key: string) {
    if (!canUseLocalStorage()) return;
    window.localStorage.removeItem(key);
  }
}

export class InMemoryProjectionSnapshotAdapter implements ProjectionSnapshotAdapter {
  private readonly store = new Map<string, JournalProjectionSnapshot>();

  load(key: string): JournalProjectionSnapshot | null {
    return this.store.get(key) ?? null;
  }

  save(key: string, snapshot: JournalProjectionSnapshot) {
    this.store.set(key, snapshot);
  }

  clear(key: string) {
    this.store.delete(key);
  }
}

export type JournalProjectionWorkerConfig = {
  snapshotKey: string;
  adapter?: ProjectionSnapshotAdapter;
  rebuildThreshold?: number;
};

export class JournalProjectionWorker {
  private readonly adapter: ProjectionSnapshotAdapter;
  private readonly snapshotKey: string;
  private readonly rebuildThreshold: number;
  private pendingEvents = 0;

  private snapshot: JournalProjectionSnapshot = {
    version: 1,
    capturedAt: new Date(0).toISOString(),
    eventCount: 0,
    rows: [],
  };

  constructor(config: JournalProjectionWorkerConfig) {
    this.snapshotKey = config.snapshotKey;
    this.adapter = config.adapter ?? new LocalStorageProjectionSnapshotAdapter();
    this.rebuildThreshold = config.rebuildThreshold ?? 250;

    const persisted = this.adapter.load(this.snapshotKey);
    if (persisted) {
      this.snapshot = persisted;
    }
  }

  getSnapshot() {
    return this.snapshot;
  }

  getRows(): JournalRow[] {
    return restoreJournalProjectionFromSnapshot(this.snapshot);
  }

  applyEvent(_event: V3DomainEvent, allEvents: V3DomainEvent[]) {
    this.pendingEvents += 1;

    if (this.pendingEvents >= this.rebuildThreshold) {
      return this.rebuild(allEvents, "threshold");
    }

    const rebuilt = rebuildJournalProjectionFromEvents(allEvents);
    this.snapshot = rebuilt;
    this.adapter.save(this.snapshotKey, this.snapshot);

    return {
      mode: "incremental" as const,
      snapshot: this.snapshot,
    };
  }

  rebuild(allEvents: V3DomainEvent[], reason: "manual" | "scheduled" | "threshold" = "manual") {
    const rebuilt = rebuildJournalProjectionFromEvents(allEvents);
    this.snapshot = rebuilt;
    this.pendingEvents = 0;
    this.adapter.save(this.snapshotKey, this.snapshot);

    return {
      mode: "rebuild" as const,
      reason,
      snapshot: this.snapshot,
    };
  }

  clear() {
    this.pendingEvents = 0;
    this.snapshot = {
      version: 1,
      capturedAt: new Date(0).toISOString(),
      eventCount: 0,
      rows: [],
    };
    this.adapter.clear(this.snapshotKey);
  }
}
