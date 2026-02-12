import { useCallback, useEffect, useMemo, useState } from "react";
import { navigation, NavItem } from "@/data/mockData";
import { cn } from "@/utils/cn";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { NotificationPanel } from "@/components/ui/NotificationPanel";
import { useStore } from "@/context/StoreContext";
import { exportJson } from "@/utils/exporters";
import { toLocalDateStamp } from "@/utils/dateUtils";
import { resolveActionRoute } from "@/utils/actionRouting";
import { ActionKey } from "@/data/actionKeys";
import { parseBackupJson } from "@/utils/backup";

export type LayoutProps = {
  activePage: string;
  onNavigate: (id: string) => void;
  onToggleTheme?: () => void;
  theme?: "cyber" | "pro";
  children: React.ReactNode;
  onLogout?: () => void;
};

export function Layout({ activePage, onNavigate, onToggleTheme, theme = "cyber", children, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { state, dispatch } = useStore();

  const createBackup = useCallback(() => {
    const filename = `almasfufa-backup-${toLocalDateStamp()}.json`;
    exportJson(filename, state);
  }, [state]);

  const restoreBackup = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const proceed = window.confirm("Restore backup and replace current app state?");
      if (!proceed) return;

      try {
        const content = await file.text();
        const payload = parseBackupJson(content);
        dispatch({ type: "RESTORE_STATE", payload });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown restore error";
        window.alert(`Backup restore failed: ${reason}`);
      }
    };

    input.click();
  }, [dispatch]);

  const shortcutRoutes = useMemo<Record<string, ActionKey | "backup" | "restore-backup">>(
    () => ({
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
    }),
    []
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (target.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return;
      }

      const combo = [
        event.ctrlKey ? "ctrl" : "",
        event.shiftKey ? "shift" : "",
        event.altKey ? "alt" : "",
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      const action = shortcutRoutes[combo];
      if (!action) return;

      event.preventDefault();
      if (action === "backup") {
        createBackup();
        return;
      }

      if (action === "restore-backup") {
        restoreBackup();
        return;
      }

      const route = resolveActionRoute(action);
      if (route) onNavigate(route);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createBackup, onNavigate, restoreBackup, shortcutRoutes]);

  return (
    <div className="flex h-screen bg-grid">
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 px-3 py-2 rounded-lg text-xs",
          theme === "pro" ? "bg-blue-600 text-white" : "bg-cyan-500/20 text-cyan-200"
        )}
        style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
      >
        Skip to content
      </a>
      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={cn(
          "glass-panel hex-pattern transition-all duration-300 flex flex-col relative z-10",
          theme === "pro" ? "erp-sidebar" : "border-r border-cyan-500/10",
          sidebarOpen ? "w-72" : "w-16"
        )}
      >
        {/* Logo */}
        <div className={cn("p-4 flex items-center justify-between", theme === "pro" ? "border-b border-slate-200" : "border-b border-cyan-500/10")}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-lg",
                theme === "pro"
                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                  : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 neon-text-cyan animate-flicker"
              )}
            >
              ⬡
            </div>
            {sidebarOpen && (
              <div>
                <p
                  className={cn("text-sm font-bold tracking-wider", theme === "pro" ? "text-slate-900" : "text-cyan-300")}
                  style={{ fontFamily: theme === "pro" ? "Inter" : "Orbitron" }}
                >
                  ALMASFUFA
                </p>
                <p className={cn("text-[10px] tracking-widest uppercase", theme === "pro" ? "text-slate-500" : "text-cyan-500/50")}>
                  Manager v2.0
                </p>
              </div>
            )}
          </div>
                      <button
              aria-label="Toggle sidebar"
              className={cn(
                "transition-colors p-1",
                theme === "pro" ? "text-slate-500 hover:text-slate-900" : "text-cyan-500/60 hover:text-cyan-300"
              )}
              onClick={() => setSidebarOpen((p) => !p)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navigation.map((item) => (
            <NavGroup
              key={item.id}
              item={item}
              activePage={activePage}
              isActive={activePage === item.id || Boolean(item.children?.some((c) => c.id === activePage))}
              sidebarOpen={sidebarOpen}
              onNavigate={onNavigate}
              theme={theme}
            />
          ))}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className={cn("p-4 space-y-2", theme === "pro" ? "border-t border-slate-200" : "border-t border-cyan-500/10")}>
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn("uppercase tracking-wider", theme === "pro" ? "text-slate-500" : "text-cyan-500/40")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono", fontSize: "10px" }}
              >
                System
              </span>
              <span className="status-dot status-dot-online" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={theme === "pro" ? "text-slate-500" : "text-cyan-500/40"}>Backup</span>
              <span
                className={cn("text-[11px]", theme === "pro" ? "text-emerald-600" : "neon-text-green")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
              >
                READY
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={theme === "pro" ? "text-slate-500" : "text-cyan-500/40"}>Alerts</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-bold",
                  theme === "pro" ? "bg-red-50 text-red-600" : "cyber-badge-red"
                )}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
              >
                {state.alerts.length}
              </span>
            </div>
            <div className="divider-cyber mt-2" />
            <div
              className={cn("text-[10px] text-center", theme === "pro" ? "text-slate-400" : "text-cyan-500/20")}
              style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
            >
              v2.0.0 • {new Date().getFullYear()}
            </div>
          </div>
        )}
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header
          className={cn(
            "glass-panel px-6 py-4 flex items-center justify-between",
            theme === "pro" ? "erp-header" : "border-b border-cyan-500/10"
          )}
        >
          <div className="flex items-center gap-4">
            <button
              aria-label="Toggle sidebar"
              className={cn(
                "p-2 rounded-xl transition-all lg:hidden",
                theme === "pro" ? "text-slate-500 hover:bg-slate-100" : "hover:bg-cyan-500/5 text-cyan-500/50 hover:text-cyan-300"
              )}
              onClick={() => setSidebarOpen((p) => !p)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div>
              <p
                className={cn("text-[10px] uppercase tracking-[0.2em]", theme === "pro" ? "text-slate-400" : "text-cyan-500/40")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
              >
                {activePage.replace(/-/g, " / ")}
              </p>
              <h1
                className={cn("text-base font-bold capitalize", theme === "pro" ? "text-slate-900" : "text-cyan-100 tracking-wide")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Orbitron" }}
              >
                {activePage.replace(/-/g, " ")}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <GlobalSearch theme={theme} onNavigate={onNavigate} />

            {/* Quick Scan */}
            <button
              className={cn("btn-cyber flex items-center gap-2", theme === "pro" && "shadow-none")}
              data-action="scan"
              onClick={() => onNavigate("scanner")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              <span className="hidden sm:inline">SCAN</span>
            </button>

            {/* Alerts */}
            <NotificationPanel
              alerts={state.alerts}
              theme={theme}
              onClear={(id) => dispatch({ type: "CLEAR_ALERT", id })}
              onClearAll={() => state.alerts.forEach(a => dispatch({ type: "CLEAR_ALERT", id: a.id }))}
            />

            {/* Backup */}
            {onLogout && (
              <button
                className={cn("btn-ghost hidden md:flex items-center gap-2", theme === "pro" && "text-slate-600")}
                onClick={onLogout}
                data-action="logout"
              >
                Logout
              </button>
            )}

            <button className={cn("btn-ghost hidden md:flex items-center gap-2", theme === "pro" && "text-slate-600")} data-action="backup" onClick={createBackup}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Backup
            </button>
            <button className={cn("btn-ghost hidden md:flex items-center gap-2", theme === "pro" && "text-slate-600")} data-action="restore-backup" onClick={restoreBackup}>
              Restore
            </button>
            <div
              className={cn(
                "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl",
                theme === "pro" ? "border border-slate-200 bg-white theme-switch" : "border border-cyan-500/15 bg-cyan-500/5"
              )}
            >
              <span
                className={cn("text-[10px] uppercase tracking-[0.14em]", theme === "pro" ? "text-slate-400" : "text-cyan-500/50")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
              >
                Theme
              </span>
              <button
                className={cn("btn-ghost flex items-center gap-2 px-3 py-1", theme === "pro" && "text-slate-600")}
                data-action="toggle-theme"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M8.05 8.05 6.636 6.636m0 10.728 1.414-1.414m10.314-8.314-1.414 1.414" />
                </svg>
                <span className="text-xs font-semibold tracking-wide" style={{ fontFamily: theme === "pro" ? "Inter" : "Rajdhani" }}>
                  {theme === "pro" ? "Cyber" : "Pro"}
                </span>
              </button>
              <span className={`w-2.5 h-2.5 rounded-full ${theme === "pro" ? "bg-blue-500" : "bg-cyan-400"}`} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main id="main-content" className="flex-1 overflow-auto p-6 animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── NavGroup ── */
function NavGroup({
  item,
  isActive,
  sidebarOpen,
  onNavigate,
  activePage,
  theme,
}: {
  item: NavItem;
  isActive: boolean;
  sidebarOpen: boolean;
  onNavigate: (id: string) => void;
  activePage: string;
  theme: "cyber" | "pro";
}) {
  const [open, setOpen] = useState(isActive);

  const navIcons: Record<string, string> = {
    dashboard: "◆", scanner: "⊞", inventory: "⬢", receiving: "⇊",
    processing: "⚙", sales: "◈", purchases: "⬡", finance: "◇",
    master: "▣", reports: "◉", settings: "⚙",
  };

  return (
    <div className="space-y-0.5">
      <button
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-all relative overflow-hidden",
          isActive
            ? theme === "pro"
              ? "bg-slate-100 text-slate-900 border border-slate-200"
              : "bg-gradient-to-r from-cyan-500/10 to-purple-500/5 text-cyan-300 border border-cyan-500/20"
            : theme === "pro"
              ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              : "text-cyan-100/60 hover:text-cyan-200 hover:bg-cyan-500/5 border border-transparent"
        )}
        onClick={() => {
          if (item.children?.length) {
            setOpen((p) => !p);
          } else {
            onNavigate(item.id);
          }
        }}
      >
        {isActive && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-[2px]",
              theme === "pro"
                ? "bg-gradient-to-b from-blue-500 to-indigo-500"
                : "bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
            )}
          />
        )}
        <span
          className={cn(
            "text-base w-6 text-center",
            isActive
              ? theme === "pro"
                ? "text-blue-600"
                : "neon-text-cyan"
              : theme === "pro"
                ? "text-slate-400"
                : "text-cyan-500/40"
          )}
          style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
        >
          {navIcons[item.id] || "◈"}
        </span>
        {sidebarOpen && (
          <>
            <span className="flex-1 tracking-wide" style={{ fontFamily: theme === "pro" ? "Inter" : "Rajdhani", fontSize: '14px' }}>{item.label}</span>
            {item.children && (
              <svg
                className={cn("w-3.5 h-3.5 transition-transform", theme === "pro" ? "text-slate-400" : "text-cyan-500/30", open && "rotate-90")}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            )}
          </>
        )}
      </button>
      {sidebarOpen && item.children && open && (
        <div className={cn("ml-5 pl-3 space-y-0.5", theme === "pro" ? "border-l border-slate-200" : "border-l border-cyan-500/10")}>
          {item.children.map((child) => (
            <button
              key={child.id}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded text-[13px] transition-all",
                child.id === activePage
                  ? theme === "pro"
                    ? "text-blue-700 bg-blue-50 font-semibold"
                    : "text-cyan-300 bg-cyan-500/8 font-semibold"
                  : theme === "pro"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-cyan-100/40 hover:text-cyan-200 hover:bg-cyan-500/5"
              )}
              style={{ fontFamily: theme === "pro" ? "Inter" : "Rajdhani" }}
              onClick={() => onNavigate(child.id)}
            >
              <span className={cn("mr-2 text-[10px]", theme === "pro" ? "text-slate-400" : "text-cyan-500/20")}>▸</span>
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
