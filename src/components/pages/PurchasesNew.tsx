import { useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { computeVat } from "@/store/appState";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

export function PurchasesNew() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run } = useIdempotentAction("create-purchase", "purchase");
  const { trigger } = useUiActionFeedback();
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState("");
  const [ref, setRef] = useState("");
  const [lot, setLot] = useState("-");
  const [subtotal, setSubtotal] = useState(0);
  const [paidStatus, setPaidStatus] = useState("Paid");
  const [method, setMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [desc, setDesc] = useState("");

  const vatData = computeVat(subtotal, state.settings.vatRate / 100);
  const total = vatData.total;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: 'Orbitron' }}>NEW PURCHASE</h1>
            <span className="cyber-chip cyber-badge-purple">ENTRY</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: 'Share Tech Mono' }}>Record supplier purchase • VAT • Payments • Link to lot</p>
        </div>
        <button className="btn-ghost">✕ Cancel</button>
      </div>

      <SectionHelpHint hint={getPageSectionHint("purchasesNew")} />

      <div className="glass-card corner-marks p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Supplier">
            <select className="w-full px-3 py-2 rounded-lg text-sm" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Select supplier...</option>
              {state.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="w-full px-3 py-2 rounded-lg text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Reference">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Supplier invoice ref" value={ref} onChange={(e) => setRef(e.target.value)} />
          </Field>
          <Field label="Link to Lot">
            <select className="w-full px-3 py-2 rounded-lg text-sm" value={lot} onChange={(e) => setLot(e.target.value)}>
              <option value="-">— None —</option>
              {state.lots.map(l => <option key={l.id} value={l.lot}>{l.lot}</option>)}
            </select>
          </Field>
        </div>

        <div className="divider-cyber" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Subtotal (Ex VAT)">
            <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" placeholder="0.00" value={subtotal || ""} onChange={(e) => setSubtotal(Number(e.target.value))} />
          </Field>
          <Field label={`VAT (${state.settings.vatRate}%)`}>
            <div className="px-3 py-2 rounded-lg border border-cyan-500/10 bg-cyan-500/3 text-sm neon-text-yellow" style={{ fontFamily: 'Share Tech Mono' }}>
              AED {vatData.vat.toFixed(2)}
            </div>
          </Field>
          <Field label="Total (Inc VAT)">
            <div className="px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-lg font-bold neon-text-cyan" style={{ fontFamily: 'Orbitron' }}>
              AED {total.toFixed(2)}
            </div>
          </Field>
        </div>

        <div className="divider-cyber" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Payment Status">
            <select className="w-full px-3 py-2 rounded-lg text-sm" value={paidStatus} onChange={(e) => setPaidStatus(e.target.value)}>
              <option>Paid</option><option>Partial</option><option>Due</option>
            </select>
          </Field>
          <Field label="Payment Method">
            <select className="w-full px-3 py-2 rounded-lg text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option><option>Bank Transfer</option><option>Card</option>
            </select>
          </Field>
          <Field label="Amount Paid">
            <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" placeholder="0.00" value={amountPaid || ""} onChange={(e) => setAmountPaid(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Description">
          <textarea className="w-full px-3 py-2 rounded-lg text-sm" rows={3} placeholder="Purpose, notes, cost allocations..." style={{ fontFamily: 'Share Tech Mono', fontSize: '12px' }} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>

        <div className="flex justify-between items-center pt-4 border-t border-cyan-500/10">
          <button className="btn-ghost" data-action="save-purchase-draft" onClick={() => {
            run("purchase-draft", { draft: true, supplier, date, ref, lot, subtotal, vat: vatData.vat, total, paidStatus, method, amountPaid, desc });
            dispatch({ type: "ADD_PURCHASE", payload: { purchase: `ALM-PO-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(state.purchases.length + 1).padStart(4, "0")}`, date: date || new Date().toISOString().slice(0, 10), supplier: supplier || "Unknown", lot, subtotal, vat: vatData.vat, total, paid: paidStatus, status: paidStatus === "Paid" ? "Closed" : "Open" } });
            trigger("info", "Draft saved");
          }}>Save Draft</button>
          <div className="flex gap-3">
            <p className="text-[9px] text-cyan-500/15 self-center" style={{ fontFamily: 'Share Tech Mono' }}>Auto: purchase# • cash register • audit log</p>
            <button className="btn-cyber" data-action="save-purchase" onClick={() => {
              run("purchase-final", { supplier, date, ref, lot, subtotal, vat: vatData.vat, total, paidStatus, method, amountPaid, desc });
              dispatch({ type: "ADD_PURCHASE", payload: { purchase: `ALM-PO-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(state.purchases.length + 1).padStart(4, "0")}`, date: date || new Date().toISOString().slice(0, 10), supplier: supplier || "Unknown", lot, subtotal, vat: vatData.vat, total, paid: paidStatus, status: paidStatus === "Paid" ? "Closed" : "Open" } });
              if (method === "Cash" && amountPaid > 0) {
                const lastBalance = state.cashEntries.length > 0 ? state.cashEntries[state.cashEntries.length - 1].balance : 0;
                dispatch({ type: "ADD_CASH_ENTRY", payload: { time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), type: "Cash Out", desc: `Purchase payment`, amount: -amountPaid, balance: lastBalance - amountPaid } });
              }
              trigger("success", "Purchase logged");
            }}>✓ Save Purchase</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-1.5" style={{ fontFamily: 'Orbitron' }}>{label}</label>
      {children}
    </div>
  );
}
