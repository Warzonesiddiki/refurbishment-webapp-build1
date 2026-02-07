import { useMemo, useState } from "react";
import { useAppState } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { exportCsv } from "@/utils/exporters";

const statusColors: Record<string, string> = { Paid: "cyber-badge-green", Partial: "cyber-badge-yellow", Unpaid: "cyber-badge-red" };

export function SalesAll() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const { run: logExport } = useIdempotentAction("export-sales", "sales");
  const { trigger } = useUiActionFeedback();

  const rows = useMemo(() => {
    let data = state.sales;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.invoice.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") data = data.filter(r => r.status === statusFilter);
    if (methodFilter !== "All") data = data.filter(r => r.method === methodFilter);
    return data;
  }, [state.sales, search, statusFilter, methodFilter]);

    const normalizedRows = rows.map((r) => ({
    ...r,
    items: r.items ?? r.lineItems?.length ?? 0,
    subtotal: r.subtotal ?? 0,
    vat: r.vat ?? 0,
    total: r.total ?? 0,
    profit: r.profit ?? 0,
  }));

  const handleExport = () => {
    logExport("sales-list", { rows });
    const csvRows = [
      ["Invoice", "Date", "Customer", "Items", "Subtotal", "VAT", "Total", "Profit", "Status", "Method"],
      ...normalizedRows.map((r) => [
        r.invoice,
        r.date,
        r.customer,
        String(r.items),
        r.subtotal.toFixed(2),
        r.vat.toFixed(2),
        r.total.toFixed(2),
        r.profit.toFixed(2),
        r.status,
        r.method,
      ]),
    ];
    exportCsv(`sales-${new Date().toISOString().slice(0, 10)}.csv`, csvRows);
    trigger("info", "Sales exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>ALL SALES</h1>
            <span className="cyber-chip">{rows.length} invoices</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Invoices • VAT • Profit • Payment status</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" data-action="export-sales" onClick={handleExport}>↗ Export</button>
          <button className="btn-ghost" data-action="print" onClick={() => window.print()}>⎙ Print</button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm" placeholder="Search invoice or customer..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} value={search} onChange={(e) => setSearch(e.target.value)} />
          <input type="date" className="px-3 py-2 rounded-lg text-sm" />
          <select className="px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Payment Status</option>
            <option>Paid</option><option>Partial</option><option>Unpaid</option>
          </select>
          <select className="px-3 py-2 rounded-lg text-sm" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="All">All Methods</option>
            <option>Cash</option><option>Card</option><option>Transfer</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); setMethodFilter("All"); }}>✕ Clear</button>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Invoice #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Customer</th><th className="py-3 px-4 text-left">Items</th><th className="py-3 px-4 text-left">Subtotal</th><th className="py-3 px-4 text-left">VAT</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Profit</th><th className="py-3 px-4 text-left">Payment</th><th className="py-3 px-4 text-left">Method</th>
            </tr></thead>
            <tbody>
              {normalizedRows.map((r) => (
                <tr key={r.invoice}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.invoice}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-100/60">{r.customer}</td>
                  <td className="py-3 px-4 text-cyan-100/50" style={{ fontFamily: "Share Tech Mono" }}>{r.items}</td>
                  <td className="py-3 px-4 text-cyan-100/50" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.vat.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.total.toFixed(2)}</td>
                  <td className="py-3 px-4 neon-text-green" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.profit.toFixed(2)}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${statusColors[r.status] || "cyber-chip"}`}>{r.status}</span></td>
                  <td className="py-3 px-4 text-cyan-100/40">{r.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-cyan-500/10 flex items-center justify-between">
          <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "Share Tech Mono" }}>Showing 1-{normalizedRows.length} of {normalizedRows.length}</span>
          <div className="flex gap-3">
            <span className="text-[11px] text-cyan-100/30">Total: <span className="neon-text-cyan font-bold">AED {normalizedRows.reduce((a,r)=>a+r.total,0).toFixed(2)}</span></span>
            <span className="text-[11px] text-cyan-100/30">Profit: <span className="neon-text-green font-bold">AED {normalizedRows.reduce((a,r)=>a+r.profit,0).toFixed(2)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
