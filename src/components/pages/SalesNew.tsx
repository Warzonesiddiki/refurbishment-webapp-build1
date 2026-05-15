import { useState, useMemo } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { computeVat } from "@/store/appState";
import { printInvoice, printReceipt } from "@/utils/print";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

type CartItem = { id: string; barcode: string; name: string; price: number; cost: number };

export function SalesNew() {
  const [lastSale, setLastSale] = useState<{ invoice: string; date: string; customer: string; items: { name: string; price: number }[]; total: number; vat: number; subtotal: number; method: string } | null>(null);

  const state = useAppState();
  const dispatch = useDispatch();
  const [scanInput, setScanInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [completed, setCompleted] = useState<string | null>(null);

  const addToCart = () => {
    const q = scanInput.trim().toUpperCase();
    if (!q) return;
    const laptop = state.laptops.find(l => l.barcode.toUpperCase() === q && l.status === "Ready for Sale");
    if (!laptop) return;
    if (cart.find(c => c.barcode === laptop.barcode)) return;

    const sellPrice = Math.round(laptop.cost * 1.35); // ~35% markup
    setCart(prev => [...prev, { id: laptop.id, barcode: laptop.barcode, name: `${laptop.brand} ${laptop.model}`, price: sellPrice, cost: laptop.cost }]);
    setScanInput("");
  };

  const removeFromCart = (barcode: string) => setCart(prev => prev.filter(c => c.barcode !== barcode));
  const handleScanKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") addToCart(); };

  const subtotal = useMemo(() => cart.reduce((a, c) => a + c.price, 0), [cart]);
  const vatAmount = useMemo(() => computeVat(subtotal, state.settings.vatRate / 100).vat, [subtotal, state.settings.vatRate]);
  const total = subtotal + vatAmount;
  const totalCost = cart.reduce((a, c) => a + c.cost, 0);
  const profit = subtotal - totalCost;
  const changeDue = Math.max(0, amountReceived - total);

  const completeSale = () => {
    if (cart.length === 0) return;

    const invoiceNum = `ALM-INV-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(state.sales.length + 1).padStart(4, "0")}`;
    const receiptNum = `ALM-RC-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(state.receipts.length + 1).padStart(4, "0")}`;
    const today = new Date().toISOString().slice(0, 10);

    const saleSnapshot = {
      invoice: invoiceNum,
      date: today,
      customer: customer || "Walk-in",
      items: cart.map((c) => ({ name: c.name, price: c.price })),
      total,
      vat: vatAmount,
      subtotal,
      method: paymentMethod,
    };

    // Mark laptops as SOLD
    cart.forEach(item => {
      dispatch({ type: "UPDATE_LAPTOP", id: item.id, payload: { status: "Sold" } });
    });

    // Create sale
    dispatch({
      type: "ADD_SALE",
      payload: {
        invoice: invoiceNum, date: today, customer: customer || "Walk-in",
        items: cart.length, subtotal, vat: vatAmount, total, profit,
        status: "Paid", method: paymentMethod,
        lineItems: cart.map(c => ({ barcode: c.barcode, name: c.name, price: c.price, cost: c.cost, profit: c.price - c.cost })),
      },
    });

    // Create receipt
    dispatch({
      type: "ADD_RECEIPT",
      payload: { receipt: receiptNum, date: today, invoice: invoiceNum, amount: total, method: paymentMethod, reference: "" },
    });

    // Cash register entry if cash
    if (paymentMethod === "Cash") {
      const lastBalance = state.cashEntries.length > 0 ? state.cashEntries[state.cashEntries.length - 1].balance : 0;
      dispatch({
        type: "ADD_CASH_ENTRY",
        payload: { time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), type: "Cash In", desc: `Sale ${invoiceNum}`, amount: total, balance: lastBalance + total },
      });
    }

    setCompleted(invoiceNum);
    setLastSale(saleSnapshot);
    setCart([]);
    setCustomer("");
    setAmountReceived(0);
  };

  if (completed) {
    return (
      <div data-page="sales-new" data-testid="page-sales-new" className="space-y-6">
        <div className="glass-card corner-marks p-12 text-center space-y-4">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold neon-text-green" style={{ fontFamily: "var(--font-heading)" }}>SALE COMPLETED</h2>
          <p className="text-lg neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>{completed}</p>
          <p className="text-sm text-cyan-400/40">Invoice and receipt have been generated successfully.</p>
          <div className="flex justify-center gap-3 pt-4">
            <button className="btn-cyber" onClick={() => { setCompleted(null); setLastSale(null); }}>+ New Sale</button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (!lastSale) return;
                printInvoice({
                  id: lastSale.invoice,
                  customer: lastSale.customer,
                  date: lastSale.date,
                  items: lastSale.items,
                  total: lastSale.total,
                  vat: lastSale.vat,
                  subtotal: lastSale.subtotal,
                });
              }}
            >
              🖨️ Print Invoice
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (!lastSale) return;
                printReceipt({
                  id: `RC-${lastSale.invoice}`,
                  date: lastSale.date,
                  invoice: lastSale.invoice,
                  amount: lastSale.total,
                  method: lastSale.method,
                });
              }}
            >
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>NEW SALE</h1>
            <span className="cyber-chip cyber-badge-green">POS</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>Scan items • Calculate totals • Process payment</p>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("salesNew")} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scan Input */}
          <div className="glass-card p-4">
            <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>SCAN LAPTOP BARCODE</label>
            <div className="flex gap-3">
              <input value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={handleScanKey} placeholder="ALM-LP-XXXXXXXX-XXXX" className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} autoFocus />
              <button className="btn-cyber" onClick={addToCart}>+ Add</button>
            </div>
            <p className="text-[10px] text-cyan-500/20 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
              Only laptops with status "Ready for Sale" can be added
            </p>
          </div>

          {/* Cart Items */}
          <div className="glass-card corner-marks p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-cyan-500/10">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>CART ({cart.length} items)</h3>
            </div>
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3 opacity-20">🛒</div>
                <p className="text-sm text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>Scan items to add to cart</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-left">Barcode</th>
                    <th className="py-2 px-4 text-left">Item</th>
                    <th className="py-2 px-4 text-right">Cost</th>
                    <th className="py-2 px-4 text-right">Price</th>
                    <th className="py-2 px-4 text-right">Profit</th>
                    <th className="py-2 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.barcode}>
                      <td className="py-2 px-4 neon-text-cyan" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{item.barcode}</td>
                      <td className="py-2 px-4 text-cyan-200/70 font-semibold">{item.name}</td>
                      <td className="py-2 px-4 text-right text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>AED {item.cost}</td>
                      <td className="py-2 px-4 text-right neon-text-green" style={{ fontFamily: "var(--font-mono)" }}>AED {item.price}</td>
                      <td className="py-2 px-4 text-right neon-text-magenta" style={{ fontFamily: "var(--font-mono)" }}>AED {item.price - item.cost}</td>
                      <td className="py-2 px-4 text-right">
                        <button className="text-[11px] text-red-400/50 hover:text-red-300 font-semibold" onClick={() => removeFromCart(item.barcode)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Customer */}
          <div className="glass-card p-4">
            <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>CUSTOMER (OPTIONAL)</label>
            <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Walk-in customer or company name" className="w-full px-3 py-2 rounded-lg text-sm" />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="glass-card corner-marks p-5 space-y-4">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>ORDER SUMMARY</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cyan-400/40">Subtotal (Ex VAT)</span>
                <span className="font-bold text-cyan-200/70" style={{ fontFamily: "var(--font-mono)" }}>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-400/40">VAT ({state.settings.vatRate}%)</span>
                <span className="font-bold text-cyan-200/70" style={{ fontFamily: "var(--font-mono)" }}>AED {vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-cyan-500/10 pt-2 flex justify-between">
                <span className="text-sm font-bold neon-text-cyan">TOTAL (Inc VAT)</span>
                <span className="text-xl font-bold neon-text-green" style={{ fontFamily: "var(--font-heading)" }}>AED {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-cyan-400/40">Profit</span>
                <span className="font-bold neon-text-magenta" style={{ fontFamily: "var(--font-mono)" }}>AED {profit.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-cyan-500/10 pt-4 space-y-3">
              <div>
                <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>PAYMENT METHOD</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm">
                  <option>Cash</option><option>Card</option><option>Transfer</option>
                </select>
              </div>

              {paymentMethod === "Cash" && (
                <>
                  <div>
                    <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>AMOUNT RECEIVED</label>
                    <input type="number" value={amountReceived || ""} onChange={e => setAmountReceived(Number(e.target.value))} placeholder="0.00" className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400/40">Change Due</span>
                    <span className="font-bold neon-text-green" style={{ fontFamily: "var(--font-mono)" }}>AED {changeDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              className="btn-cyber w-full py-3 text-lg"
              disabled={cart.length === 0 || (paymentMethod === "Cash" && amountReceived < total)}
              onClick={completeSale}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              ✓ COMPLETE SALE
            </button>
          </div>

          {/* Quick Add */}
          <div className="glass-card p-4">
            <h4 className="text-xs font-bold neon-text-purple mb-3" style={{ fontFamily: "var(--font-heading)" }}>AVAILABLE FOR SALE</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {state.laptops.filter(l => l.status === "Ready for Sale" && !cart.find(c => c.barcode === l.barcode)).slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-all" onClick={() => { setScanInput(l.barcode); }}>
                  <div>
                    <p className="text-[10px] neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>{l.barcode}</p>
                    <p className="text-[11px] text-cyan-200/50">{l.brand} {l.model}</p>
                  </div>
                  <span className="text-[10px] neon-text-green" style={{ fontFamily: "var(--font-mono)" }}>AED {l.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
