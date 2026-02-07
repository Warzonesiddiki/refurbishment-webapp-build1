import { cn } from "@/utils/cn";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "cyan" | "green" | "yellow" | "red" | "purple";
  actions?: React.ReactNode;
  live?: boolean;
};

const badgeToneMap: Record<string, string> = {
  cyan: "cyber-chip",
  green: "cyber-chip cyber-badge-green",
  yellow: "cyber-chip cyber-badge-yellow",
  red: "cyber-chip cyber-badge-red",
  purple: "cyber-chip cyber-badge-purple",
};

export function PageHeader({ title, subtitle, badge, badgeTone = "cyan", actions, live }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1
            className={cn(
              "text-2xl font-bold tracking-wider neon-text-cyan card-title"
            )}
            style={{ fontFamily: "var(--font-heading, Orbitron)" }}
          >
            {title}
          </h1>
          {badge && (
            <span className={cn(badgeToneMap[badgeTone], live && "animate-pulse-glow")}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className="text-sm text-cyan-500/40 card-subtitle"
            style={{ fontFamily: "var(--font-mono, 'Share Tech Mono')" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
