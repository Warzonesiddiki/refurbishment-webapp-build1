import { useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { exportCsv } from "@/utils/exporters";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

export function FinanceCash() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustType, setAdjustType] = useState("Cash In");
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const entries = state.cashEntries;
  const lastBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
  const openingEntry = entries.find(e => e.type === "Opening");
  const openingBalance = openingEntry?.balance ?? 0;
  const totalIn = entries
    .filter(e => e.type === "Cash In" || e.type === "Opening")
    .reduce((a, e) => a + (e.type === "Opening" ? 0 : e.amount), 0);
  const totalOut = entries
    .filter(e => e.type === "Cash Out" || e.type === "Adjustment")
    .reduce((a, e) => a + Math.abs(e.amount), 0);

  const addEntry = () => {
    if (!adjustDesc || adjustAmount <= 0) return;
    const amt = adjustType === "Cash Out" ? -adjustAmount : adjustAmount;
    const newBalance = lastBalance + amt;

    dispatch({
      type: "ADD_CASH_ENTRY",
      payload: {
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        type: adjustType,
        desc: `${adjustDesc}${adjustReason ? ` (${adjustReason})` : ""}`,
        amount: amt,
        balance: newBalance,
      },
    });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Cash ${adjustType.toLowerCase()}: AED ${adjustAmount.toFixed(2)} — ${adjustDesc}`, time: "just now" } });
    setShowAdjust(false);
    setAdjustAmount(0);
    setAdjustDesc("");
    setAdjustReason("");
  };

  const toggleDay = () => {
    if (!state.cashDayOpen) {
      dispatch({
        type: "ADD_CASH_ENTRY",
        payload: { time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), type: "Opening", desc: "Daily opening balance", amount: lastBalance, balance: lastBalance },
      });
    } else {
      dispatch({
        type: "ADD_CASH_ENTRY",
        payload: { time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), type: "Closing", desc: "Daily closing balance", amount: 0, balance: lastBalance },
      });
    }
    dispatch({ type: "TOGGLE_CASH_DAY" });
  };

  const exportCashCsv = () => {
    const rows = [["Time", "Type", "Description", "Amount", "Balance"], ...entries.map(e => [e.time, e.type, e.desc, String(e.amount), String(e.balance)])];
    exportCsv(`cash-register-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div data-page="finance-cash" data-testid="page-finance-cash" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>CASH REGISTER</h1>
            <span className={`cyber-chip ${state.cashDayOpen ? "cyber-badge-green" : "cyber-badge-red"}`}>
              {state.cashDayOpen ? "DAY OPEN" : "DAY CLOSED"}
            </span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>Daily cash tracking • Adjustments • Audit trail</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={exportCashCsv}>↗ Export</button>
          <button className="btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
          <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${state.cashDayOpen ? "border border-red-500/30 text-red-400/70 hover:text-red-300" : "btn-cyber"}`} onClick={toggleDay}>
            {state.cashDayOpen ? "🔒 Close Day" : "🔓 Open Day"}
          </button>
          {state.cashDayOpen && <button className="btn-cyber" onClick={() => setShowAdjust(true)}>+ Add Entry</button>}
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("financeCash")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Opening Balance" value={`AED ${openingBalance.toLocaleString()}`} tone="cyan" icon="🏦" />
        <KpiCard label="Cash In" value={`AED ${totalIn.toLocaleString()}`} tone="green" icon="↗" />
        <KpiCard label="Cash Out" value={`AED ${totalOut.toLocaleString()}`} tone="red" icon="↙" />
        <KpiCard label="Current Balance" value={`AED ${lastBalance.toLocaleString()}`} tone="magenta" icon="◈" />
      </div>

      {showAdjust && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>ADD CASH ENTRY</h3>
            <button className="btn-ghost text-xs" onClick={() => setShowAdjust(false)}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select value={adjustType} onChange={e => setAdjustType(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
              <option>Cash In</option><option>Cash Out</option><option>Adjustment</option>
            </select>
            <input type="number" placeholder="Amount" value={adjustAmount || ""} onChange={e => setAdjustAmount(Number(e.target.value))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <input placeholder="Description *" value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} className="px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Reason (for adjustments)" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="px-3 py-2 rounded-lg text-sm" />
            <button className="btn-cyber" onClick={addEntry}>✓ Add</button>
          </div>
        </div>
      )}

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-cyan-500/10">
          <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>TRANSACTIONS ({entries.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>No transactions today</td></tr>
              ) : [...entries].reverse().map(entry => (
                <tr key={entry.id}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{entry.time}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${entry.type === "Cash In" || entry.type === "Opening" ? "cyber-badge-green" : entry.type === "Cash Out" ? "cyber-badge-red" : entry.type === "Closing" ? "cyber-badge-purple" : "cyber-badge-yellow"}`}>{entry.type}</span></td>
                  <td className="py-3 px-4 text-cyan-200/70">{entry.desc}</td>
                  <td className={`py-3 px-4 text-right font-bold ${entry.amount >= 0 ? "neon-text-green" : "text-red-400"}`} style={{ fontFamily: "var(--font-mono)" }}>{entry.amount >= 0 ? "+" : ""}AED {Math.abs(entry.amount).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>AED {entry.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
