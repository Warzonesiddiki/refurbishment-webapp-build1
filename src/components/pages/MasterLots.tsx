import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import type { LotRecord } from "@/store/appState";

const statusColors: Record<string, string> = { Verified: "cyber-badge-green", Pending: "cyber-badge-yellow", "Partially Verified": "cyber-badge-yellow", Grading: "cyber-badge-purple", "Partially Graded": "cyber-badge-purple", "Fully Graded": "cyber-badge-cyan", Completed: "cyber-badge-green" };

export function MasterLots() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logExport } = useIdempotentAction("export-lots", "lot");
  const { run: logAdd } = useIdempotentAction("add-lot", "lot");
  const { trigger } = useUiActionFeedback();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ lot: "", supplier: "", received: "", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 });
  const [selected, setSelected] = useState<LotRecord | null>(null);

  const lots = useMemo(() => {
    let data = state.lots;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(l => l.lot.toLowerCase().includes(q) || l.supplier.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") data = data.filter(l => l.status === statusFilter);
    return data;
  }, [state.lots, search, statusFilter]);

  const resetForm = () => {
    setForm({ lot: "", supplier: "", received: "", status: "Pending", items: 0, verified: 0, graded: 0, cost: 0 });
    setShowAdd(false);
  };

  const addLot = () => {
    if (!form.lot || !form.supplier) return;
    logAdd("new-lot", { source: "ui" });
    dispatch({ type: "ADD_LOT", payload: { ...form } });
    trigger("success", "Lot added");
    resetForm();
  };

  const deleteLot = (id: string) => {
    dispatch({ type: "DELETE_LOT", id });
    trigger("success", "Lot deleted");
  };

  const handleExport = () => {
    logExport("lots-list", { count: lots.length });
    const rows = [
      ["Lot", "Supplier", "Received", "Status", "Items", "Verified", "Graded", "Cost"],
      ...lots.map(l => [l.lot, l.supplier, l.received, l.status, String(l.items), String(l.verified), String(l.graded), String(l.cost)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lots-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    trigger("info", "Exported lots CSV");
  };

  return (
    <div data-page="master-lots" data-testid="page-master-lots" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>LOTS</h1>
            <span className="cyber-chip">{lots.length} lots</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Lot management • Detail modal • Print manifest • Delete constraints</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" data-action="export-lots" onClick={handleExport}>↗ Export</button>
          <button className="btn-cyber" data-action="add-lot" onClick={() => setShowAdd(true)}>+ Add Lot</button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card neon-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>ADD LOT</h3>
            <button className="btn-ghost text-xs" onClick={resetForm}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input placeholder="Lot Number *" value={form.lot} onChange={e => setForm(p => ({ ...p, lot: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "Share Tech Mono" }} />
            <input placeholder="Supplier *" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="date" value={form.received} onChange={e => setForm(p => ({ ...p, received: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Items" value={form.items || ""} onChange={e => setForm(p => ({ ...p, items: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Cost" value={form.cost || ""} onChange={e => setForm(p => ({ ...p, cost: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <button className="btn-cyber" onClick={addLot}>✓ Save</button>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm" placeholder="Search lot..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option><option>Pending</option><option>Partially Verified</option><option>Verified</option><option>Partially Graded</option><option>Fully Graded</option><option>Grading</option><option>Completed</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {lots.map((lot) => {
          const verifyPct = lot.items > 0 ? Math.round((lot.verified / lot.items) * 100) : 0;
          const gradePct = lot.items > 0 ? Math.round((lot.graded / lot.items) * 100) : 0;
          const overallPct = Math.round((verifyPct + gradePct) / 2);
          return (
            <div key={lot.id} className="glass-card corner-marks p-5 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setSelected(lot)}>
              <div className="flex items-center justify-between mb-3">
                <span className="neon-text-cyan text-[12px] font-bold" style={{ fontFamily: "Share Tech Mono" }}>{lot.lot}</span>
                <span className={`cyber-chip ${statusColors[lot.status] || "cyber-chip"}`}>{lot.status}</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[11px]"><span className="text-cyan-100/40">Supplier</span><span className="text-cyan-100/60 font-semibold">{lot.supplier}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-cyan-100/40">Received</span><span className="text-cyan-300/30" style={{ fontFamily: "Share Tech Mono" }}>{lot.received}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-cyan-100/40">Items</span><span className="text-cyan-100/60 font-bold" style={{ fontFamily: "Orbitron" }}>{lot.items}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-cyan-100/40">Cost</span><span className="neon-text-green" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {lot.cost.toLocaleString()}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-cyan-100/40">Overall Progress</span><span className="text-cyan-100/70 font-bold" style={{ fontFamily: "Share Tech Mono" }}>{overallPct}%</span></div>
              </div>
              <div className="space-y-2">
                <div><div className="flex justify-between text-[10px] mb-1"><span className="text-cyan-500/30">Verified</span><span className="text-cyan-400/40" style={{ fontFamily: "Share Tech Mono" }}>{lot.verified}/{lot.items} ({verifyPct}%)</span></div><div className="progress-cyber h-1.5"><div className="progress-cyber-fill" style={{ width: `${verifyPct}%` }} /></div></div>
                <div><div className="flex justify-between text-[10px] mb-1"><span className="text-cyan-500/30">Graded</span><span className="text-cyan-400/40" style={{ fontFamily: "Share Tech Mono" }}>{lot.graded}/{lot.items} ({gradePct}%)</span></div><div className="progress-cyber h-1.5"><div className="progress-cyber-fill" style={{ width: `${gradePct}%`, background: "linear-gradient(90deg, var(--cp-purple), var(--cp-magenta))" }} /></div></div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-cyan-500/10">
                <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold flex-1 text-center">View</button>
                <button className="text-[11px] text-purple-400/50 hover:text-purple-300 font-semibold flex-1 text-center">Manifest</button>
                <button className="text-[11px] text-red-400/50 hover:text-red-300 font-semibold flex-1 text-center" onClick={(e) => { e.stopPropagation(); deleteLot(lot.id); }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card neon-border w-full max-w-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>{selected.lot}</h3>
                <p className="text-sm text-cyan-400/40">{selected.supplier} • {selected.received}</p>
              </div>
              <button className="btn-ghost" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-cyan-500/30">Items</span><div className="neon-text-cyan" style={{ fontFamily: "Share Tech Mono" }}>{selected.items}</div></div>
              <div><span className="text-cyan-500/30">Cost</span><div className="neon-text-green" style={{ fontFamily: "Share Tech Mono" }}>AED {selected.cost}</div></div>
              <div><span className="text-cyan-500/30">Verified</span><div className="text-cyan-200/70">{selected.verified} ({selected.items > 0 ? Math.round((selected.verified / selected.items) * 100) : 0}%)</div></div>
              <div><span className="text-cyan-500/30">Graded</span><div className="text-cyan-200/70">{selected.graded} ({selected.items > 0 ? Math.round((selected.graded / selected.items) * 100) : 0}%)</div></div>
            </div>
            <div className="divider-cyber" />
            <div className="flex gap-3 justify-end">
              <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="btn-cyber" onClick={() => window.print()}>🖨️ Print Manifest</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
