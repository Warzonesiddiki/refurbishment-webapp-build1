type Props = {
  label: string;
  value: string | number;
  trend?: string;
  tone?: "cyan" | "magenta" | "green" | "purple" | "yellow" | "red" | "neutral";
  icon?: string;
};

const toneConfig: Record<string, { border: string; glow: string; text: string; bg: string; trendColor: string }> = {
  cyan: {
    border: "border-cyan-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]",
    text: "neon-text-cyan",
    bg: "from-cyan-500/8 to-transparent",
    trendColor: "text-cyan-400",
  },
  magenta: {
    border: "border-pink-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(255,0,170,0.15)]",
    text: "neon-text-magenta",
    bg: "from-pink-500/8 to-transparent",
    trendColor: "text-pink-400",
  },
  green: {
    border: "border-green-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]",
    text: "neon-text-green",
    bg: "from-green-500/8 to-transparent",
    trendColor: "text-green-400",
  },
  purple: {
    border: "border-purple-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(123,45,255,0.15)]",
    text: "neon-text-purple",
    bg: "from-purple-500/8 to-transparent",
    trendColor: "text-purple-400",
  },
  yellow: {
    border: "border-yellow-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(255,230,0,0.15)]",
    text: "neon-text-yellow",
    bg: "from-yellow-500/8 to-transparent",
    trendColor: "text-yellow-400",
  },
  red: {
    border: "border-red-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(255,0,60,0.15)]",
    text: "neon-text-red",
    bg: "from-red-500/8 to-transparent",
    trendColor: "text-red-400",
  },
  neutral: {
    border: "border-cyan-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(0,240,255,0.08)]",
    text: "text-cyan-100",
    bg: "from-cyan-500/5 to-transparent",
    trendColor: "text-cyan-400/60",
  },
};

export function KpiCard({ label, value, trend, tone = "cyan", icon }: Props) {
  const t = toneConfig[tone] || toneConfig.neutral;

  return (
    <div data-component="cards-KpiCard" data-testid="component-cards-KpiCard" className={`glass-card corner-marks p-4 ${t.border} ${t.glow} transition-all group relative overflow-hidden`}>
      {/* Background gradient */}
      <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${t.bg} pointer-events-none`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p
            className="text-[11px] uppercase tracking-[0.15em] text-cyan-500/40 kpi-label"
            style={{ fontFamily: 'Orbitron' }}
          >
            {label}
          </p>
          {icon && <span className="text-lg opacity-40">{icon}</span>}
        </div>
        <p className={`text-2xl font-bold ${t.text} tracking-wide kpi-value`} style={{ fontFamily: 'Orbitron' }}>
          {value}
        </p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={t.trendColor}>
              <path d={trend.startsWith("+") || trend.startsWith("↑") ? "M7 17l5-5 5 5" : "M7 7l5 5 5-5"} />
            </svg>
            <span className={`text-xs font-semibold ${t.trendColor}`} style={{ fontFamily: 'Share Tech Mono' }}>
              {trend}
            </span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent ${
        tone === "cyan" ? "via-cyan-500/30" :
        tone === "magenta" ? "via-pink-500/30" :
        tone === "green" ? "via-green-500/30" :
        tone === "purple" ? "via-purple-500/30" :
        tone === "yellow" ? "via-yellow-500/30" :
        tone === "red" ? "via-red-500/30" :
        "via-cyan-500/20"
      } to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
