type AlertTone = "red" | "yellow" | "blue" | "green";

type Props = {
  title: string;
  description: string;
  tone?: AlertTone;
  onClear?: () => void;
};

const toneConfig: Record<AlertTone, { border: string; bg: string; icon: string; iconColor: string; dot: string }> = {
  red: {
    border: "border-red-500/20",
    bg: "from-red-500/8 to-transparent",
    icon: "⚠",
    iconColor: "neon-text-red",
    dot: "status-dot-danger",
  },
  yellow: {
    border: "border-yellow-500/20",
    bg: "from-yellow-500/8 to-transparent",
    icon: "◈",
    iconColor: "neon-text-yellow",
    dot: "status-dot-warning",
  },
  blue: {
    border: "border-cyan-500/20",
    bg: "from-cyan-500/8 to-transparent",
    icon: "ℹ",
    iconColor: "neon-text-cyan",
    dot: "status-dot-online",
  },
  green: {
    border: "border-green-500/20",
    bg: "from-green-500/8 to-transparent",
    icon: "✓",
    iconColor: "neon-text-green",
    dot: "status-dot-online",
  },
};

export function AlertCard({ title, description, tone = "yellow", onClear }: Props) {
  const t = toneConfig[tone];

  return (
    <div data-component="cards-AlertCard" data-testid="component-cards-AlertCard" className={`glass-card p-3 ${t.border} relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-full bg-gradient-to-r ${t.bg} pointer-events-none`} />
      <div className="relative flex items-start gap-3">
        <span className={`text-base mt-0.5 ${t.iconColor}`}>{t.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={t.dot} />
            <p className="text-sm font-bold text-cyan-100 tracking-wide" style={{ fontFamily: 'Rajdhani' }}>
              {title}
            </p>
          </div>
          <p className="text-xs text-cyan-300/50 leading-relaxed" style={{ fontFamily: 'Share Tech Mono', fontSize: '11px' }}>
            {description}
          </p>
        </div>
        {onClear && (
          <button
            aria-label="Clear alert"
            className="text-[10px] uppercase tracking-wider text-cyan-500/40 hover:text-cyan-300 transition-colors font-bold px-2 py-1 rounded border border-cyan-500/10 hover:border-cyan-500/30"
            style={{ fontFamily: 'Orbitron' }}
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
