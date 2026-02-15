import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import type { SupplierRecord } from "@/store/appState";

export function MasterSuppliers() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logExport } = useIdempotentAction("export-suppliers", "supplier");
  const { run: logAdd } = useIdempotentAction("add-supplier", "supplier");
  const { trigger } = useUiActionFeedback();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "", trn: "", status: "Active" });

  const suppliers = useMemo(() => {
    let data = state.suppliers;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q) || s.trn.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") data = data.filter(s => s.status === statusFilter);
    return data;
  }, [state.suppliers, search, statusFilter]);

  const startEdit = (supplier: SupplierRecord) => {
    setEditId(supplier.id);
    setForm({ name: supplier.name, contact: supplier.contact, email: supplier.email, trn: supplier.trn, status: supplier.status });
    setShowAdd(true);
  };

  const resetForm = () => {
    setForm({ name: "", contact: "", email: "", trn: "", status: "Active" });
    setShowAdd(false);
    setEditId(null);
  };

  const saveSupplier = () => {
    if (!form.name || !form.trn) return;
    if (editId) {
      dispatch({ type: "UPDATE_SUPPLIER", id: editId, payload: form });
      trigger("success", "Supplier updated");
    } else {
      logAdd("new-supplier", { source: "ui" });
      dispatch({ type: "ADD_SUPPLIER", payload: { ...form, lots: 0 } });
      trigger("success", "Supplier added");
    }
    resetForm();
  };

  const handleExport = () => {
    logExport("suppliers-list", { count: suppliers.length });
    const rows = [
      ["Name", "Contact", "Email", "TRN", "Lots", "Status"],
      ...suppliers.map(s => [s.name, s.contact, s.email, s.trn, String(s.lots), s.status]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    trigger("info", "Exported suppliers CSV");
  };

  const deleteSupplier = (id: string) => {
    dispatch({ type: "DELETE_SUPPLIER", id });
    trigger("success", "Supplier deleted");
  };

  return (
    <div data-page="master-suppliers" data-testid="page-master-suppliers" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>SUPPLIERS</h1>
            <span className="cyber-chip">{suppliers.length} records</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Supplier master data • TRN • Contact • Export</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" data-action="export-suppliers" onClick={handleExport}>↗ Export</button>
          <button className="btn-cyber" data-action="add-supplier" onClick={() => setShowAdd(true)}>+ Add Supplier</button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card neon-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>
              {editId ? "EDIT SUPPLIER" : "ADD SUPPLIER"}
            </h3>
            <button className="btn-ghost text-xs" onClick={resetForm}>✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Contact" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="TRN *" value={form.trn} onChange={e => setForm(p => ({ ...p, trn: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "Share Tech Mono" }} />
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 rounded-lg text-sm">
              <option>Active</option><option>Inactive</option>
            </select>
            <button className="btn-cyber" onClick={saveSupplier}>✓ Save</button>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm" placeholder="Search supplier..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option><option>Active</option><option>Inactive</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Contact</th><th className="py-3 px-4 text-left">Email</th><th className="py-3 px-4 text-left">TRN</th><th className="py-3 px-4 text-left">Lots</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 px-4 font-semibold text-cyan-100/80">{s.name}</td>
                  <td className="py-3 px-4 text-cyan-100/50" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>{s.contact}</td>
                  <td className="py-3 px-4 text-cyan-300/40" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{s.email}</td>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{s.trn}</td>
                  <td className="py-3 px-4 text-cyan-100/50" style={{ fontFamily: "Share Tech Mono" }}>{s.lots}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${s.status === "Active" ? "cyber-badge-green" : "cyber-badge-red"}`}>{s.status}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold" onClick={() => startEdit(s)}>Edit</button>
                      <button className="text-[11px] text-red-400/50 hover:text-red-300 font-semibold" onClick={() => deleteSupplier(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
