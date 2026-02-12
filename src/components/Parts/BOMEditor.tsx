import { useState } from "react";
import type { BOMItem } from "@/store/types/BOMTypes";

type BOMEditorProps = {
  onChange: (items: BOMItem[]) => void;
};

export function BOMEditor({ onChange }: BOMEditorProps) {
  const [items, setItems] = useState<BOMItem[]>([]);

  const add = () => {
    const next = [...items, { id: crypto.randomUUID(), partId: "part", quantity: 1, isOptional: false, alternatePartIds: [] }];
    setItems(next);
    onChange(next);
  };

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onChange(next);
  };

  return (
    <div>
      <button onClick={add}>Add Item</button>
      {items.map((i) => <div key={i.id}><span>{i.partId}</span><button onClick={() => remove(i.id)}>Remove</button></div>)}
    </div>
  );
}
