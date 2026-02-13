import { useMemo, useState } from "react";
import { useAppState } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { exportCsv, exportJson } from "@/utils/exporters";
import { ProfitSummaryWidget } from "@/components/Dashboard/ProfitSummaryWidget";
import { cn } from "@/utils/cn";
import {
  generateBalanceSheet,
  generateManagementAccountingSnapshot,
  generateProfitLossReport,
  generateAgedBalanceSnapshot,
  generateCashFlowStatement,
  generateTaxationSummary,
  generateVATReport,
} from "@/utils/reportGenerator";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";
import { buildCompletionRoadmap } from "@/utils/completionRoadmap";

const reportCards = [
  { key: "inventory", title: "Inventory Valuation", desc: "Laptops unsold + parts valuation" },
  { key: "low-stock", title: "Low Stock", desc: "Parts below reorder level" },
  { key: "aging", title: "Stock Aging", desc: "Aging buckets by status" },
  { key: "track", title: "Track Status Summary", desc: "Track A–E stage distribution" },
  { key: "wip", title: "WIP Cost Summary", desc: "Cost by job/tech/date" },
  { key: "profit", title: "Profit Summary", desc: "Sales vs cost trend" },
  { key: "payables", title: "Payables Overview", desc: "Outstanding supplier balances" },
  { key: "receivables", title: "Receivables Overview", desc: "Outstanding sales balances" },
  { key: "accounting", title: "Accounting Statements", desc: "P&L + Balance sheet + VAT" },
  { key: "cashflow", title: "Cash Flow Statement", desc: "Direct + indirect operating cashflow" },
  { key: "management", title: "Management Accounting", desc: "Margins, cashflow, turnover and BEP" },
  { key: "tax", title: "Taxation Summary", desc: "Output/input VAT and effective tax rate" },
] as const;

type ReportKey = (typeof reportCards)[number]["key"];

