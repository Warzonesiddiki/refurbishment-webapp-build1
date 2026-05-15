import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

export function SalesReceipts() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All");
  const { run: logExport } = useIdempotentAction("export-receipts", "receipt");
  const { run: logDelete } = useIdempotentAction("delete-receipt", "receipt");
  const { trigger } = useUiActionFeedback();

  const receipts = useMemo(() => {
    let data = state.receipts;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.receipt.toLowerCase().includes(q) || r.invoice.toLowerCase().includes(q));
    }
    if (method !== "All") data = data.filter(r => r.method === method);
    return data;
  }, [state.receipts, search, method]);

  const handleExport = () => {
    logExport("receipts-list", { count: receipts.length });
    trigger("info", "Receipts exported");
  };

  const handleDelete = (receiptId: string) => {
    logDelete(receiptId, { reason: "user-request" });
    dispatch({ type: "DELETE_RECEIPT", id: receiptId });
    trigger("success", "Receipt deleted");
  };

  return (
    <div data-page="sales-receipts" data-testid="page-sales-receipts" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>RECEIPTS</h1>
            <span className="cyber-chip">{receipts.length} records</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Payment receipts • Audit-safe delete • Export</p>
        </div>
        <button className="btn-ghost" data-action="export-receipts" onClick={handleExport}>↗ Export</button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm" placeholder="Search receipt..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="px-3 py-2 rounded-lg text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="All">All Methods</option>
            <option>Cash</option><option>Card</option><option>Transfer</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setMethod("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Receipt #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Invoice #</th><th className="py-3 px-4 text-left">Amount</th><th className="py-3 px-4 text-left">Method</th><th className="py-3 px-4 text-left">Reference</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.receipt}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-400/40" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.invoice}</td>
                  <td className="py-3 px-4 font-bold neon-text-green" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.amount.toFixed(2)}</td>
                  <td className="py-3 px-4"><span className="cyber-chip text-[10px]">{r.method}</span></td>
                  <td className="py-3 px-4 text-cyan-300/25" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.reference || "—"}</td>
                  <td className="py-3 px-4"><div className="flex gap-2">
                    <button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold">View</button>
                    <button className="text-[11px] neon-text-red font-semibold hover:text-red-300" onClick={() => handleDelete(r.id)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-cyan-500/10">
          <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "Share Tech Mono" }}>Total received: <span className="neon-text-green font-bold">AED {receipts.reduce((a, r) => a + r.amount, 0).toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  );
}
