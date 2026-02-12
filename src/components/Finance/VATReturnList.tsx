import type { VATReturn } from "@/store/types/VATTransactionTypes";

export function VATReturnList({ returns }: { returns: VATReturn[] }) {
  return <table className="w-full"><tbody>{returns.map((r) => <tr key={r.id}><td>{r.periodStart.slice(0,7)}</td><td>{r.outputVAT}</td><td>{r.inputVAT}</td><td>{r.netVAT}</td><td>{r.status}</td></tr>)}</tbody></table>;
}