const runAgingBucket = (days: number) => (days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+");
const formatMoney = (n: number) => `AED ${n.toFixed(2)}`;

type ReportDataKey =
  | "inventory"
  | "lowStock"
  | "aging"
  | "track"
  | "wip"
  | "profit"
  | "payables"
  | "receivables"
  | "accounting"
  | "cashflow"
  | "management"
  | "tax";

const dataKeyByReport: Record<ReportKey, ReportDataKey> = {
  inventory: "inventory",
  "low-stock": "lowStock",
  aging: "aging",
  track: "track",
  wip: "wip",
  profit: "profit",
  payables: "payables",
  receivables: "receivables",
  accounting: "accounting",
  cashflow: "cashflow",
  management: "management",
  tax: "tax",
};

export function ReportsPage() {
  const state = useAppState();
  const { run: logExport } = useIdempotentAction("export-reports", "report");
  const { trigger } = useUiActionFeedback();
  const [selected, setSelected] = useState<ReportKey>("inventory");

  const completionRoadmap = useMemo(() => buildCompletionRoadmap(state), [state]);

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

    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const periodEnd = new Date();
    const accounting = {
      profitLoss: generateProfitLossReport(state, periodStart, periodEnd),
      balanceSheet: generateBalanceSheet(state, periodEnd),
      vat: generateVATReport(state, periodStart, periodEnd),
    };
    const cashflow = generateCashFlowStatement(state, periodStart, periodEnd);
    const management = generateManagementAccountingSnapshot(state, periodStart, periodEnd);
    const tax = generateTaxationSummary(state, periodStart, periodEnd);
    const agedBalances = generateAgedBalanceSnapshot(state, periodEnd);

    const summary = {
      inventoryValue: inventory.reduce((sum, row) => sum + row.value, 0) + parts.reduce((sum, row) => sum + row.value, 0),
      receivableDue: receivables.reduce((sum, row) => sum + row.dueAmount, 0),
      payableDue: payables.reduce((sum, row) => sum + row.dueAmount, 0),
      wipCost: wip.reduce((sum, row) => sum + row.total, 0),
    };

    return { inventory: [...inventory, ...parts], lowStock, aging, track, wip, profit, payables, receivables, accounting, cashflow, management, tax, agedBalances, summary };
  }, [state]);

  const handleExport = (format: "excel" | "csv" | "json") => {
    logExport(`report-${format}`, { format, report: selected });
    const payload = data[dataKeyByReport[selected]] ?? data;

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
            Inventory + Accounting + Management Accounting + Taxation
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => handleExport("csv")}>CSV</button>
          <button className="btn-ghost" onClick={() => handleExport("json")}>JSON</button>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("reports")} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4"><p className="text-xs text-cyan-500/40">Inventory Value</p><p className="text-lg neon-text-green">{formatMoney(data.summary.inventoryValue)}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-cyan-500/40">Receivable Due</p><p className="text-lg text-yellow-300">{formatMoney(data.summary.receivableDue)}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-cyan-500/40">Payable Due</p><p className="text-lg text-yellow-300">{formatMoney(data.summary.payableDue)}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-cyan-500/40">WIP Cost</p><p className="text-lg neon-text-cyan">{formatMoney(data.summary.wipCost)}</p></div>
      </div>


      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm tracking-wider text-cyan-300/70" style={{ fontFamily: "Orbitron" }}>
            PROJECT COMPLETION READINESS
          </h2>
          <span className="cyber-chip">TARGET 95%</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="glass-card p-3">
            <p className="text-xs text-cyan-500/40">Overall Completion</p>
            <p className="text-xl neon-text-cyan">{completionRoadmap.overallPercent.toFixed(2)}%</p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-cyan-500/40">Finance Readiness</p>
            <p className="text-xl neon-text-green">{completionRoadmap.financePercent.toFixed(2)}%</p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-cyan-500/40">Forecast to 95%</p>
            <p className="text-xl text-yellow-300">
              {completionRoadmap.forecastToTarget.estimatedSprintsRemaining} sprint(s)
            </p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-3 text-left">Priority</th>
                <th className="py-2 px-3 text-left">Action</th>
                <th className="py-2 px-3 text-left">Area</th>
                <th className="py-2 px-3 text-left">Impact</th>
              </tr>
            </thead>
            <tbody>
              {completionRoadmap.recommendedActions.slice(0, 4).map((item) => (
                <tr key={item.id}>
                  <td className="py-2 px-3 text-cyan-300/70">{item.priority}</td>
                  <td className="py-2 px-3 text-cyan-100/80">{item.title}</td>
                  <td className="py-2 px-3 text-cyan-300/50">{item.area}</td>
                  <td className="py-2 px-3 neon-text-green">+{item.impactPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProfitSummaryWidget
        revenue={data.accounting.profitLoss.revenue.totalRevenue}
        cogs={data.accounting.profitLoss.costOfGoodsSold.totalCOGS}
        grossProfit={data.accounting.profitLoss.grossProfit}
        netProfit={data.accounting.profitLoss.netProfit}
      />

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="glass-card p-4 space-y-2 max-h-[75vh] overflow-auto">
          {reportCards.map((card) => (
            <button
              key={card.key}
              onClick={() => setSelected(card.key)}
              className={cn(
                "w-full text-left p-3 rounded-xl border",
                selected === card.key ? "border-cyan-400/40 bg-cyan-500/10" : "border-cyan-500/10 hover:bg-cyan-500/5"
              )}
            >
              <p className="font-semibold text-cyan-100">{card.title}</p>
              <p className="text-xs text-cyan-500/50">{card.desc}</p>
            </button>
          ))}
        </div>

        <div className="glass-card p-4 overflow-auto">
          <h3 className="text-sm tracking-wider mb-4 text-cyan-300/60" style={{ fontFamily: "Orbitron" }}>REPORT PREVIEW</h3>

          {selected === "inventory" && (
            <table className="w-full text-sm">
              <thead><tr><th className="py-3 px-4 text-left">Type</th><th className="py-3 px-4 text-left">Barcode</th><th className="py-3 px-4 text-left">Name</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Cost</th><th className="py-3 px-4 text-left">Value</th></tr></thead>
              <tbody>{data.inventory.map((r, i) => (
                <tr key={i}><td className="py-2 px-4">{r.type}</td><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.barcode}</td><td className="py-2 px-4 text-cyan-100/60">{r.name}</td><td className="py-2 px-4 text-cyan-300/40">{r.status}</td><td className="py-2 px-4 text-cyan-100/40">{formatMoney(r.cost)}</td><td className="py-2 px-4 neon-text-green">{formatMoney(r.value)}</td></tr>
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
            <tbody>{data.wip.map((w) => (<tr key={w.wip}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{w.wip}</td><td className="py-2 px-4 text-cyan-100/60">{w.laptop}</td><td className="py-2 px-4 text-cyan-300/40">{formatMoney(w.parts)}</td><td className="py-2 px-4 text-cyan-300/40">{formatMoney(w.labor)}</td><td className="py-2 px-4 neon-text-green">{formatMoney(w.total)}</td></tr>))}</tbody></table>
          )}
          {selected === "profit" && (
            <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Invoice</th><th className="py-3 px-4 text-left">Profit</th><th className="py-3 px-4 text-left">Total</th></tr></thead>
            <tbody>{data.profit.map((p) => (<tr key={p.invoice}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{p.invoice}</td><td className="py-2 px-4 neon-text-green">{formatMoney(p.profit)}</td><td className="py-2 px-4 text-cyan-300/40">{formatMoney(p.total)}</td></tr>))}</tbody></table>
          )}
          {selected === "payables" && (
            <>
            <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Purchase</th><th className="py-3 px-4 text-left">Supplier</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Due</th><th className="py-3 px-4 text-left">Status</th></tr></thead>
            <tbody>{data.payables.map((p) => (<tr key={p.purchase}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{p.purchase}</td><td className="py-2 px-4 text-cyan-100/60">{p.supplier}</td><td className="py-2 px-4 text-cyan-300/40">{formatMoney(p.total)}</td><td className="py-2 px-4 text-yellow-300">{formatMoney(p.dueAmount)}</td><td className="py-2 px-4 text-cyan-300/40">{p.paidStatus}</td></tr>))}</tbody></table>
            <div className="mt-4 glass-card p-3">
              <p className="text-xs text-cyan-500/40 mb-2">Aged Payables (days overdue)</p>
              <table className="w-full text-xs">
                <thead><tr><th className="py-2 px-2 text-left">Bucket</th><th className="py-2 px-2 text-left">Purchases</th><th className="py-2 px-2 text-left">Due Amount</th></tr></thead>
                <tbody>
                  {data.agedBalances.payables.map((bucket) => (
                    <tr key={bucket.bucket}>
                      <td className="py-1 px-2 text-cyan-300/70">{bucket.bucket}</td>
                      <td className="py-1 px-2 text-cyan-100/70">{bucket.count}</td>
                      <td className="py-1 px-2 text-yellow-300">{formatMoney(bucket.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-2 text-cyan-100">Total</td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 neon-text-green">{formatMoney(data.agedBalances.totalPayablesDue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </>
          )}
                    {selected === "receivables" && (
            <>
            <table className="w-full text-sm"><thead><tr><th className="py-3 px-4 text-left">Invoice</th><th className="py-3 px-4 text-left">Customer</th><th className="py-3 px-4 text-left">Total</th><th className="py-3 px-4 text-left">Paid</th><th className="py-3 px-4 text-left">Due</th><th className="py-3 px-4 text-left">Status</th></tr></thead>
            <tbody>{data.receivables.map((r) => (<tr key={r.invoice}><td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{r.invoice}</td><td className="py-2 px-4 text-cyan-100/60">{r.customer}</td><td className="py-2 px-4 text-cyan-300/40">{formatMoney(r.total)}</td><td className="py-2 px-4 text-green-300">{formatMoney(r.paidAmount)}</td><td className="py-2 px-4 text-yellow-300">{formatMoney(r.dueAmount)}</td><td className="py-2 px-4 text-cyan-300/40">{r.paidStatus}</td></tr>))}</tbody></table>
            <div className="mt-4 glass-card p-3">
              <p className="text-xs text-cyan-500/40 mb-2">Aged Receivables (days overdue)</p>
              <table className="w-full text-xs">
                <thead><tr><th className="py-2 px-2 text-left">Bucket</th><th className="py-2 px-2 text-left">Invoices</th><th className="py-2 px-2 text-left">Due Amount</th></tr></thead>
                <tbody>
                  {data.agedBalances.receivables.map((bucket) => (
                    <tr key={bucket.bucket}>
                      <td className="py-1 px-2 text-cyan-300/70">{bucket.bucket}</td>
                      <td className="py-1 px-2 text-cyan-100/70">{bucket.count}</td>
                      <td className="py-1 px-2 text-yellow-300">{formatMoney(bucket.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-2 text-cyan-100">Total</td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 neon-text-green">{formatMoney(data.agedBalances.totalReceivablesDue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </>
          )}

          {selected === "accounting" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="glass-card p-3"><p className="text-xs text-cyan-500/40">P&L Net Profit</p><p className="neon-text-green">{formatMoney(data.accounting.profitLoss.netProfit)}</p></div>
                <div className="glass-card p-3"><p className="text-xs text-cyan-500/40">Balance Check</p><p className={data.accounting.balanceSheet.balanceCheck ? "text-green-300" : "text-red-400"}>{data.accounting.balanceSheet.balanceCheck ? "Balanced" : "Unbalanced"}</p></div>
                <div className="glass-card p-3"><p className="text-xs text-cyan-500/40">VAT Net</p><p className="text-yellow-300">{formatMoney(data.accounting.vat.netVAT)}</p></div>
              </div>
            </div>
          )}


          {selected === "cashflow" && (
            <div className="space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <p className="text-xs text-cyan-500/40 mb-2">Direct Method</p>
                  <div className="space-y-1">
                    <p>Cash received from customers: <span className="neon-text-cyan">{formatMoney(data.cashflow.direct.cashReceivedFromCustomers)}</span></p>
                    <p>Cash paid to suppliers: <span className="text-yellow-300">{formatMoney(data.cashflow.direct.cashPaidToSuppliers)}</span></p>
                    <p>Owner contributions: <span className="text-cyan-200">{formatMoney(data.cashflow.direct.ownerContributions)}</span></p>
                    <p>Owner drawings: <span className="text-cyan-200">{formatMoney(data.cashflow.direct.ownerDrawings)}</span></p>
                    <p className="pt-2">Net cash from operations: <span className="neon-text-green">{formatMoney(data.cashflow.direct.netCashFromOperations)}</span></p>
                  </div>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-cyan-500/40 mb-2">Indirect Method</p>
                  <div className="space-y-1">
                    <p>Net profit: <span className="neon-text-cyan">{formatMoney(data.cashflow.indirect.netProfit)}</span></p>
                    <p>Working capital adjustments: <span className="text-yellow-300">{formatMoney(data.cashflow.indirect.workingCapitalAdjustments)}</span></p>
                    <p className="pt-2">Net cash from operations: <span className="neon-text-green">{formatMoney(data.cashflow.indirect.netCashFromOperations)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selected === "management" && (
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="glass-card p-3"><p>Revenue</p><p className="neon-text-cyan">{formatMoney(data.management.revenue)}</p></div>
              <div className="glass-card p-3"><p>Operating Cashflow</p><p className="neon-text-green">{formatMoney(data.management.operatingCashflow)}</p></div>
              <div className="glass-card p-3"><p>Gross Margin</p><p>{data.management.grossMarginPercent.toFixed(2)}%</p></div>
              <div className="glass-card p-3"><p>Net Margin</p><p>{data.management.netMarginPercent.toFixed(2)}%</p></div>
              <div className="glass-card p-3"><p>Receivables Days</p><p>{data.management.receivablesDays.toFixed(1)} days</p></div>
              <div className="glass-card p-3"><p>Inventory Turnover</p><p>{data.management.inventoryTurnover.toFixed(2)}x</p></div>
            </div>
          )}

          {selected === "tax" && (
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-2 px-3">Taxable Revenue</td><td className="py-2 px-3">{formatMoney(data.tax.taxableRevenue)}</td></tr>
                <tr><td className="py-2 px-3">Output VAT</td><td className="py-2 px-3">{formatMoney(data.tax.outputVAT)}</td></tr>
                <tr><td className="py-2 px-3">Input VAT</td><td className="py-2 px-3">{formatMoney(data.tax.inputVAT)}</td></tr>
                <tr><td className="py-2 px-3">Net VAT Payable</td><td className="py-2 px-3 text-yellow-300">{formatMoney(data.tax.netVATPayable)}</td></tr>
                <tr><td className="py-2 px-3">Effective Tax Rate</td><td className="py-2 px-3">{data.tax.effectiveTaxRatePercent.toFixed(2)}%</td></tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
