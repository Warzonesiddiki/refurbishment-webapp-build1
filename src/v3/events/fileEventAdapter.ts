import fs from "node:fs";
import path from "node:path";
import type { EventPersistenceAdapter } from "@/v3/events/persistentEventStore";
import type { V3EventEnvelope } from "@/v3/events/types";

export class FileEventAdapter implements EventPersistenceAdapter {
  constructor(private readonly baseDir: string) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  load(key: string): V3EventEnvelope[] {
    const filePath = this.resolveFile(key);
    if (!fs.existsSync(filePath)) return [];

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as V3EventEnvelope[]) : [];
    } catch {
      return [];
    }
  }

  save(key: string, events: V3EventEnvelope[]): void {
    const filePath = this.resolveFile(key);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2), "utf8");
  }

  clear(key: string): void {
    const filePath = this.resolveFile(key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  private resolveFile(key: string) {
    const safe = key.replace(/[^a-zA-Z0-9-_:.]/g, "_");
    return path.join(this.baseDir, `${safe}.json`);
  }
}
