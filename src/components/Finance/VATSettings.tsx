import { useMemo, useState } from "react";
import { validateVATNumber } from "@/utils/vatCalculator";
import type { VATConfig, VATRate } from "@/store/types/VATTypes";

type Props = { config: VATConfig; rates: VATRate[]; onConfigChange?: (next: Partial<VATConfig>) => void; onAddRate?: (rate: Omit<VATRate, "id">) => void };

export function VATSettings({ config, rates, onConfigChange, onAddRate }: Props) {
  const [draft, setDraft] = useState({ code: "STANDARD", name: "Standard", rate: 15, effectiveFrom: new Date().toISOString().slice(0, 10) });
  const validNumber = useMemo(() => validateVATNumber(config.registrationNumber || ""), [config.registrationNumber]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">VAT Settings</h2>
      <section className="glass-card p-4 space-y-2">
        <h3 className="font-semibold">Registration Details</h3>
        <input value={config.registrationNumber} onChange={(e) => onConfigChange?.({ registrationNumber: e.target.value })} placeholder="Registration Number" />
        <div className={validNumber ? "text-green-500" : "text-red-500"}>{validNumber ? "Valid VAT number" : "Invalid VAT number format"}</div>
      </section>
      <section className="glass-card p-4 space-y-2">
        <h3 className="font-semibold">VAT Rates</h3>
        <table className="w-full text-sm"><tbody>{rates.map((r) => <tr key={r.id}><td>{r.code}</td><td>{r.rate}%</td><td>{r.effectiveFrom.slice(0,10)}</td></tr>)}</tbody></table>
        <div className="flex gap-2">
          <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          <input type="number" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: Number(e.target.value) })} />
          <button onClick={() => onAddRate?.({ ...draft, isDefault: false, effectiveTo: null, isActive: true })}>Add Rate</button>
        </div>
      </section>
    </div>
  );
}
