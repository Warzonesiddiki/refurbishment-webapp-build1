import { ActionKey } from "@/data/actionKeys";

export type ShortcutAction = ActionKey | "backup" | "restore-backup" | "command-palette";

export const KEYBOARD_SHORTCUT_MAP: Record<string, ShortcutAction> = {
  "ctrl+/": "scan",
  "ctrl+s": "new-sale",
  "ctrl+l": "import-lot",
  "ctrl+g": "grade",
  "ctrl+shift+l": "add-laptop",
  "ctrl+shift+p": "add-part",
  "ctrl+shift+r": "export-reports",
  "ctrl+shift+w": "add-wip-job",
  "ctrl+b": "backup",
  "ctrl+shift+b": "restore-backup",
  "ctrl+k": "command-palette",
};

export function getActionShortcutLabel(action: ActionKey): string | null {
  const entry = Object.entries(KEYBOARD_SHORTCUT_MAP).find(([, value]) => value === action);
  return entry?.[0] ?? null;
}

export function formatShortcut(shortcut: string | null): string {
  if (!shortcut) return "";
  return shortcut
    .split("+")
    .map((segment) => {
      if (segment === "ctrl") return "Ctrl";
      if (segment === "shift") return "Shift";
      if (segment === "alt") return "Alt";
      return segment === "/" ? "/" : segment.toUpperCase();
    })
    .join("+");
}
