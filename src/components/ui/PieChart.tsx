type PieDatum = { label: string; value: number; color?: string };

type Props = {
  data: PieDatum[];
  size?: number;
};

export function PieChart({ data, size = 180 }: Props) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let start = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="mx-auto">
      {data.map((d, idx) => {
        const pct = d.value / total;
        const end = start + pct;
        const x1 = Math.cos(2 * Math.PI * start);
        const y1 = Math.sin(2 * Math.PI * start);
        const x2 = Math.cos(2 * Math.PI * end);
        const y2 = Math.sin(2 * Math.PI * end);
        const large = pct > 0.5 ? 1 : 0;
        const path = `M16 16 L ${16 + 16 * x1} ${16 + 16 * y1} A 16 16 0 ${large} 1 ${16 + 16 * x2} ${16 + 16 * y2} Z`;
        start = end;
        return (
          <path
            key={d.label}
            d={path}
            fill={d.color ?? ["#00f0ff", "#7b2dff", "#39ff14", "#ff00aa"][idx % 4]}
            stroke="#0c0c1a"
            strokeWidth="0.2"
          />
        );
      })}
    </svg>
  );
}
