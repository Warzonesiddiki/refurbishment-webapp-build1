import { useEffect, useMemo, useState } from "react";
import { actionLabels, ActionKey, actionKeys } from "@/data/actionKeys";
import { resolveActionRoute } from "@/utils/actionRouting";
import { formatShortcut, getActionShortcutLabel } from "@/utils/actionShortcuts";
import { cn } from "@/utils/cn";

type ActionCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  theme?: "cyber" | "pro";
};

const catalog = Object.values(actionKeys)
  .map((key) => ({
    key,
    label: actionLabels[key],
    route: resolveActionRoute(key),
    shortcut: formatShortcut(getActionShortcutLabel(key)),
  }))
  .filter((entry): entry is { key: ActionKey; label: string; route: string; shortcut: string } => Boolean(entry.route));

export function ActionCommandPalette({ open, onClose, onNavigate, theme = "cyber" }: ActionCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((item) =>
      [item.label, item.key, item.route, item.shortcut].join(" ").toLowerCase().includes(normalized)
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/45" onClick={onClose}>
      <div
        className={cn(
          "w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden",
          theme === "pro" ? "bg-white border-slate-200" : "glass-panel border-cyan-500/30"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("p-4 border-b", theme === "pro" ? "border-slate-200" : "border-cyan-500/20")}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, route, or key..."
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </div>
        <div className="max-h-[50vh] overflow-auto p-2">
          {filtered.length === 0 && (
            <p className={cn("p-4 text-sm", theme === "pro" ? "text-slate-500" : "text-cyan-300/60")}>No actions found.</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.route);
                onClose();
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between",
                theme === "pro" ? "hover:bg-slate-50" : "hover:bg-cyan-500/10"
              )}
            >
              <span className={cn("text-sm", theme === "pro" ? "text-slate-800" : "text-cyan-100")}>{item.label}</span>
              <div className="flex items-center gap-2">
                {item.shortcut && (
                  <span className={cn("text-[11px] px-2 py-1 rounded", theme === "pro" ? "bg-slate-100 text-slate-600" : "bg-cyan-500/10 text-cyan-300")}>{item.shortcut}</span>
                )}
                <span className={cn("text-[11px]", theme === "pro" ? "text-slate-500" : "text-cyan-400/70")}>{item.route}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
