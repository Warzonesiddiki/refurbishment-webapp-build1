import { describe, expect, it } from "vitest";
import { getSettingsSectionHint, SETTINGS_SECTION_HINTS } from "@/components/pages/settingsHints";

describe("settings section hints", () => {
  it("returns hints for known sections", () => {
    const hint = getSettingsSectionHint("backup");
    expect(hint.title).toBe(SETTINGS_SECTION_HINTS.backup.title);
    expect(hint.bullets.length).toBeGreaterThan(0);
  });

  it("falls back to company hints for unknown sections", () => {
    const hint = getSettingsSectionHint("unknown-section");
    expect(hint).toEqual(SETTINGS_SECTION_HINTS.company);
  });
});
