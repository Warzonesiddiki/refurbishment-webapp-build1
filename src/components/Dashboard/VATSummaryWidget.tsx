export function VATSummaryWidget({ outputVAT, inputVAT, netVAT, nextFilingDate }: { outputVAT: number; inputVAT: number; netVAT: number; nextFilingDate: string }) {
  return <div className="glass-card p-4"><h3>VAT Summary</h3><div>Output {outputVAT}</div><div>Input {inputVAT}</div><div>Net {netVAT}</div><div>Next filing {nextFilingDate}</div></div>;
}
