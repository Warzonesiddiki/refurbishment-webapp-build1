import { actionKeys, actionLabels, ActionKey } from "@/data/actionKeys";
import { cn } from "@/utils/cn";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

const quickActionList: { key: ActionKey; icon: string; tone?: string; hint?: string }[] = [
  { key: actionKeys.scan, icon: "📱", tone: "cyan", hint: "Ctrl+/" },
  { key: actionKeys.newSale, icon: "💰", tone: "magenta", hint: "Ctrl+S" },
  { key: actionKeys.importLot, icon: "📥", tone: "purple", hint: "Ctrl+L" },
  { key: actionKeys.grade, icon: "⭐", tone: "yellow", hint: "Ctrl+G" },
  { key: actionKeys.addLaptop, icon: "💻", tone: "cyan", hint: "Ctrl+Shift+L" },
  { key: actionKeys.addPart, icon: "🔧", tone: "green", hint: "Ctrl+Shift+P" },
];

const toneClass: Record<string, string> = {
  cyan: "text-cyan-300 border-cyan-500/15 hover:border-cyan-500/35 hover:bg-cyan-500/5",
  magenta: "text-pink-300 border-pink-500/15 hover:border-pink-500/35 hover:bg-pink-500/5",
  purple: "text-purple-300 border-purple-500/15 hover:border-purple-500/35 hover:bg-purple-500/5",
  green: "text-green-300 border-green-500/15 hover:border-green-500/35 hover:bg-green-500/5",
  yellow: "text-yellow-300 border-yellow-500/15 hover:border-yellow-500/35 hover:bg-yellow-500/5",
};

export function QuickActions({ onAction }: { onAction?: (action: ActionKey) => void }) {
  const { trigger } = useUiActionFeedback();

  return (
    <div data-component="sections-QuickActions" data-testid="component-sections-QuickActions" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {quickActionList.map((item) => (
        <button
          key={item.key}
          data-action={item.key}
          className={cn(
            "glass-card p-4 text-center border transition-all group cursor-pointer corner-marks relative overflow-hidden",
            toneClass[item.tone ?? "cyan"]
          )}
          onClick={() => {
            trigger("info", `${actionLabels[item.key]} triggered`);
            onAction?.(item.key);
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
          <div className="text-[12px] font-bold uppercase tracking-wider text-cyan-100/70 group-hover:text-cyan-100 transition-colors" style={{ fontFamily: 'Rajdhani' }}>
            {actionLabels[item.key]}
          </div>
          {item.hint && (
            <div className="mt-2 text-[10px] text-cyan-500/30" style={{ fontFamily: 'Share Tech Mono' }}>
              {item.hint}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
