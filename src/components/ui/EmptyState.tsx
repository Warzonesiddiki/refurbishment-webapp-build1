import { cn } from "@/utils/cn";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({ icon = "◈", title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("glass-card p-8 text-center space-y-3", className)}>
      <div className="text-4xl opacity-30 neon-text-cyan">{icon}</div>
      <h3 className="text-lg font-bold tracking-wide neon-text-cyan">{title}</h3>
      <p className="text-sm text-cyan-300/60">{description}</p>
      {actionLabel && onAction && (
        <button className="btn-cyber" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
