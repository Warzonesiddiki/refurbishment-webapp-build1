import { useState, useMemo, useRef } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { KpiCard } from "@/components/cards/KpiCard";
import type { Action, PartRecord } from "@/store/appState";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

type AddPartPayload = Extract<Action, { type: "ADD_PART" }>['payload'];

export function InventoryParts() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [condFilter, setCondFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PartRecord>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [showAdjust, setShowAdjust] = useState<PartRecord | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newPart, setNewPart] = useState<AddPartPayload>({ barcode: "", name: "", category: "", spec: "", condition: "New", onHand: 0, available: 0, reorder: 5, cost: 0, location: "" });
  const [historyPart, setHistoryPart] = useState<PartRecord | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let data = state.parts;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p => p.barcode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (catFilter !== "All") data = data.filter(p => p.category === catFilter);
    if (condFilter !== "All") data = data.filter(p => p.condition === condFilter);
    if (stockFilter === "In Stock") data = data.filter(p => p.onHand > p.reorder);
    else if (stockFilter === "Low Stock") data = data.filter(p => p.onHand > 0 && p.onHand <= p.reorder);
    else if (stockFilter === "Out of Stock") data = data.filter(p => p.onHand === 0);
    return data;
  }, [state.parts, search, catFilter, condFilter, stockFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const categories = [...new Set(state.parts.map(p => p.category))];
  const conditions = [...new Set(state.parts.map(p => p.condition))];

  const clearFilters = () => { setSearch(""); setCatFilter("All"); setCondFilter("All"); setStockFilter("All"); setPage(1); };

  const totalValue = state.parts.reduce((a, p) => a + p.onHand * p.cost, 0);
  const lowStock = state.parts.filter(p => p.onHand > 0 && p.onHand <= p.reorder).length;
  const outOfStock = state.parts.filter(p => p.onHand === 0).length;

  const startEdit = (part: PartRecord) => { setEditId(part.id); setEditData({ ...part }); };
  const saveEdit = () => {
    if (!editId) return;
    dispatch({ type: "UPDATE_PART", id: editId, payload: editData });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Updated part ${editData.barcode}`, time: "just now" } });
    setEditId(null);
  };

  const addPart = () => {
    if (!newPart.barcode || !newPart.name) return;
    dispatch({ type: "ADD_PART", payload: { ...newPart, available: newPart.onHand } });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Added part ${newPart.barcode}`, time: "just now" } });
    setNewPart({ barcode: "", name: "", category: "", spec: "", condition: "New", onHand: 0, available: 0, reorder: 5, cost: 0, location: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>PARTS</h1>
            <span className="cyber-chip">{state.parts.length} SKUs</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>Parts inventory • Stock tracking • Reorder alerts</p>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-ghost"
            onClick={() => {
              const rows = [["Barcode","Name","Category","Spec","Condition","OnHand","Available","Reorder","Cost","Location"], ...state.parts.map(p => [p.barcode, p.name, p.category, p.spec, p.condition, String(p.onHand), String(p.available), String(p.reorder), String(p.cost), p.location])];
              const csv = rows.map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `parts-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ↗ Export
          </button>
          <button
            className="btn-ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            ↙ Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const lines = text.split(/\r?\n/).filter(Boolean);
              if (lines.length === 0) return;
              const headers = lines[0].split(",").map(h => h.trim());
              lines.slice(1).forEach(line => {
                const cols = line.split(",");
                const row = headers.reduce<Record<string, string>>((acc, h, i) => { acc[h] = (cols[i] ?? "").trim(); return acc; }, {});
                dispatch({ type: "ADD_PART", payload: { barcode: row.Barcode || row.barcode, name: row.Name || row.name, category: row.Category || row.category || "", spec: row.Spec || row.spec || "", condition: row.Condition || "New", onHand: Number(row.OnHand || 0), available: Number(row.Available || row.OnHand || 0), reorder: Number(row.Reorder || 5), cost: Number(row.Cost || 0), location: row.Location || "" } });
              });
            }}
          />
          <button className="btn-cyber" onClick={() => setShowAdd(true)}>+ Add Part</button>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("inventoryParts")} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total SKUs" value={state.parts.length} tone="cyan" icon="⬢" />
        <KpiCard label="In Stock" value={state.parts.filter(p => p.onHand > p.reorder).length} tone="green" icon="✓" />
        <KpiCard label="Low Stock" value={lowStock} tone="yellow" icon="⚠" />
        <KpiCard label="Out of Stock" value={outOfStock} tone="red" icon="✕" />
        <KpiCard label="Total Value" value={`AED ${totalValue.toLocaleString()}`} tone="magenta" icon="◈" />
      </div>

      {/* Add Part */}
                  {showAdd && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>ADD NEW PART</h3>
            <button className="btn-ghost text-xs" onClick={() => setShowAdd(false)}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input placeholder="Barcode *" value={newPart.barcode} onChange={e => setNewPart(p => ({ ...p, barcode: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <input placeholder="Name *" value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Category" value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Specification" value={newPart.spec} onChange={e => setNewPart(p => ({ ...p, spec: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <select value={newPart.condition} onChange={e => setNewPart(p => ({ ...p, condition: e.target.value }))} className="px-3 py-2 rounded-lg text-sm">
              <option>New</option><option>Refurbished</option><option>Used</option><option>Harvested</option>
            </select>
            <input type="number" placeholder="Qty On Hand" value={newPart.onHand || ""} onChange={e => setNewPart(p => ({ ...p, onHand: Number(e.target.value), available: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Reorder Level" value={newPart.reorder || ""} onChange={e => setNewPart(p => ({ ...p, reorder: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Unit Cost" value={newPart.cost || ""} onChange={e => setNewPart(p => ({ ...p, cost: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <input placeholder="Location" value={newPart.location} onChange={e => setNewPart(p => ({ ...p, location: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <button className="btn-cyber" onClick={addPart}>✓ Add Part</button>
          </div>
        </div>
      )}

      {/* Edit Part */}
      {editId && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-purple" style={{ fontFamily: "var(--font-heading)" }}>EDIT PART — {editData.barcode}</h3>
            <button className="btn-ghost text-xs" onClick={() => setEditId(null)}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input placeholder="Name" value={editData.name || ""} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Category" value={editData.category || ""} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Specification" value={editData.spec || ""} onChange={e => setEditData(p => ({ ...p, spec: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="On Hand" value={editData.onHand ?? ""} onChange={e => setEditData(p => ({ ...p, onHand: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Reorder" value={editData.reorder ?? ""} onChange={e => setEditData(p => ({ ...p, reorder: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Unit Cost" value={editData.cost ?? ""} onChange={e => setEditData(p => ({ ...p, cost: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <input placeholder="Location" value={editData.location || ""} onChange={e => setEditData(p => ({ ...p, location: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <select value={editData.condition || ""} onChange={e => setEditData(p => ({ ...p, condition: e.target.value }))} className="px-3 py-2 rounded-lg text-sm">
              <option>New</option><option>Refurbished</option><option>Used</option><option>Harvested</option>
            </select>
            <button className="btn-cyber" onClick={saveEdit}>✓ Save</button>
          </div>
        </div>
      )}

      {/* Adjust Stock */}
      {showAdjust && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>ADJUST STOCK — {showAdjust.name}</h3>
            <button className="btn-ghost text-xs" onClick={() => { setShowAdjust(null); setAdjustQty(0); setAdjustReason(""); }}>✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={adjustType} onChange={e => setAdjustType(e.target.value as "add" | "remove")} className="px-3 py-2 rounded-lg text-sm">
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </select>
            <input type="number" placeholder="Quantity" value={adjustQty || ""} onChange={e => setAdjustQty(Number(e.target.value))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <input placeholder="Reason" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="px-3 py-2 rounded-lg text-sm" />
            <button
              className="btn-cyber"
              onClick={() => {
                const delta = adjustType === "remove" ? -Math.abs(adjustQty) : Math.abs(adjustQty);
                dispatch({ type: "PART_ADJUST_STOCK", id: showAdjust.id, delta, reason: adjustReason || "manual" });
                dispatch({ type: "ADD_ACTIVITY", payload: { action: `Stock ${adjustType}: ${showAdjust.barcode} ${delta} (${adjustReason || "no reason"})`, time: "just now" } });
                setShowAdjust(null);
                setAdjustQty(0);
                setAdjustReason("");
                setAdjustType("add");
              }}
            >
              ✓ Apply
            </button>
          </div>
        </div>
      )}

      {historyPart && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-purple" style={{ fontFamily: "var(--font-heading)" }}>PART HISTORY — {historyPart.barcode}</h3>
            <button className="btn-ghost text-xs" onClick={() => setHistoryPart(null)}>✕ Close</button>
          </div>
          <div className="space-y-2">
            {state.activity.slice(0, 6).map((a, i) => (
              <div key={i} className="text-xs text-cyan-100/60">• {a.action} <span className="text-cyan-500/30">({a.time})</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search barcode, name, category..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} />
          </div>
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm min-w-[140px]">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={condFilter} onChange={e => { setCondFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm min-w-[120px]">
            <option value="All">All Conditions</option>
            {conditions.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm min-w-[120px]">
            <option value="All">All Stock</option>
            <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
          </select>
          <button className="btn-ghost text-xs" onClick={clearFilters}>✕ Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Barcode</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Spec</th>
                <th className="py-3 px-4 text-left">Condition</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-right">Reorder</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={11} className="py-12 text-center text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>No parts match your filters</td></tr>
              ) : paged.map(row => {
                const stockStatus = row.onHand === 0 ? "out" : row.onHand <= row.reorder ? "low" : "ok";
                return (
                  <tr key={row.id}>
                    <td className="py-3 px-4" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}><span className="neon-text-cyan">{row.barcode}</span></td>
                    <td className="py-3 px-4 font-semibold text-cyan-100/80">{row.name}</td>
                    <td className="py-3 px-4 text-cyan-100/60">{row.category}</td>
                    <td className="py-3 px-4 text-cyan-300/40" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{row.spec}</td>
                    <td className="py-3 px-4"><span className="cyber-chip">{row.condition}</span></td>
                    <td className={`py-3 px-4 text-right font-bold ${stockStatus === "out" ? "text-red-400" : stockStatus === "low" ? "text-yellow-400" : "neon-text-green"}`} style={{ fontFamily: "var(--font-mono)" }}>{row.onHand}</td>
                    <td className="py-3 px-4 text-right text-cyan-300/50" style={{ fontFamily: "var(--font-mono)" }}>{row.available}</td>
                    <td className="py-3 px-4 text-right text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>{row.reorder}</td>
                    <td className="py-3 px-4 text-right font-semibold neon-text-green" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>AED {row.cost}</td>
                    <td className="py-3 px-4 text-cyan-300/40" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{row.location}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold" onClick={() => startEdit(row)}>Edit</button>
                        <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold" onClick={() => setShowAdjust(row)}>Adjust</button>
                        <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold" onClick={() => setHistoryPart(row)}>History</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-cyan-500/10 flex items-center justify-between">
          <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>
            Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 rounded text-[11px] font-bold border border-cyan-500/15 text-cyan-500/30 hover:text-cyan-400 disabled:opacity-30">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-[11px] font-bold transition-all ${p === page ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "text-cyan-500/20 hover:text-cyan-400 border border-transparent"}`} style={{ fontFamily: "var(--font-heading)" }}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded text-[11px] font-bold border border-cyan-500/15 text-cyan-500/30 hover:text-cyan-400 disabled:opacity-30">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
