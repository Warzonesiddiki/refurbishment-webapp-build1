import type { BackupModule } from "@/store/types/BackupTypes";

const dependencies: Record<BackupModule, BackupModule[]> = {
  INVENTORY: [], PARTS: [], WIP: ["INVENTORY", "PARTS"], SALES: ["INVENTORY", "MASTER_DATA"], PURCHASES: ["PARTS", "MASTER_DATA"], FINANCE: ["SALES", "PURCHASES"], MASTER_DATA: [], SETTINGS: [], AUDIT: [],
};

export function PartialRestoreSelector({ available, selected, onChange }: { available: BackupModule[]; selected: BackupModule[]; onChange: (next: BackupModule[]) => void }) {
  const toggle = (module: BackupModule) => {
    if (selected.includes(module)) {
      const dependents = selected.filter((m) => dependencies[m].includes(module));
      if (dependents.length) return;
      onChange(selected.filter((m) => m !== module));
      return;
    }
    const deps = dependencies[module];
    onChange(Array.from(new Set([...selected, module, ...deps])) as BackupModule[]);
  };

  return <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{available.map((m) => <button key={m} className={`p-2 rounded border text-xs ${selected.includes(m)?"border-cyan-400 bg-cyan-500/10":"border-cyan-500/20"}`} onClick={() => toggle(m)}>{m}{dependencies[m].length?` (needs ${dependencies[m].join(",")})`:""}</button>)}</div>;
}
