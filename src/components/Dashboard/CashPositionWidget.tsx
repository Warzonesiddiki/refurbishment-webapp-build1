export function CashPositionWidget({ current, expectedReceipts, expectedPayments }: { current: number; expectedReceipts: number; expectedPayments: number }) {
  const projected = current + expectedReceipts - expectedPayments;
  return <div className="glass-card p-4"><h3>Cash Position</h3><div>Current {current}</div><div>Expected In {expectedReceipts}</div><div>Expected Out {expectedPayments}</div><div>Projected {projected}</div></div>;
}
