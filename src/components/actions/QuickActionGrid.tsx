import { actionKeys, ActionKey, actionLabels } from "@/data/actionKeys";
import { cn } from "@/utils/cn";

const quickActionList: { key: ActionKey; icon: string }[] = [
  { key: actionKeys.scan, icon: "📱" },
  { key: actionKeys.newSale, icon: "💰" },
  { key: actionKeys.importLot, icon: "📥" },
  { key: actionKeys.grade, icon: "⭐" },
  { key: actionKeys.addLaptop, icon: "💻" },
  { key: actionKeys.addPart, icon: "🔧" },
];

export function QuickActionGrid({ onAction }: { onAction?: (action: ActionKey) => void }) {
  return (
    <div data-component="actions-QuickActionGrid" data-testid="component-actions-QuickActionGrid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {quickActionList.map((item) => (
        <button
          key={item.key}
          data-action={item.key}
          className={cn(
            "p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-center",
            "transition"
          )}
          onClick={() => onAction?.(item.key)}
        >
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className="text-sm font-medium text-slate-800">{actionLabels[item.key]}</div>
        </button>
      ))}
    </div>
  );
}
