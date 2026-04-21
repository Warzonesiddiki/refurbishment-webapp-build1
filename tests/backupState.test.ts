import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { createBackupPayload, parseBackupPayload } from "@/utils/backupState";

describe("backupState", () => {
  it("creates a versioned backup envelope", () => {
    const state = createInitialState();
    const payload = createBackupPayload(state);

    expect(payload.version).toBe(1);
    expect(payload.app).toBe("ALMASFUFA");
    expect(payload.data.settings.companyName).toBe(state.settings.companyName);
  });

  it("parses legacy plain AppState backups", () => {
    const state = createInitialState();
    const parsed = parseBackupPayload(JSON.stringify(state));

    expect(parsed.error).toBeNull();
    expect(parsed.state?.laptops.length).toBe(state.laptops.length);
  });

  it("parses versioned backup envelope", () => {
    const state = createInitialState();
    const payload = createBackupPayload(state);
    const parsed = parseBackupPayload(JSON.stringify(payload));

    expect(parsed.error).toBeNull();
    expect(parsed.state?.settings.currency).toBe(state.settings.currency);
  });

  it("rejects malformed JSON", () => {
    const parsed = parseBackupPayload("{oops");

    expect(parsed.state).toBeNull();
    expect(parsed.error).toMatch(/Invalid JSON/i);
  });

  it("rejects incomplete payloads", () => {
    const parsed = parseBackupPayload(JSON.stringify({ hello: "world" }));

    expect(parsed.state).toBeNull();
    expect(parsed.error).toMatch(/missing required/i);
  });
});
