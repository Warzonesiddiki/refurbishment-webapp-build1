// ═══════════════════════════════════════════
// Notification / Alerts Panel
// ═══════════════════════════════════════════
import { useState } from "react";
import { cn } from "@/utils/cn";

type Alert = {
  id: string;
  title: string;
  description: string;
  tone: string;
  time?: string;
};

type Props = {
  alerts: Alert[];
  theme: "cyber" | "pro";
  onClear: (id: string) => void;
  onClearAll: () => void;
};

const toneColors: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
  red: { bg: "from-red-500/10 to-transparent", border: "border-red-500/20", icon: "⚠", dot: "bg-red-500" },
  yellow: { bg: "from-yellow-500/10 to-transparent", border: "border-yellow-500/20", icon: "◈", dot: "bg-yellow-500" },
  blue: { bg: "from-cyan-500/10 to-transparent", border: "border-cyan-500/20", icon: "ℹ", dot: "bg-cyan-500" },
  green: { bg: "from-green-500/10 to-transparent", border: "border-green-500/20", icon: "✓", dot: "bg-green-500" },
};

export function NotificationPanel({ alerts, theme, onClear, onClearAll }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div data-component="ui-NotificationPanel" data-testid="component-ui-NotificationPanel" className="relative">
      <button
        className={cn(
          "relative p-2 rounded-xl transition-all group",
          theme === "pro"
            ? "border border-slate-200 bg-white hover:bg-slate-50"
            : "border border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
        )}
        onClick={() => setOpen(o => !o)}
        aria-label={`${alerts.length} alerts`}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={cn(theme === "pro" ? "text-slate-500 group-hover:text-slate-800" : "text-red-400 group-hover:text-red-300")}
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {alerts.length > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border",
              theme === "pro"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-red-500/50 bg-red-500/20 neon-text-red animate-pulse-glow"
            )}
            style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 z-50 rounded-xl overflow-hidden max-h-96 overflow-y-auto",
            theme === "pro"
              ? "bg-white border border-slate-200 shadow-xl"
              : "glass-card border border-cyan-500/20"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3",
            theme === "pro" ? "bg-slate-50 border-b border-slate-200" : "bg-cyan-500/5 border-b border-cyan-500/10"
          )}>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider",
              theme === "pro" ? "text-slate-600" : "text-cyan-300"
            )} style={{ fontFamily: theme === "pro" ? "Inter" : "Orbitron" }}>
              Alerts ({alerts.length})
            </span>
            {alerts.length > 0 && (
              <button
                className={cn("text-[10px] font-bold uppercase tracking-wider",
                  theme === "pro" ? "text-blue-600 hover:text-blue-800" : "text-cyan-500/40 hover:text-cyan-300"
                )}
                onClick={() => { onClearAll(); setOpen(false); }}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Orbitron" }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Items */}
          {alerts.length === 0 ? (
            <div className="p-6 text-center">
              <p className={cn("text-sm", theme === "pro" ? "text-slate-400" : "text-cyan-500/25")}>
                No active alerts
              </p>
            </div>
          ) : (
            alerts.map(alert => {
              const tc = toneColors[alert.tone] || toneColors.yellow;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3 transition-all relative overflow-hidden",
                    theme === "pro"
                      ? "border-b border-slate-100 hover:bg-slate-50"
                      : `border-b border-cyan-500/5 hover:bg-cyan-500/5`
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-r pointer-events-none opacity-30", tc.bg)} />
                  <div className="relative flex items-start gap-3 flex-1">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", tc.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold",
                        theme === "pro" ? "text-slate-800" : "text-cyan-100/80"
                      )}>
                        {alert.title}
                      </p>
                      <p className={cn("text-[11px] mt-0.5",
                        theme === "pro" ? "text-slate-500" : "text-cyan-500/40"
                      )} style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}>
                        {alert.description}
                      </p>
                    </div>
                    <button
                      className={cn("text-[10px] px-2 py-0.5 rounded flex-shrink-0",
                        theme === "pro"
                          ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          : "text-cyan-500/20 hover:text-cyan-300 hover:bg-cyan-500/10"
                      )}
                      onClick={() => onClear(alert.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
