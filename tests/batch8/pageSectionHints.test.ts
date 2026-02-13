import { describe, expect, it } from "vitest";
import { getPageSectionHint, PAGE_SECTION_HINTS } from "@/components/pages/pageSectionHints";

describe("pageSectionHints", () => {
  it("returns configured hint objects for every guided page", () => {
    const keys = Object.keys(PAGE_SECTION_HINTS) as Array<keyof typeof PAGE_SECTION_HINTS>;
    expect(keys.length).toBeGreaterThan(0);

    keys.forEach((key) => {
      const hint = getPageSectionHint(key);
      expect(hint.title.length).toBeGreaterThan(0);
      expect(hint.summary.length).toBeGreaterThan(0);
      expect(hint.bullets.length).toBeGreaterThan(0);
    });
  });
});
