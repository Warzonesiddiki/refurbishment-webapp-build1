import { cn } from "@/utils/cn";

type ToastProps = {
  open: boolean;
  tone: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
};

const toneStyles: Record<string, { border: string; bg: string; icon: string; iconColor: string; text: string }> = {
  success: {
    border: "border-green-500/40",
    bg: "from-green-500/15 to-green-500/5",
    icon: "✓",
    iconColor: "neon-text-green",
    text: "text-green-300",
  },
  error: {
    border: "border-red-500/40",
    bg: "from-red-500/15 to-red-500/5",
    icon: "✕",
    iconColor: "neon-text-red",
    text: "text-red-300",
  },
  info: {
    border: "border-cyan-500/40",
    bg: "from-cyan-500/15 to-cyan-500/5",
    icon: "ℹ",
    iconColor: "neon-text-cyan",
    text: "text-cyan-300",
  },
};

export function Toast({ open, tone, message, onClose }: ToastProps) {
  if (!open) return null;

  const t = toneStyles[tone] || toneStyles.info;

  return (
    <div data-component="ui-Toast" data-testid="component-ui-Toast" className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm">
      <div
        className={cn(
          "glass-card p-4 border relative overflow-hidden",
          t.border
        )}
      >
        <div className={cn("absolute top-0 left-0 right-0 h-full bg-gradient-to-r pointer-events-none", t.bg)} />
        <div className="relative flex items-center gap-3">
          <span className={cn("text-lg", t.iconColor)}>{t.icon}</span>
          <p
            className={cn("text-sm font-semibold flex-1", t.text)}
            style={{ fontFamily: "var(--font-body, Rajdhani)" }}
          >
            {message}
          </p>
          {onClose && (
            <button
              className="text-cyan-500/30 hover:text-cyan-400 transition-colors text-sm"
              onClick={onClose}
              aria-label="Close notification"
            >
              ✕
            </button>
          )}
        </div>
        {/* Auto-close progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]">
          <div
            className={cn("h-full", tone === "success" ? "bg-green-500/40" : tone === "error" ? "bg-red-500/40" : "bg-cyan-500/40")}
            style={{
              animation: "shrinkWidth 2.5s linear forwards",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
