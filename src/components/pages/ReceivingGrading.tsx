import { useEffect, useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";

const checklist = [
  { title: "Power", icon: "⚡", items: ["Powers on", "Battery health >60%", "Charger included", "Charges correctly"] },
  { title: "Display", icon: "◻", items: ["No dead pixels", "Backlight uniform", "No cracks/damage", "Hinges firm"] },
  { title: "Keyboard", icon: "⌨", items: ["All keys working", "Backlight functional", "Trackpad responsive", "No sticky keys"] },
  { title: "Ports", icon: "⊞", items: ["USB-A ports", "USB-C ports", "HDMI/DP output", "Audio jack", "Network/WiFi"] },
  { title: "Physical", icon: "⬢", items: ["Top cover intact", "Bottom cover intact", "No dents", "Minimal scratches", "Rubber feet"] },
];

const grades = [
  { label: "A", desc: "Excellent — minimal cosmetic wear", color: "green", border: "border-green-500/40", bg: "bg-green-500/10", text: "neon-text-green" },
  { label: "B", desc: "Good — light wear, fully functional", color: "yellow", border: "border-yellow-500/40", bg: "bg-yellow-500/10", text: "neon-text-yellow" },
  { label: "C", desc: "Fair — visible wear, may need repair", color: "red", border: "border-red-500/40", bg: "bg-red-500/10", text: "neon-text-red" },
];

const tracks = [
  { label: "Track A", desc: "Clean + Install + QC", color: "border-cyan-500/30", icon: "A" },
  { label: "Track B", desc: "Cosmetic refurb + paint", color: "border-green-500/30", icon: "B" },
  { label: "Track C", desc: "Repair + parts replacement", color: "border-yellow-500/30", icon: "C" },
  { label: "Track E", desc: "Disassembly / Harvest", color: "border-red-500/30", icon: "E" },
];

const criticalChecklistItems = new Set([
  "Powers on",
  "No cracks/damage",
  "All keys working",
  "USB-C ports",
  "Network/WiFi",
]);

function getRecommendedGrading(itemStates: Record<string, boolean>) {
  const checklistItems = checklist.flatMap((group) => group.items);
  const checkedCount = checklistItems.filter((item) => itemStates[item]).length;
  const completionRate = checkedCount / checklistItems.length;
  const criticalFailures = checklistItems.filter((item) => criticalChecklistItems.has(item) && !itemStates[item]).length;

  if (criticalFailures >= 2 || completionRate < 0.5) {
    return { grade: "C", track: "Track C", reason: "Critical failures detected" };
  }
  if (criticalFailures === 1 || completionRate < 0.8) {
    return { grade: "B", track: "Track B", reason: "Minor issues require cosmetic or light rework" };
  }
  return { grade: "A", track: "Track A", reason: "All key checks passed" };
}

export function ReceivingGrading() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run: logGrade } = useIdempotentAction("grading-save", "laptop");
  const { trigger } = useUiActionFeedback();
  const queue = useMemo(() => state.laptops.filter(l => l.status === "Pending Grading"), [state.laptops]);
  const [selected, setSelected] = useState<(typeof queue)[number] | null>(queue[0] || null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(checklist.flatMap((group) => group.items.map((item) => [item, true])))
  );

  const recommendation = useMemo(() => getRecommendedGrading(checklistState), [checklistState]);

  useEffect(() => {
    if (!selectedGrade) {
      setSelectedGrade(recommendation.grade);
    }
    if (!selectedTrack) {
      setSelectedTrack(recommendation.track);
    }
  }, [recommendation.grade, recommendation.track, selectedGrade, selectedTrack]);

  const checklistCompletion = useMemo(() => {
    const total = Object.keys(checklistState).length;
    const passed = Object.values(checklistState).filter(Boolean).length;
    return Math.round((passed / total) * 100);
  }, [checklistState]);

  const handleSave = () => {
    if (!selected || !selectedGrade || !selectedTrack) return;
    logGrade(selected.barcode, { grade: selectedGrade, track: selectedTrack });
    dispatch({ type: "UPDATE_LAPTOP", id: selected.id, payload: { grade: selectedGrade, track: selectedTrack, status: "In Processing" } });
    if (selectedTrack === "Track C") {
      dispatch({
        type: "ADD_WIP",
        payload: {
          wip: `ALM-WIP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(state.wipJobs.length + 1).padStart(4, "0")}`,
          laptop: selected.barcode,
          brand: `${selected.brand} ${selected.model}`,
          track: selectedTrack,
          stage: "Queue",
          assignedTo: "Unassigned",
          partsUsed: 0,
          partsCost: 0,
          laborHrs: 0,
          priority: "Normal",
          status: "Active",
          opened: new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
          diagnosisNotes: "",
          parts: [],
          laborEntries: [],
          history: [{ ts: new Date().toLocaleString(), action: "WIP auto-created from grading", user: "system" }],
        },
      });
    }
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Graded ${selected.barcode} → ${selectedGrade} / ${selectedTrack}`, time: "just now" } });
    trigger("success", `Graded ${selected.barcode}`);
  };

  const handleLoad = () => {
    const laptop = queue.find((item) => item.barcode === barcodeInput.trim());
    setSelected(laptop || queue[0] || null);
  };

  return (
    <div data-page="receiving-grading" data-testid="page-receiving-grading" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>GRADING</h1>
            <span className="cyber-chip cyber-badge-purple">INSPECTION</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>Scan laptop • Run checklist • Assign grade & track</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => setSelected(queue[1] || null)}>⟲ Skip</button>
          <button className="btn-ghost" onClick={() => setSelected(null)}>✕ Cancel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass-card corner-marks p-6">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>
            Scan / Load Laptop
          </label>
          <div className="flex gap-3">
            <input
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-lg animate-border-glow"
              placeholder="Scan barcode"
              style={{ fontFamily: "Share Tech Mono", fontSize: "16px" }}
            />
            <button className="btn-cyber" onClick={handleLoad}>LOAD</button>
          </div>
        </div>
        <div className="glass-card corner-marks p-5 neon-border">
          <div className="flex justify-center gap-[2px] mb-3 h-12">
            {Array.from({ length: 25 }).map((_, i) => (<div key={i} className="bg-cyan-400/50" style={{ width: [1,2,3][i%3] + "px", opacity: 0.3 + Math.random() * 0.7 }} />))}
          </div>
          <p className="text-center text-[12px] neon-text-cyan mb-3" style={{ fontFamily: "Share Tech Mono" }}>{selected?.barcode || "—"}</p>
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-cyan-100/70">{selected ? `${selected.brand} ${selected.model}` : "No selection"}</p>
            <span className="cyber-chip cyber-badge-yellow">Checklist {checklistCompletion}%</span>
          </div>
        </div>
      </div>

      <div className="glass-card corner-marks p-6">
        <div className="section-header mb-5">
          <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: "Orbitron" }}>INSPECTION CHECKLIST</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklist.map((group) => (
            <div key={group.title} className="glass-card p-4 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm neon-text-cyan opacity-50">{group.icon}</span>
                <h4 className="text-[12px] font-bold tracking-wider text-cyan-200/60" style={{ fontFamily: "Orbitron" }}>{group.title}</h4>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={checklistState[item]}
                      onChange={(event) => setChecklistState((prev) => ({ ...prev, [item]: event.target.checked }))}
                    />
                    <span className="text-[12px] text-cyan-100/50 group-hover:text-cyan-100/70 transition-colors" style={{ fontFamily: "Rajdhani" }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Issues Found</label>
          <textarea className="w-full px-3 py-2 rounded-lg text-sm" rows={5} placeholder="Describe cosmetic or functional issues..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} />
        </div>
        <div className="glass-card p-5">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-3" style={{ fontFamily: "Orbitron" }}>Assign Grade</label>
          <div className="space-y-2">
            <select className="w-full p-3 rounded-lg border border-cyan-500/20 bg-transparent" value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
              {grades.map((grade) => (
                <option key={grade.label} value={grade.label}>{grade.label} — {grade.desc}</option>
              ))}
            </select>
            <p className="text-[11px] text-cyan-100/50" style={{ fontFamily: "Rajdhani" }}>
              Recommended: <span className="neon-text-cyan">{recommendation.grade}</span> ({recommendation.reason})
            </p>
          </div>
          <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mt-4 mb-3" style={{ fontFamily: "Orbitron" }}>Assign Track</label>
          <div className="space-y-2">
            <select className="w-full p-3 rounded-lg border border-cyan-500/20 bg-transparent" value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)}>
              {tracks.map((track) => (
                <option key={track.label} value={track.label}>{track.label} — {track.desc}</option>
              ))}
            </select>
            <p className="text-[11px] text-cyan-100/50" style={{ fontFamily: "Rajdhani" }}>
              Recommended: <span className="neon-text-cyan">{recommendation.track}</span>
            </p>
          </div>
        </div>
        <div className="glass-card p-5 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Estimated Sell Price (AED)</label>
            <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: "Orbitron" }}>Technician Notes</label>
            <textarea className="w-full px-3 py-2 rounded-lg text-sm" rows={3} placeholder="Additional notes..." style={{ fontFamily: "Share Tech Mono", fontSize: "12px" }} />
          </div>
          <div className="divider-cyber" />
          <div className="flex flex-col gap-2">
            <button data-testid="grading-save" data-action="grading-save" className="btn-cyber-green w-full py-3 rounded-lg border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold transition-all uppercase tracking-wider text-[13px]" onClick={handleSave}>✓ Save Grade</button>
            <button className="btn-ghost w-full text-xs">Save Draft</button>
          </div>
        </div>
      </div>

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/10 flex items-center justify-between">
          <div className="section-header flex-1"><h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: "Orbitron" }}>GRADING QUEUE</h3></div>
          <button className="btn-ghost text-xs">⟲ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="py-3 px-4 text-left">Barcode</th><th className="py-3 px-4 text-left">Brand / Model</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Grade</th><th className="py-3 px-4 text-left">Track</th><th className="py-3 px-4 text-left">Actions</th></tr></thead>
            <tbody>
              {queue.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 px-4" style={{ fontFamily: "Share Tech Mono", fontSize: "11px" }}><span className="neon-text-cyan">{row.barcode}</span></td>
                  <td className="py-3 px-4 text-cyan-100/60">{row.brand} {row.model}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${row.status === "Pending Grading" ? "cyber-badge-yellow" : "cyber-badge-green"}`}>{row.status}</span></td>
                  <td className="py-3 px-4">{row.grade ? <span className={`cyber-chip ${row.grade === "A" ? "cyber-badge-green" : row.grade === "B" ? "cyber-badge-yellow" : "cyber-badge-red"}`}>{row.grade}</span> : "—"}</td>
                  <td className="py-3 px-4 text-cyan-100/40">{row.track}</td>
                  <td className="py-3 px-4"><button className="text-[11px] neon-text-cyan font-semibold" onClick={() => setSelected(row)}>Load</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
