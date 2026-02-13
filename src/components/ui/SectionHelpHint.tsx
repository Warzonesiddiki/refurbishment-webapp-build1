import type { ReactNode } from "react";

export type SectionHelpHintData = {
  title: string;
  summary: string;
  bullets: string[];
  tone?: "cyan" | "purple" | "yellow";
  action?: ReactNode;
};

const toneStyles: Record<NonNullable<SectionHelpHintData["tone"]>, string> = {
  cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-100/80",
  purple: "border-purple-500/25 bg-purple-500/10 text-purple-100/80",
  yellow: "border-yellow-500/25 bg-yellow-500/10 text-yellow-100/80",
};

/**
 * Reusable contextual hint block used to guide operators on each page section.
 */
export function SectionHelpHint({ hint }: { hint: SectionHelpHintData }) {
  const tone = hint.tone ?? "cyan";

  return (
    <div className={`glass-card p-4 border space-y-2 ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          HELP • {hint.title.toUpperCase()}
        </h3>
        <span className="text-[10px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
          GUIDED HINTS
        </span>
      </div>
      <p className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>{hint.summary}</p>
      <ul className="list-disc pl-4 space-y-1 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
        {hint.bullets.map((bullet, index) => (
          <li key={`${index}-${bullet}`}>{bullet}</li>
        ))}
      </ul>
      {hint.action ? <div className="pt-1">{hint.action}</div> : null}
    </div>
  );
}
