import { describe, expect, it } from "vitest";
import { formatElapsed, millisecondsToHours } from "@/utils/laborTimer";

describe("laborTimer utils", () => {
  it("converts milliseconds to hours", () => {
    expect(millisecondsToHours(3_600_000)).toBe(1);
    expect(millisecondsToHours(1_800_000)).toBe(0.5);
  });

  it("formats elapsed time as HH:MM:SS", () => {
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(3_723_000)).toBe("01:02:03");
  });
});
