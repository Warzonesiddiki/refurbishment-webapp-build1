import type { VATReturn as VATReturnType } from "@/store/types/VATTransactionTypes";

export function VATReturn({ vatReturn }: { vatReturn: VATReturnType }) {
  return (
    <div data-component="Finance-VATReturn" data-testid="component-Finance-VATReturn" className="glass-card p-4 space-y-2">
      <h2 className="text-lg font-bold">VAT Return</h2>
      <div>Period: {vatReturn.periodStart.slice(0, 10)} - {vatReturn.periodEnd.slice(0, 10)}</div>
      <div>Output VAT: {vatReturn.outputVAT.toFixed(2)}</div>
      <div>Input VAT: {vatReturn.inputVAT.toFixed(2)}</div>
      <div>Net: {vatReturn.netVAT.toFixed(2)}</div>
    </div>
  );
}
