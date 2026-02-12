import { useMemo, useState } from "react";
import { useAppState } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { exportCsv, exportJson } from "@/utils/exporters";

const reportCards = [
  { key: "inventory", title: "Inventory Valuation", desc: "Laptops unsold + parts valuation" },
  { key: "low-stock", title: "Low Stock", desc: "Parts below reorder level" },
  { key: "aging", title: "Stock Aging", desc: "Aging buckets by status" },
  { key: "track", title: "Track Status Summary", desc: "Track A–E stage distribution" },
  { key: "wip", title: "WIP Cost Summary", desc: "Cost by job/tech/date" },
  { key: "profit", title: "Profit Summary", desc: "Sales vs cost trend" },
  { key: "payables", title: "Payables Overview", desc: "Outstanding supplier balances" },
  { key: "receivables", title: "Receivables Overview", desc: "Outstanding sales balances" },
] as const;

type ReportKey = (typeof reportCards)[number]["key"];

const runAgingBucket = (days: number) => (days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+");

export function ReportsPage() {
  const state = useAppState();
  const { run: logExport } = useIdempotentAction("export-reports", "report");
  const { trigger } = useUiActionFeedback();
  const [selected, setSelected] = useState<ReportKey>("inventory");

  const data = useMemo(() => {
    const inventory = state.laptops
      .filter((l) => l.status !== "Sold")
      .map((l) => ({
        type: "Laptop",
        barcode: l.barcode,
        name: `${l.brand} ${l.model}`,
        status: l.status,
        cost: l.cost,
        value: l.cost,
      }));

    const parts = state.parts.map((p) => ({
      type: "Part",
      barcode: p.barcode,
      name: p.name,
      status: p.onHand <= p.reorder ? "Low" : "OK",
      cost: p.cost,
      value: p.onHand * p.cost,
    }));

    const lowStock = state.parts.filter((p) => p.onHand <= p.reorder);

    const aging = state.laptops.map((l) => {
      const baseDate = l.date ? new Date(l.date) : new Date();
      const days = Math.max(0, Math.floor((Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24)));
      return { barcode: l.barcode, status: l.status, days, bucket: runAgingBucket(days) };
    });

    const track = ["Track A", "Track B", "Track C", "Track D", "Track E"].map((t) => ({
      track: t,
      count: state.laptops.filter((l) => l.track === t).length,
    }));

    const wip = state.wipJobs.map((w) => ({
      wip: w.wip,
      laptop: w.laptop,
      parts: w.partsCost,
      labor: w.laborHrs * state.settings.laborRate,
      total: w.partsCost + w.laborHrs * state.settings.laborRate,
    }));

    const profit = state.sales.map((s) => ({ invoice: s.invoice, profit: s.profit, total: s.total }));

    const payables = state.purchases.map((p) => ({
      purchase: p.purchase,
      supplier: p.supplier,
      total: p.total,
      paidStatus: p.paid,
      dueAmount: p.paid === "Paid" ? 0 : p.total,
    }));

    const receivables = state.sales.map((sale) => {
      const paidAmount = state.receipts.filter((r) => r.invoice === sale.invoice).reduce((sum, r) => sum + r.amount, 0);
      const dueAmount = Math.max(0, sale.total - paidAmount);
      const paidStatus = dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";
      return {
        invoice: sale.invoice,
        customer: sale.customer,
        total: sale.total,
        paidAmount,
        dueAmount,
        paidStatus,
      };
    });

    const summary = {
      inventoryValue: inventory.reduce((sum, row) => sum + row.value, 0) + parts.reduce((sum, row) => sum + row.value, 0),
      receivableDue: receivables.reduce((sum, row) => sum + row.dueAmount, 0),
      payableDue: payables.reduce((sum, row) => sum + row.dueAmount, 0),
      wipCost: wip.reduce((sum, row) => sum + row.total, 0),
    };

    return { inventory: [...inventory, ...parts], lowStock, aging, track, wip, profit, payables, receivables, summary };
  }, [state]);

  const handleExport = (format: "excel" | "csv" | "json") => {
    logExport(`report-${format}`, { format, report: selected });
    const payload = data[selected] ?? data;

    if (format === "json") {
      exportJson(`report-${selected}-${new Date().toISOString().slice(0, 10)}.json`, payload);
    } else {
      const rows = [
        ["Report", selected],
        ["Generated", new Date().toISOString()],
        ["Rows", Array.isArray(payload) ? String(payload.length) : "1"],
      ];
      exportCsv(`report-${selected}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    }
    trigger("info", `Exported ${selected} (${format})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>
              REPORTS
            </h1>
            <span className="cyber-chip">ANALYTICS</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>
            Export Excel/CSV/JSON • Print-ready reports • Filters per report
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => handleExport("excel")}>Excel</button>
          <button className="btn-ghost" onClick={() => handleExport("csv")}>CSV</button>
          <button className="btn-ghost" onClick={() => handleExport("json")}>JSON</button>
          <button className="btn-cyber" data-action="print" onClick={() => window.print()}>⎙ Print</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3"><p className="text-[10px] text-cyan-500/40">Inventory Value</p><p className="neon-text-green">AED {data.summary.inventoryValue.toFixed(2)}</p></div>
        <div className="glass-card p-3"><p className="text-[10px] text-cyan-500/40">Receivable Due</p><p className="text-yellow-300">AED {data.summary.receivableDue.toFixed(2)}</p></div>
        <div className="glass-card p-3"><p className="text-[10px] text-cyan-500/40">Payable Due</p><p className="text-red-300">AED {data.summary.payableDue.toFixed(2)}</p></div>
        <div className="glass-card p-3"><p className="text-[10px] text-cyan-500/40">Open WIP Cost</p><p className="text-cyan-100">AED {data.summary.wipCost.toFixed(2)}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card) => (
          <button
            key={card.key}
            className={`glass-card corner-marks p-4 text-left ${selected === card.key ? "border border-cyan-500/30" : ""}`}
            onClick={() => setSelected(card.key)}
          >
            <h3 className="text-sm font-semibold text-cyan-100/80" style={{ fontFamily: "Orbitron" }}>{card.title}</h3>
            <p className="text-xs text-cyan-500/40 mt-1" style={{ fontFamily: "Rajdhani" }}>{card.desc}</p>
          </button>
        ))}
      </div>

      <div className="glass-card corner-marks p-6 overflow-auto">
        <div className="section-header mb-3">
          <h3 className="text-sm font-bold tracking-[0.12em] text-cyan-300" style={{ fontFamily: "Orbitron" }}>REPORT PREVIEW</h3>
        </div>
        {selected === "inventory" && (
          <table className="w-full text-sm">
            <thead><tr><th className="py-3 px-4 text-left">Type</th><th className="py-3 px-4 text-left">Barcode</th><th className="py-3 px-4 text-left">Name</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Cost</th><th className="py-3 px-4 text-left">Value</th></tr></thead>
            <tbody>{data.inventory.map((r, i) => (
              <tr key={i}><td className="py-2 px-4">{r.type}</td><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.barcode}</td><td className="py-2 px-4 text-cyan-100/60">{r.name}</td><td className="py-2 px-4 text-cyan-300/40">{r.status}</td><td className="py-2 px-4 text-cyan-100/40">AED {r.cost}</td><td className="py-2 px-4 neon-text-green">AED {r.value}</td></tr>
            ))}</tbody>
          </table>
        )}
        {selected === "low-stock" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Part</th><th className="py-3 px-4 text-left">On Hand</th><th className="py-3 px-4 text-left">Reorder</th></tr></thead>
          <tbody>{data.lowStock.map((p) => (<tr key={p.id}><td className="py-2 px-4 text-cyan-100/60">{p.name}</td><td className="py-2 px-4 text-red-400">{p.onHand}</td><td className="py-2 px-4 text-cyan-300/40">{p.reorder}</td></tr>))}</tbody></table>
        )}
        {selected === "track" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Track</th><th className="py-3 px-4 text-left">Count</th></tr></thead>
          <tbody>{data.track.map((t) => (<tr key={t.track}><td className="py-2 px-4">{t.track}</td><td className="py-2 px-4 neon-text-cyan">{t.count}</td></tr>))}</tbody></table>
        )}
        {selected === "aging" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Barcode</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Days</th><th className="py-3 px-4 text-left">Bucket</th></tr></thead>
          <tbody>{data.aging.map((a) => (<tr key={a.barcode}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{a.barcode}</td><td className="py-2 px-4 text-cyan-100/60">{a.status}</td><td className="py-2 px-4 text-cyan-300/40">{a.days}</td><td className="py-2 px-4 text-cyan-300/40">{a.bucket}</td></tr>))}</tbody></table>
        )}
        {selected === "wip" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">WIP</th><th className="py-3 px-4 text-left">Laptop</th><th className="py-3 px-4 text-left">Parts</th><th className="py-3 px-4 text-left">Labor</th><th className="py-3 px-4 text-left">Total</th></tr></thead>
          <tbody>{data.wip.map((w) => (<tr key={w.wip}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{w.wip}</td><td className="py-2 px-4 text-cyan-100/60">{w.laptop}</td><td className="py-2 px-4 text-cyan-300/40">AED {w.parts}</td><td className="py-2 px-4 text-cyan-300/40">AED {w.labor}</td><td className="py-2 px-4 neon-text-green">AED {w.total}</td></tr>))}</tbody></table>
        )}
        {selected === "profit" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Invoice</th><th className="py-3 px-4 text-left">Profit</th><th className="py-3 px-4 text-left">Total</th></tr></thead>
          <tbody>{data.profit.map((p) => (<tr key={p.invoice}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{p.invoice}</td><td className="py-2 px-4 neon-text-green">AED {p.profit}</td><td className="py-2 px-4 text-cyan-300/40">AED {p.total}</td></tr>))}</tbody></table>
        )}
        {selected === "payables" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Purchase</th><th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Due</th><th className="py-3 px-4 text-left">Status</th></tr></thead>
          <tbody>{data.payables.map((p) => (<tr key={p.purchase}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{p.purchase}</td><td className="py-2 px-4 text-cyan-100/60">{p.supplier}</td><td className="py-2 px-4 text-cyan-300/40">AED {p.total.toFixed(2)}</td><td className="py-2 px-4 text-yellow-300">AED {p.dueAmount.toFixed(2)}</td><td className="py-2 px-4 text-cyan-300/40">{p.paidStatus}</td></tr>))}</tbody></table>
        )}
        {selected === "receivables" && (
          <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Invoice</th><th className="py-3 px-4 text-left">Customer</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Paid</th><th className="py-3 px-4 text-left">Due</th><th className="py-3 px-4 text-left">Status</th></tr></thead>
          <tbody>{data.receivables.map((r) => (<tr key={r.invoice}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.invoice}</td><td className="py-2 px-4 text-cyan-100/60">{r.customer}</td><td className="py-2 px-4 text-cyan-300/40">AED {r.total.toFixed(2)}</td><td className="py-2 px-4 text-green-300">AED {r.paidAmount.toFixed(2)}</td><td className="py-2 px-4 text-yellow-300">AED {r.dueAmount.toFixed(2)}</td><td className="py-2 px-4 text-cyan-300/40">{r.paidStatus}</td></tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}
