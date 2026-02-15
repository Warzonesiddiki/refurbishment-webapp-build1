import { useMemo, useState } from "react";
import { KpiCard } from "@/components/cards/KpiCard";
import { useAppState } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

export function FinanceVat() {
  const state = useAppState();
  const { run: logExport } = useIdempotentAction("export-vat", "vat");
  const { run: logPrint } = useIdempotentAction("print-vat", "vat");
  const { trigger } = useUiActionFeedback();
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));

  const { salesVat, purchaseVat, totals } = useMemo(() => {
    const sales = state.sales.filter(s => s.date.startsWith(period));
    const purchases = state.purchases.filter(p => p.date.startsWith(period));
    const salesVat = sales.map(s => ({ invoice: s.invoice, date: s.date, customer: s.customer, base: s.subtotal, vat: s.vat }));
    const purchaseVat = purchases.map(p => ({ purchase: p.purchase, date: p.date, supplier: p.supplier, base: p.subtotal, vat: p.vat }));
    const outputVat = salesVat.reduce((a, r) => a + r.vat, 0);
    const inputVat = purchaseVat.reduce((a, r) => a + r.vat, 0);
    return { salesVat, purchaseVat, totals: { outputVat, inputVat, netVat: outputVat - inputVat } };
  }, [state.sales, state.purchases, period]);

  const handleExport = () => {
    logExport("vat-report", { period });
    const rows = [
      ["Type", "Ref", "Date", "Party", "Base", "VAT"],
      ...salesVat.map(r => ["Sale", r.invoice, r.date, r.customer, String(r.base), String(r.vat)]),
      ...purchaseVat.map(r => ["Purchase", r.purchase, r.date, r.supplier, String(r.base), String(r.vat)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `vat-report-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
    trigger("info", "VAT report exported");
  };

  const handlePrint = () => {
    logPrint("vat-report", { period });
    window.print();
  };

  return (
    <div data-page="finance-vat" data-testid="page-finance-vat" className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>VAT REPORT</h1>
            <span className="cyber-chip cyber-badge-yellow">5% UAE</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Output VAT • Input VAT • Net payable • Reconciliation</p>
        </div>
        <div className="flex gap-3">
          <input type="month" className="px-3 py-2 rounded-lg text-sm" value={period} onChange={e => setPeriod(e.target.value)} />
          <button className="btn-ghost" data-action="export-vat" onClick={handleExport}>↗ Export</button>
          <button className="btn-ghost" data-action="print" onClick={handlePrint}>⎙ Print</button>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("financeVat")} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Output VAT (Sales)" value={`AED ${totals.outputVat.toFixed(2)}`} tone="cyan" icon="↑" />
        <KpiCard label="Input VAT (Purchases)" value={`AED ${totals.inputVat.toFixed(2)}`} tone="green" icon="↓" />
        <KpiCard label="Net VAT Payable" value={`AED ${totals.netVat.toFixed(2)}`} tone={totals.netVat < 0 ? "green" : "red"} icon={totals.netVat < 0 ? "↓" : "↑"} />
      </div>

      <div className={`glass-card corner-marks p-5 ${totals.netVat < 0 ? "neon-border-green" : "neon-border"}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`status-dot ${totals.netVat < 0 ? "status-dot-online" : "status-dot-danger"}`} />
          <span className={`text-sm font-bold tracking-wider ${totals.netVat < 0 ? "neon-text-green" : "neon-text-red"}`} style={{ fontFamily: "Orbitron" }}>
            {totals.netVat < 0 ? "VAT REFUND DUE" : "VAT PAYABLE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-black ${totals.netVat < 0 ? "neon-text-green" : "neon-text-red"}`} style={{ fontFamily: "Orbitron" }}>
            AED {Math.abs(totals.netVat).toFixed(2)}
          </span>
          <span className="text-[11px] text-cyan-500/25" style={{ fontFamily: "Share Tech Mono" }}>
            = Output ({totals.outputVat.toFixed(2)}) − Input ({totals.inputVat.toFixed(2)})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card corner-marks p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-cyan-500/10 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-[0.12em] text-cyan-300" style={{ fontFamily: "Orbitron" }}>SALES VAT (OUTPUT)</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Invoice #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Customer</th><th className="py-3 px-4 text-left">Base</th><th className="py-3 px-4 text-left">VAT</th>
            </tr></thead>
            <tbody>
              {salesVat.map((r) => (
                <tr key={r.invoice}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.invoice}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-100/50">{r.customer}</td>
                  <td className="py-3 px-4 text-cyan-100/40" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.base.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.vat.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-cyan-500/10 text-right">
            <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "Share Tech Mono" }}>Total: <span className="neon-text-cyan font-bold">AED {totals.outputVat.toFixed(2)}</span></span>
          </div>
        </div>

        <div className="glass-card corner-marks p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-cyan-500/10 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-[0.12em] text-green-400" style={{ fontFamily: "Orbitron" }}>PURCHASE VAT (INPUT)</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">Purchase #</th><th className="py-3 px-4 text-left">Date</th><th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Base</th><th className="py-3 px-4 text-left">VAT</th>
            </tr></thead>
            <tbody>
              {purchaseVat.map((r) => (
                <tr key={r.purchase}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.purchase}</td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.date}</td>
                  <td className="py-3 px-4 text-cyan-100/50">{r.supplier}</td>
                  <td className="py-3 px-4 text-cyan-100/40" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.base.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold neon-text-green" style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }}>AED {r.vat.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-cyan-500/10 text-right">
            <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "Share Tech Mono" }}>Total: <span className="neon-text-green font-bold">AED {totals.inputVat.toFixed(2)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
