import { useEffect, useId, useRef } from "react";
import { cn } from "@/utils/cn";
import { FocusTrap } from "@/components/ui/FocusTrap";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw] h-[92vh]",
} as const;

const badgeTones: Record<string, string> = {
  cyan: "cyber-chip",
  green: "cyber-chip cyber-badge-green",
  purple: "cyber-chip cyber-badge-purple",
  red: "cyber-chip cyber-badge-red",
};

export function Modal({ open, onClose, title, subtitle, badge, badgeTone = "cyan", size = "md", children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <FocusTrap active={open}>
        <div
          className={cn(
            "relative w-full animate-slide-up glass-card border border-cyan-500/20 flex flex-col max-h-[90vh]",
            sizeMap[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 id={titleId} className="text-lg font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "var(--font-heading, Orbitron)" }}>
                {title}
              </h2>
              {badge && <span className={badgeTones[badgeTone] || "cyber-chip"}>{badge}</span>}
            </div>
            <button onClick={onClose} className="text-cyan-500/30 hover:text-cyan-300 transition-colors p-1 rounded" aria-label="Close dialog">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {subtitle && (
            <p className="px-6 py-2 text-sm text-cyan-500/40 border-b border-cyan-500/5" style={{ fontFamily: "var(--font-mono, 'Share Tech Mono')" }}>
              {subtitle}
            </p>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

          {footer && <div className="px-6 py-4 border-t border-cyan-500/10 flex items-center justify-end gap-3 flex-shrink-0">{footer}</div>}
        </div>
      </FocusTrap>
    </div>
  );
}
