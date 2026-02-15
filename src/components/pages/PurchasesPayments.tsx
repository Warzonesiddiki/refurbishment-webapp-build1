import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { exportCsv } from "@/utils/exporters";

export function PurchasesPayments() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logExport } = useIdempotentAction("export-payments", "payment");
  const { run: logDelete } = useIdempotentAction("delete-payment", "payment");
  const { trigger } = useUiActionFeedback();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All");

  const payments = useMemo(() => {
    let data = state.payments;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p => p.payment.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q));
    }
    if (method !== "All") data = data.filter(p => p.method === method);
    return data;
  }, [state.payments, search, method]);

  const handleExport = () => {
    logExport("payments-list", { rows: payments.length });
    const rows = [
      ["Payment", "Date", "Supplier", "Purchase", "Amount", "Method", "Reference"],
      ...payments.map((p) => [p.payment, p.date, p.supplier, p.purchase, p.amount.toFixed(2), p.method, p.reference || ""]),
    ];
    exportCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    trigger("info", "Payments export logged");
  };

  const handleDelete = (paymentId: string) => {
    const payment = state.payments.find((p) => p.id === paymentId);
    if (payment) {
      const purchase = state.purchases.find((p) => p.purchase === payment.purchase);
      if (purchase) {
        // remove amount and recompute paid/status based on remaining payments
        const remaining = state.payments.filter((p) => p.id !== paymentId && p.purchase === purchase.purchase);
        const paidAmount = remaining.reduce((a, p) => a + p.amount, 0);
        const paidStatus = paidAmount >= purchase.total ? "Paid" : paidAmount > 0 ? "Partial" : "Due";
        const status = paidStatus === "Paid" ? "Closed" : "Open";
        dispatch({ type: "UPDATE_PURCHASE", id: purchase.id, payload: { paid: paidStatus, status } });
      }
    }
    logDelete(paymentId, { reason: "user-request" });
    dispatch({ type: "DELETE_PAYMENT", id: paymentId });
    trigger("success", "Payment deleted");
  };

  return (
    <div data-page="purchases-payments" data-testid="page-purchases-payments" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>PAYMENTS</h1>
            <span className="cyber-chip">{payments.length} records</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Supplier payments • Audit-safe delete • Balance updates</p>
        </div>
        <button className="btn-ghost" data-action="export-payments" onClick={handleExport}>↗ Export</button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm" placeholder="Search payment or supplier..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="px-3 py-2 rounded-lg text-sm" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="All">All Methods</option><option>Cash</option><option>Transfer</option><option>Card</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setMethod("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Payment #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Purchase #</th><th className="py-3 px-4 text-left">Amount</th><th className="py-3 px-4 text-left">Method</th><th className="py-3 px-4 text-left">Reference</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {payments.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.payment}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-100/60">{r.supplier}</td>
                  <td className="py-3 px-4 text-cyan-400/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.purchase}</td>
                  <td className="py-3 px-4 font-bold neon-text-red" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.amount.toFixed(2)}</td>
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
          <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "Share Tech Mono" }}>Total paid: <span className="neon-text-red font-bold">AED {payments.reduce((a, r) => a + r.amount, 0).toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  );
}
