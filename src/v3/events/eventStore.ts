import type { NewV3DomainEvent, V3DomainEvent, V3EventEnvelope } from "@/v3/events/types";

const nowIso = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export class InMemoryEventStore {
  private events: V3EventEnvelope[] = [];

  append(event: NewV3DomainEvent): V3DomainEvent {
    const envelope: V3DomainEvent = {
      id: event.id ?? uid(),
      ts: event.ts ?? nowIso(),
      ...event,
    } as V3DomainEvent;

    this.events.push(envelope);
    return envelope;
  }

  all() {
    return [...this.events];
  }

  byAggregate(aggregateId: string) {
    return this.events.filter((event) => event.aggregateId === aggregateId);
  }

  clear() {
    this.events = [];
  }
}
