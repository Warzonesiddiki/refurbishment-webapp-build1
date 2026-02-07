import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

const paidColors: Record<string, string> = { Paid: "cyber-badge-green", Due: "cyber-badge-red", Partial: "cyber-badge-yellow" };
const statusColors: Record<string, string> = { Closed: "cyber-badge-purple", Open: "cyber-badge-green" };

export function PurchasesAll() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { trigger } = useUiActionFeedback();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paidFilter, setPaidFilter] = useState("All");
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);

  const purchases = useMemo(() => {
    let data = state.purchases;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p => p.purchase.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") data = data.filter(p => p.status === statusFilter);
    if (paidFilter !== "All") data = data.filter(p => p.paid === paidFilter);
    return data;
  }, [state.purchases, search, statusFilter, paidFilter]);

  const selected = purchases.find(p => p.purchase === selectedPurchase);

  const addPayment = () => {
    if (!selected) return;
    dispatch({
      type: "ADD_PAYMENT",
      payload: {
        payment: `ALM-PAY-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(state.payments.length + 1).padStart(4, "0")}`,
        date: new Date().toISOString().slice(0, 10),
        supplier: selected.supplier,
        purchase: selected.purchase,
        amount: selected.total,
        method: "Cash",
        reference: "",
      },
    });
    trigger("success", "Payment recorded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>ALL PURCHASES</h1>
            <span className="cyber-chip">{purchases.length} orders</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Purchase orders • VAT • Payments • Lot links</p>
        </div>
        <button className="btn-ghost" data-action="export-purchases">↗ Export</button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm"
            placeholder="Search purchase or supplier..."
            style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input type="date" className="px-3 py-2 rounded-lg text-sm" />
          <select className="px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option><option>Open</option><option>Closed</option>
          </select>
          <select className="px-3 py-2 rounded-lg text-sm" value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
            <option value="All">All Payment</option><option>Paid</option><option>Due</option><option>Partial</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); setPaidFilter("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Purchase #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Lot</th><th className="py-3 px-4 text-left">Subtotal</th><th className="py-3 px-4 text-left">VAT</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Paid/Due</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {purchases.map((r) => (
                <tr key={r.purchase}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.purchase}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-100/60">{r.supplier}</td>
                  <td className="py-3 px-4 text-cyan-400/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.lot}</td>
                  <td className="py-3 px-4 text-cyan-100/50" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-cyan-300/25" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.vat.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.total.toFixed(2)}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${paidColors[r.paid] || "cyber-chip"}`}>{r.paid}</span></td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${statusColors[r.status] || "cyber-chip"}`}>{r.status}</span></td>
                  <td className="py-3 px-4"><div className="flex gap-2"><button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold" onClick={() => setSelectedPurchase(r.purchase)}>View</button><button className="text-[11px] text-purple-400/50 hover:text-purple-300 font-semibold">Audit</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPurchase(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card neon-border w-full max-w-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>{selected.purchase}</h3>
                <p className="text-sm text-cyan-400/40">{selected.supplier} • {selected.date}</p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedPurchase(null)}>✕ Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-cyan-500/30">Subtotal</span><div className="neon-text-cyan">AED {selected.subtotal.toFixed(2)}</div></div>
              <div><span className="text-cyan-500/30">VAT</span><div className="neon-text-yellow">AED {selected.vat.toFixed(2)}</div></div>
              <div><span className="text-cyan-500/30">Total</span><div className="neon-text-green">AED {selected.total.toFixed(2)}</div></div>
              <div><span className="text-cyan-500/30">Status</span><div className="text-cyan-200/70">{selected.status}</div></div>
            </div>
            <div className="divider-cyber" />
            <div className="flex gap-3 justify-end">
              <button className="btn-ghost" onClick={() => setSelectedPurchase(null)}>Close</button>
              <button className="btn-cyber" onClick={addPayment}>+ Add Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
