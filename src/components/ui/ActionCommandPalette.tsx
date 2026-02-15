import { useEffect, useId, useMemo, useState } from "react";
import { actionLabels, ActionKey, actionKeys } from "@/data/actionKeys";
import { resolveActionRoute } from "@/utils/actionRouting";
import { formatShortcut, getActionShortcutLabel, ShortcutAction } from "@/utils/actionShortcuts";
import { cn } from "@/utils/cn";
import { FocusTrap } from "@/components/ui/FocusTrap";

type ActionCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onAction: (action: ShortcutAction) => void;
  recentPages?: string[];
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

const quickActions: { key: ShortcutAction; label: string; shortcut: string; description: string }[] = [
  { key: "command-palette", label: "Open Command Palette", shortcut: "Ctrl+K", description: "Fast action search" },
  { key: "backup", label: "Create Backup", shortcut: "Ctrl+B", description: "Download JSON snapshot" },
  { key: "restore-backup", label: "Restore Backup", shortcut: "Ctrl+Shift+B", description: "Import saved snapshot" },
];

function prettyPage(page: string) {
  return page.replace(/-/g, " ");
}

export function ActionCommandPalette({ open, onClose, onNavigate, onAction, recentPages = [], theme = "cyber" }: ActionCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const liveRegionId = useId();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
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
    return catalog.filter((item) => [item.label, item.key, item.route, item.shortcut].join(" ").toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    setActiveIndex((curr) => Math.min(curr, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const activeId = filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined;

  return (
    <div data-component="ui-ActionCommandPalette" data-testid="component-ui-ActionCommandPalette" className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/45" onClick={onClose}>
      <FocusTrap active={open}>
        <div
          className={cn("w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden", theme === "pro" ? "bg-white border-slate-200" : "glass-panel border-cyan-500/30")}
          onClick={(e) => e.stopPropagation()}
        >
          <div id={liveRegionId} className="sr-only" aria-live="polite">
            {filtered.length} actions found
          </div>
          <div className={cn("p-4 border-b", theme === "pro" ? "border-slate-200" : "border-cyan-500/20")}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && filtered[activeIndex]) {
                  e.preventDefault();
                  onNavigate(filtered[activeIndex].route);
                  onClose();
                }
              }}
              placeholder="Search action, route, or key..."
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
              role="combobox"
              aria-controls={listId}
              aria-expanded="true"
              aria-activedescendant={activeId}
            />
          </div>

          {query.trim().length === 0 && (
            <div className={cn("px-4 py-3 border-b", theme === "pro" ? "border-slate-200 bg-slate-50/70" : "border-cyan-500/20 bg-cyan-500/5")}>
              <div className="flex flex-wrap gap-2 items-center">
                {quickActions.map((quick) => (
                  <button
                    key={quick.key}
                    onClick={() => {
                      onAction(quick.key);
                      if (quick.key !== "command-palette") onClose();
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      theme === "pro"
                        ? "border-slate-200 text-slate-700 hover:bg-white"
                        : "border-cyan-500/20 text-cyan-200 hover:bg-cyan-500/10"
                    )}
                  >
                    {quick.label} <span className={cn(theme === "pro" ? "text-slate-400" : "text-cyan-400/70")}>({quick.shortcut})</span>
                  </button>
                ))}
              </div>
              {recentPages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn("text-[11px] mr-1", theme === "pro" ? "text-slate-500" : "text-cyan-400/70")}>Recent:</span>
                  {recentPages.map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        onNavigate(page);
                        onClose();
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] capitalize",
                        theme === "pro" ? "bg-white border border-slate-200 text-slate-700" : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
                      )}
                    >
                      {prettyPage(page)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div id={listId} role="listbox" className="max-h-[46vh] overflow-auto p-2">
            {filtered.length === 0 && <p className={cn("p-4 text-sm", theme === "pro" ? "text-slate-500" : "text-cyan-300/60")}>No actions found.</p>}
            {filtered.map((item, idx) => (
              <button
                id={`${listId}-option-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                key={item.key}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  onNavigate(item.route);
                  onClose();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between",
                  idx === activeIndex ? (theme === "pro" ? "bg-slate-100" : "bg-cyan-500/20") : theme === "pro" ? "hover:bg-slate-50" : "hover:bg-cyan-500/10"
                )}
              >
                <span className={cn("text-sm", theme === "pro" ? "text-slate-800" : "text-cyan-100")}>{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.shortcut && <span className={cn("text-[11px] px-2 py-1 rounded", theme === "pro" ? "bg-slate-100 text-slate-600" : "bg-cyan-500/10 text-cyan-300")}>{item.shortcut}</span>}
                  <span className={cn("text-[11px]", theme === "pro" ? "text-slate-500" : "text-cyan-400/70")}>{item.route}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
