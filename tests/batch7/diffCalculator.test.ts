import { describe, expect, it } from "vitest";
import { computeArrayDiff, computeDiff, formatDiffForDisplay } from "@/utils/diffCalculator";

describe("diff calculator", () => {
  it("detects added removed changed with paths", () => {
    const diff = computeDiff({ a: 1, x: { y: 1 } }, { a: 2, b: 3, x: { y: 2 } });
    expect(diff.some((d) => d.path === "b" && d.type === "ADDED")).toBe(true);
    expect(diff.some((d) => d.path === "a" && d.type === "CHANGED")).toBe(true);
    expect(formatDiffForDisplay(diff).length).toBe(diff.length);
  });

  it("handles arrays", () => {
    const result = computeArrayDiff([{ id: 1, n: 1 }], [{ id: 1, n: 2 }, { id: 2, n: 1 }], "id");
    expect(result.added).toHaveLength(1);
    expect(result.modified).toHaveLength(1);
  });
});
