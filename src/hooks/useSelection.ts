import { useState } from "react";

export function useSelection(initial: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initial));
  return {
    selectedIds,
    toggle: (id: string) => setSelectedIds((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    }),
    clear: () => setSelectedIds(new Set()),
    setAll: (ids: string[]) => setSelectedIds(new Set(ids)),
  };
}
