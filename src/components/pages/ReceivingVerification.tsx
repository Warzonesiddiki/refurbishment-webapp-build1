import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import type { LotRecord } from "@/store/appState";

export function ReceivingVerification() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logComplete } = useIdempotentAction("verification-complete", "lot");
  const { trigger } = useUiActionFeedback();
  const [selectedLot, setSelectedLot] = useState<LotRecord | null>(state.lots[0] ?? null);
  const [scanValue, setScanValue] = useState("");
  const [tab, setTab] = useState<"all" | "pending" | "verified">("all");

  const lotLaptops = useMemo(() => {
    if (!selectedLot) return [];
    return state.laptops.filter(l => l.lot === selectedLot.lot);
  }, [state.laptops, selectedLot]);

  const verifiedCount = lotLaptops.filter(l => l.status !== "Pending Verification").length;
  const gradedCount = lotLaptops.filter(l => !["Pending Verification", "Pending Grading"].includes(l.status)).length;
  const total = lotLaptops.length || selectedLot?.items || 0;
  const verifyPct = total ? Math.round((verifiedCount / total) * 100) : 0;
  const gradePct = total ? Math.round((gradedCount / total) * 100) : 0;

  const handleVerify = () => {
    const q = scanValue.trim().toUpperCase();
    if (!q) return;
    const laptop = state.laptops.find(l => l.barcode.toUpperCase() === q);
    if (!laptop || (selectedLot && laptop.lot !== selectedLot.lot)) {
      trigger("error", "Scan mismatch: not in selected lot");
      return;
    }
    dispatch({ type: "UPDATE_LAPTOP", id: laptop.id, payload: { status: "Pending Grading" } });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Verified ${laptop.barcode}`, time: "just now" } });
    trigger("success", `Verified ${laptop.barcode}`);
    setScanValue("");
  };

  const handleComplete = () => {
    if (!selectedLot) return;
    logComplete(selectedLot.lot, { total, verified: verifiedCount });
    const nextStatus = verifiedCount >= total && total > 0 ? "Verified" : "Partially Verified";
    dispatch({ type: "UPDATE_LOT", id: selectedLot.id, payload: { status: nextStatus, verified: verifiedCount } });
    trigger("success", `Verification updated for ${selectedLot.lot} (${verifyPct}%)`);
  };

  const filteredRows = useMemo(() => {
    if (tab === "all") return lotLaptops;
    if (tab === "verified") return lotLaptops.filter(l => l.status !== "Pending Verification");
    return lotLaptops.filter(l => l.status === "Pending Verification");
  }, [lotLaptops, tab]);

  return (
    <div data-page="receiving-verification" data-testid="page-receiving-verification" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>VERIFICATION</h1>
            <span className="cyber-chip cyber-badge-yellow">IN PROGRESS</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Scan-first verification • Progress tracking • Discrepancy notes</p>
        </div>
        <button data-testid="verification-complete" data-action="verification-complete" className="btn-cyber-green px-4 py-2 rounded-lg" disabled={total === 0} onClick={handleComplete}>✓ Complete Verification</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card corner-marks p-5">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Select Lot</label>
          <select className="w-full px-3 py-2 rounded-lg text-sm" value={selectedLot?.id || ""} onChange={e => {
            const lot = state.lots.find(l => l.id === e.target.value) || null;
            setSelectedLot(lot);
          }}>
            {state.lots.map(l => <option key={l.id} value={l.id}>{l.lot} ({l.items} units)</option>)}
          </select>
        </div>
        <div className="glass-card corner-marks p-5">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Progress</label>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-black neon-text-cyan" style={{ fontFamily: "Orbitron" }}>{verifyPct}%</span>
            <div className="flex-1">
              <div className="progress-cyber h-3 mb-1"><div className="progress-cyber-fill" style={{ width: `${verifyPct}%` }} /></div>
              <p className="text-[10px] text-cyan-500/25" style={{ fontFamily: "Share Tech Mono" }}>{verifiedCount} of {total} verified ({verifyPct}%)</p>
              <p className="text-[10px] text-purple-300/40" style={{ fontFamily: "Share Tech Mono" }}>Graded: {gradedCount}/{total} ({gradePct}%)</p>
            </div>
          </div>
        </div>
        <div className="glass-card corner-marks p-5">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Scan to Verify</label>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-lg text-sm" placeholder="Scan barcode" value={scanValue} onChange={e => setScanValue(e.target.value)} />
            <button className="btn-cyber" onClick={handleVerify}>VERIFY</button>
          </div>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="flex items-center gap-0 border-b border-cyan-500/10">
          {(["all", "pending", "verified"] as const).map(t => (
            <button key={t} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all border-b-2 ${tab === t ? "text-cyan-300 border-cyan-400 bg-cyan-500/5" : "text-cyan-500/25 border-transparent"}`} onClick={() => setTab(t)} style={{ fontFamily: "Orbitron" }}>{t} ({t === "all" ? total : t === "verified" ? verifiedCount : total - verifiedCount})</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="py-3 px-4 text-left">Barcode</th><th className="py-3 px-4 text-left">Brand</th><th className="py-3 px-4 text-left">Model</th><th className="py-3 px-4 text-left">Status</th></tr></thead>
            <tbody>
              {filteredRows.map(l => (
                <tr key={l.id}>
                  <td className="py-3 px-4 neon-text-cyan" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}>{l.barcode}</td>
                  <td className="py-3 px-4 text-cyan-100/70">{l.brand}</td>
                  <td className="py-3 px-4 text-cyan-100/50">{l.model}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${l.status === "Pending Verification" ? "cyber-badge-yellow" : "cyber-badge-green"}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
