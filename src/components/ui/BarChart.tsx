type BarDatum = { label: string; value: number };

type Props = {
  data: BarDatum[];
  height?: number;
  tone?: "cyan" | "green" | "purple" | "magenta";
};

const toneMap: Record<string, string> = {
  cyan: "from-cyan-500/60 to-cyan-500/20",
  green: "from-green-500/60 to-green-500/20",
  purple: "from-purple-500/60 to-purple-500/20",
  magenta: "from-pink-500/60 to-pink-500/20",
};

export function BarChart({ data, height = 160, tone = "cyan" }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full flex items-end gap-2">
        {data.map((d) => {
          const pct = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-sm bg-gradient-to-t ${toneMap[tone]} border-t border-cyan-400/40 transition-all hover:brightness-110`}
                style={{ height: `${pct}%` }}
              />
              <span className="text-[8px] text-cyan-500/25" style={{ fontFamily: "var(--font-mono)" }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
