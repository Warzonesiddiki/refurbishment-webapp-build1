import { describe, expect, it } from "vitest";
import { buildLanHintUrl, getLanAccessTip, isLocalhostHost, normalizePort } from "@/utils/network";

describe("network utils", () => {
  it("detects localhost hosts", () => {
    expect(isLocalhostHost("localhost")).toBe(true);
    expect(isLocalhostHost("127.0.0.1")).toBe(true);
    expect(isLocalhostHost("192.168.1.10")).toBe(false);
  });

  it("builds LAN access tips", () => {
    expect(getLanAccessTip("http://192.168.x.x:5173")).toContain("same Wi‑Fi");
  });

  it("normalizes ports and LAN hint URL", () => {
    expect(normalizePort(":5173")).toBe("5173");
    expect(normalizePort("4173")).toBe("4173");
    expect(normalizePort("")).toBe("");
    expect(buildLanHintUrl("localhost", "5173", "http:")).toBe("http://192.168.x.x:5173");
    expect(buildLanHintUrl("10.0.0.5", ":4173", "http:")).toBe("http://10.0.0.5:4173");
  });
});
