import { describe, expect, it } from "vitest";
import { formatShortcut, getActionShortcutLabel, KEYBOARD_SHORTCUT_MAP } from "@/utils/actionShortcuts";

describe("action shortcuts", () => {
  it("includes command palette shortcut", () => {
    expect(KEYBOARD_SHORTCUT_MAP["ctrl+k"]).toBe("command-palette");
  });

  it("resolves action shortcut labels", () => {
    expect(formatShortcut(getActionShortcutLabel("scan"))).toBe("Ctrl+/");
    expect(formatShortcut(getActionShortcutLabel("add-wip-job"))).toBe("Ctrl+Shift+W");
  });

  it("returns empty format when shortcut is missing", () => {
    expect(formatShortcut(getActionShortcutLabel("export-sales"))).toBe("");
  });
});
