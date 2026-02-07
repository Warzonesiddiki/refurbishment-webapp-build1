export function openPrintWindow(title: string, body: string) {
  const w = window.open("", "print-window");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;font-size:12px}</style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function printLabel(barcode: string, title = "Barcode Label") {
  openPrintWindow(title, `<h1>${title}</h1><div style="font-size:18px;letter-spacing:2px">${barcode}</div>`);
}

export function printInvoice(invoice: { id: string; customer: string; date: string; items: { name: string; price: number }[]; total: number; vat: number; subtotal: number }) {
  const rows = invoice.items.map(i => `<tr><td>${i.name}</td><td>AED ${i.price.toFixed(2)}</td></tr>`).join("");
  openPrintWindow(`Invoice ${invoice.id}`, `<h1>Invoice ${invoice.id}</h1><p>Date: ${invoice.date}</p><p>Customer: ${invoice.customer}</p><table><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: AED ${invoice.subtotal.toFixed(2)}</p><p>VAT: AED ${invoice.vat.toFixed(2)}</p><p><strong>Total: AED ${invoice.total.toFixed(2)}</strong></p>`);
}

export function printReceipt(receipt: { id: string; date: string; invoice: string; amount: number; method: string }) {
  openPrintWindow(`Receipt ${receipt.id}`, `<h1>Receipt ${receipt.id}</h1><p>Date: ${receipt.date}</p><p>Invoice: ${receipt.invoice}</p><p>Method: ${receipt.method}</p><p><strong>Amount: AED ${receipt.amount.toFixed(2)}</strong></p>`);
}

export function printManifest(lot: { lot: string; supplier: string; received: string; items: number }) {
  openPrintWindow(`Lot ${lot.lot}`, `<h1>Lot Manifest ${lot.lot}</h1><p>Supplier: ${lot.supplier}</p><p>Received: ${lot.received}</p><p>Items: ${lot.items}</p>`);
}
