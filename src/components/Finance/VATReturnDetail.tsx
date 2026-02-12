import type { VATReturn } from "@/store/types/VATTransactionTypes";

export function VATReturnDetail({ item }: { item: VATReturn }) {
  return <div className="space-y-2"><h3 className="font-semibold">VAT Return Detail</h3>{item.lines.map((line) => <div key={line.box}>Box {line.box}: {line.description} = {line.amount}</div>)}</div>;
}
