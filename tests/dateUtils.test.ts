import { describe, expect, it } from "vitest";
import { formatDate, nextWipNumber, toLocalDateStamp } from "@/utils/dateUtils";

describe("dateUtils", () => {
  it("formats local date as YYYYMMDD", () => {
    const d = new Date(2026, 0, 5, 23, 59, 59);
    expect(toLocalDateStamp(d)).toBe("20260105");
  });

  it("formatDate uses local date parts", () => {
    const d = new Date(2026, 0, 5, 23, 59, 59);
    expect(formatDate(d.toString())).toBe("2026-01-05");
  });

  it("formatDate returns fallback for empty/invalid values", () => {
    expect(formatDate(undefined, "n/a")).toBe("n/a");
    expect(formatDate("bad-date", "n/a")).toBe("n/a");
  });

  it("nextWipNumber increments latest sequence for local day", () => {
    const d = new Date(2026, 0, 5, 10, 0, 0);
    const existing = [
      "ALM-WIP-20260105-0001",
      "ALM-WIP-20260105-0009",
      "ALM-WIP-20260104-0042",
    ];
    expect(nextWipNumber(existing, d)).toBe("ALM-WIP-20260105-0010");
  });

  it("nextWipNumber starts at 0001 when no jobs exist for local day", () => {
    const d = new Date(2026, 0, 6, 9, 0, 0);
    const existing = ["ALM-WIP-20260105-0003"];
    expect(nextWipNumber(existing, d)).toBe("ALM-WIP-20260106-0001");
  });

});
