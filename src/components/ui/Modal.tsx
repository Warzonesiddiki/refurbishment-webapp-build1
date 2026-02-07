// ═══════════════════════════════════════════
// Reusable Modal Component
// ═══════════════════════════════════════════
import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

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

const sizeMap: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw]",
};

const badgeTones: Record<string, string> = {
  cyan: "cyber-chip",
  green: "cyber-chip cyber-badge-green",
  yellow: "cyber-chip cyber-badge-yellow",
  red: "cyber-chip cyber-badge-red",
  purple: "cyber-chip cyber-badge-purple",
};

export function Modal({ open, onClose, title, subtitle, badge, badgeTone = "cyan", size = "lg", children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full animate-slide-up glass-card border border-cyan-500/20 flex flex-col max-h-[90vh]",
          sizeMap[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-bold tracking-wider neon-text-cyan"
              style={{ fontFamily: "var(--font-heading, Orbitron)" }}
            >
              {title}
            </h2>
            {badge && <span className={badgeTones[badgeTone] || "cyber-chip"}>{badge}</span>}
          </div>
          <button
            onClick={onClose}
            className="text-cyan-500/30 hover:text-cyan-300 transition-colors p-1 rounded"
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {subtitle && (
          <p
            className="px-6 py-2 text-sm text-cyan-500/40 border-b border-cyan-500/5"
            style={{ fontFamily: "var(--font-mono, 'Share Tech Mono')" }}
          >
            {subtitle}
          </p>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-cyan-500/10 flex items-center justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
