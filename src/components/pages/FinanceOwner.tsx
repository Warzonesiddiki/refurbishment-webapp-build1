import { useState } from "react";
import { KpiCard } from "@/components/cards/KpiCard";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

const typeColors: Record<string, string> = { Investment: "cyber-badge-green", Profit: "cyber-badge-green", Drawing: "cyber-badge-red" };

export function FinanceOwner() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logExport } = useIdempotentAction("export-owner", "owner-ledger");
  const { run: logPrint } = useIdempotentAction("print-owner", "owner-ledger");
  const { trigger } = useUiActionFeedback();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: "", type: "Investment", desc: "", amount: 0 });

  const entries = state.ownerEntries;
  // Derive retained profit from sales profit when ledger is empty for Profit entries
  const derivedRetainedProfit = state.sales.reduce((a, s) => a + (s.profit ?? 0), 0);
  const invested = entries.filter(e => e.type === "Investment").reduce((a, e) => a + e.amount, 0);
  const drawings = entries.filter(e => e.type === "Drawing").reduce((a, e) => a + Math.abs(e.amount), 0);
  const retained = entries.filter(e => e.type === "Profit").reduce((a, e) => a + e.amount, 0) || derivedRetainedProfit;
  // If ledger empty, compute current capital from derived values
  const currentCapital = entries.length > 0
    ? entries[entries.length - 1].balance
    : invested - drawings + retained;

  const handleExport = () => {
    logExport("owner-ledger", { count: entries.length });
    trigger("info", "Exported owner ledger CSV");
  };

  const handlePrint = () => {
    logPrint("owner-ledger", {});
    window.print();
  };

  const addEntry = () => {
    if (!form.desc || !form.date || !form.amount) return;
    const last = entries.length > 0 ? entries[entries.length - 1].balance : 0;
    const amt = form.type === "Drawing" ? -Math.abs(form.amount) : Math.abs(form.amount);
    const balance = last + amt;
    dispatch({ type: "ADD_OWNER_ENTRY", payload: { date: form.date, type: form.type, desc: form.desc, amount: amt, balance } });
    trigger("success", "Owner entry added");
    setShowAdd(false);
    setForm({ date: "", type: "Investment", desc: "", amount: 0 });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>OWNER LEDGER</h1>
            <span className="cyber-chip cyber-badge-red">RESTRICTED</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Capital • Drawings • Retained profit • Running balance</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" data-action="export-owner" onClick={handleExport}>↗ Export</button>
          <button className="btn-ghost" data-action="print" onClick={handlePrint}>⎙ Print</button>
          <button className="btn-cyber" onClick={() => setShowAdd(true)}>+ Add Entry</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Invested" value={`AED ${invested.toLocaleString()}`} tone="green" icon="↑" />
        <KpiCard label="Drawings" value={`AED ${drawings.toLocaleString()}`} tone="red" icon="↓" />
        <KpiCard label="Retained Profit" value={`AED ${retained.toLocaleString()}`} tone="magenta" icon="◈" />
        <KpiCard label="Current Capital" value={`AED ${currentCapital.toLocaleString()}`} tone="cyan" icon="◇" />
      </div>

      {showAdd && (
        <div className="glass-card neon-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "Orbitron" }}>ADD OWNER ENTRY</h3>
            <button className="btn-ghost text-xs" onClick={() => setShowAdd(false)}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-lg text-sm">
              <option>Investment</option><option>Profit</option><option>Drawing</option>
            </select>
            <input placeholder="Description" value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Amount" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "Share Tech Mono" }} />
            <button className="btn-cyber" onClick={addEntry}>✓ Add</button>
          </div>
        </div>
      )}

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-cyan-500/10 flex items-center justify-between">
          <div className="section-header flex-1">
            <h3 className="text-sm font-bold tracking-[0.12em] text-cyan-300" style={{ fontFamily: "Orbitron" }}>LEDGER ENTRIES</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Type</th><th className="py-3 px-4 text-left">Description</th><th className="py-3 px-4 text-left">Amount</th><th className="py-3 px-4 text-left">Balance</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{e.date}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${typeColors[e.type] || "cyber-chip"}`}>{e.type}</span></td>
                  <td className="py-3 px-4 text-cyan-100/50">{e.desc}</td>
                  <td className={`py-3 px-4 font-bold ${e.amount >= 0 ? "neon-text-green" : "neon-text-red"}`} style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>
                    {e.amount >= 0 ? "+" : ""}AED {Math.abs(e.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {e.balance.toLocaleString()}</td>
                  <td className="py-3 px-4"><div className="flex gap-2">
                    <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold">View</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
