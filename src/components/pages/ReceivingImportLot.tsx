import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

const steps = [
  { num: 1, label: "Lot Details", icon: "◈" },
  { num: 2, label: "Upload File", icon: "↑" },
  { num: 3, label: "Map Columns", icon: "⇄" },
  { num: 4, label: "Preview & Import", icon: "✓" },
];

export function ReceivingImportLot() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(1);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [supplier, setSupplier] = useState(state.suppliers[0]?.name || "");
  const [lotNumber, setLotNumber] = useState(`ALM-LOT-${new Date().toISOString().slice(0, 7).replace("-", "")}-01`);
  const [totalCost, setTotalCost] = useState(0);
  const [mapping, setMapping] = useState({ barcode: "barcode", brand: "brand", model: "model", cost: "cost" });
  const requiredMapped = Object.values(mapping).every((v) => v && v.trim().length > 0);

  const { run: logCommit } = useIdempotentAction("import-lot-commit", "lot");
  const { trigger } = useUiActionFeedback();

  const previewRows = useMemo(() => {
    const seen = new Set<string>();
    const existing = new Set(state.laptops.map((l) => l.barcode.toUpperCase()));

    return rawRows.map((r) => {
      const barcode = (r[mapping.barcode] || "").trim();
      const normalized = barcode.toUpperCase();
      const brand = (r[mapping.brand] || "").trim();
      const model = (r[mapping.model] || "").trim();
      const cost = Number(r[mapping.cost] || 0);
      let error = "";

      if (!barcode || !brand || !model) error = "Missing required fields";
      else if (existing.has(normalized)) error = "Barcode already exists";
      else if (seen.has(normalized)) error = "Duplicate barcode in file";

      seen.add(normalized);
      return { barcode, brand, model, cost, error };
    });
  }, [rawRows, mapping, state.laptops]);

  const validRows = previewRows.filter((r) => !r.error);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(",");
      return headers.reduce<Record<string, string>>((acc, h, i) => {
        acc[h] = (cols[i] ?? "").trim();
        return acc;
      }, {});
    });
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    file.text().then((text) => setRawRows(parseCsv(text)));
  };

  const handleCommit = () => {
    if (!lotNumber.trim()) {
      trigger("error", "Lot number is required");
      return;
    }
    if (state.lots.some((l) => l.lot.toUpperCase() === lotNumber.trim().toUpperCase())) {
      trigger("error", `Lot ${lotNumber} already exists`);
      return;
    }
    if (validRows.length === 0) {
      trigger("error", "No valid rows to import");
      return;
    }

    logCommit(lotNumber, { validRows: validRows.length, totalRows: previewRows.length });
    dispatch({ type: "ADD_LOT", payload: { lot: lotNumber, supplier, received: new Date().toISOString().slice(0, 10), status: "Pending", items: validRows.length, verified: 0, graded: 0, cost: totalCost } });
    validRows.forEach((r) => {
      dispatch({ type: "ADD_LAPTOP", payload: { barcode: r.barcode, brand: r.brand, model: r.model, specs: "", grade: "B", status: "Pending Verification", track: "-", cost: r.cost, date: new Date().toISOString().slice(0, 10), lot: lotNumber } });
    });
    trigger("success", `Imported ${validRows.length} laptops`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>IMPORT LOT</h1>
            <span className="cyber-chip cyber-badge-purple">WIZARD</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Upload CSV • Map columns • Preview & import with error handling</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <button className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${step.num === activeStep ? "bg-cyan-500/10 border border-cyan-500/30 neon-text-cyan" : "text-cyan-500/20"}`} onClick={() => setActiveStep(step.num)}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-cyan-500/10 border border-cyan-500/20">{step.num}</span>
                <div className="hidden sm:block"><p className="text-[11px] font-bold tracking-wider" style={{ fontFamily: "Rajdhani" }}>{step.label}</p></div>
              </button>
              {idx < steps.length - 1 && <div className="flex-1 h-[1px] mx-2 bg-cyan-500/10" />}
            </div>
          ))}
        </div>
      </div>

      {activeStep === 1 && (
        <div className="glass-card corner-marks p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>Supplier</label>
              <select className="w-full px-3 py-2 rounded-lg text-sm" value={supplier} onChange={e => setSupplier(e.target.value)}>
                {state.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>Lot Number</label>
              <input className="w-full px-3 py-2 rounded-lg text-sm" value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>Total Cost</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" value={totalCost || ""} onChange={e => setTotalCost(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end mt-6"><button className="btn-cyber" onClick={() => setActiveStep(2)}>Next → Upload</button></div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="glass-card corner-marks p-6">
          <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0])} />
          {fileName && <p className="text-xs text-cyan-300/40 mt-2">Loaded: {fileName}</p>}
          <div className="flex justify-between mt-6"><button className="btn-ghost" onClick={() => setActiveStep(1)}>← Back</button><button className="btn-cyber" onClick={() => setActiveStep(3)}>Next → Map</button></div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="glass-card corner-marks p-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(mapping).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-cyan-100/60" style={{ fontFamily: "Share Tech Mono" }}>{key}</span>
                <input className="px-3 py-2 rounded-lg text-sm" value={val} onChange={e => setMapping(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6"><button className="btn-ghost" onClick={() => setActiveStep(2)}>← Back</button><button className="btn-cyber" disabled={!requiredMapped} onClick={() => setActiveStep(4)}>Next → Preview</button></div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="glass-card corner-marks p-6">
          <table className="w-full text-sm">
            <thead><tr><th className="py-2 px-3">Barcode</th><th className="py-2 px-3">Brand</th><th className="py-2 px-3">Model</th><th className="py-2 px-3">Cost</th><th className="py-2 px-3">Status</th></tr></thead>
            <tbody>{previewRows.map((r, i) => (
              <tr key={i}><td className="py-2 px-3 neon-text-cyan" style={{ fontFamily: "Share Tech Mono" }}>{r.barcode || "—"}</td><td className="py-2 px-3">{r.brand}</td><td className="py-2 px-3">{r.model}</td><td className="py-2 px-3">AED {r.cost}</td><td className="py-2 px-3">{r.error || "Valid"}</td></tr>
            ))}</tbody>
          </table>
          <p className="text-xs text-cyan-400/50 mt-3">
            Valid: {validRows.length} / {previewRows.length}
          </p>
          <div className="flex justify-between mt-6"><button className="btn-ghost" onClick={() => setActiveStep(3)}>← Back</button><button data-testid="import-commit" className="btn-cyber" onClick={handleCommit}>✓ Import {validRows.length} Rows</button></div>
        </div>
      )}
    </div>
  );
}
