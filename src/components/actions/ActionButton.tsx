import { ActionKey, actionLabels } from "@/data/actionKeys";
import { cn } from "@/utils/cn";

const toneStyles: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:text-slate-800",
};

export function ActionButton({
  action,
  label,
  tone = "secondary",
  icon,
  className,
}: {
  action: ActionKey;
  label?: string;
  tone?: "primary" | "secondary" | "ghost";
  icon?: string;
  className?: string;
}) {
  return (
    <button
      data-action={action}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        toneStyles[tone],
        className
      )}
    >
      {icon ? <span className="text-base">{icon}</span> : null}
      {label ?? actionLabels[action]}
    </button>
  );
}
