import type { NewV3DomainEvent, V3DomainEvent, V3EventEnvelope } from "@/v3/events/types";

const nowIso = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export interface EventPersistenceAdapter {
  load(key: string): V3EventEnvelope[];
  save(key: string, events: V3EventEnvelope[]): void;
  clear(key: string): void;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class LocalStorageEventAdapter implements EventPersistenceAdapter {
  load(key: string): V3EventEnvelope[] {
    if (!canUseLocalStorage()) return [];

    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as V3EventEnvelope[]) : [];
    } catch {
      return [];
    }
  }

  save(key: string, events: V3EventEnvelope[]): void {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(key, JSON.stringify(events));
  }

  clear(key: string): void {
    if (!canUseLocalStorage()) return;
    window.localStorage.removeItem(key);
  }
}

export class InMemoryEventAdapter implements EventPersistenceAdapter {
  private storage = new Map<string, V3EventEnvelope[]>();

  load(key: string): V3EventEnvelope[] {
    return [...(this.storage.get(key) ?? [])];
  }

  save(key: string, events: V3EventEnvelope[]): void {
    this.storage.set(key, [...events]);
  }

  clear(key: string): void {
    this.storage.delete(key);
  }
}

export class PersistentEventStore {
  private events: V3EventEnvelope[];

  constructor(
    private readonly key: string,
    private readonly adapter: EventPersistenceAdapter = new LocalStorageEventAdapter(),
  ) {
    this.events = adapter.load(key);
  }

  append(event: NewV3DomainEvent): V3DomainEvent {
    const envelope: V3DomainEvent = {
      id: event.id ?? uid(),
      ts: event.ts ?? nowIso(),
      ...event,
    } as V3DomainEvent;

    this.events.push(envelope);
    this.adapter.save(this.key, this.events);
    return envelope;
  }

  all() {
    return [...this.events];
  }

  byAggregate(aggregateId: string) {
    return this.events.filter((event) => event.aggregateId === aggregateId);
  }

  reload() {
    this.events = this.adapter.load(this.key);
    return this.all();
  }

  clear() {
    this.events = [];
    this.adapter.clear(this.key);
  }
}
