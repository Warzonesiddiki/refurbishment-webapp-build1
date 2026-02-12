import type { BOMTemplate } from "@/store/types/BOMTypes";
import type { PartRecord } from "@/store/types/PartTypes";

type BOMApplicationProps = {
  templates: BOMTemplate[];
  parts: PartRecord[];
  onApply: (templateId: string) => void;
};

export function BOMApplication({ templates, parts, onApply }: BOMApplicationProps) {
  return (
    <div className="space-y-2">
      <h3>BOM Application</h3>
      {templates.map((t) => (
        <button key={t.id} onClick={() => onApply(t.id)}>
          Apply {t.name} ({t.items.filter((i) => (parts.find((p) => p.id === i.partId)?.availableQty ?? 0) < i.quantity).length} shortages)
        </button>
      ))}
    </div>
  );
}
