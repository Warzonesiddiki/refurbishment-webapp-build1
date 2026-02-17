import { useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import type { Action } from "@/store/appState";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { canAdvance } from "@/domain";

const trackConfig: Record<string, { label: string; color: string; stages: string[] }> = {
  "Track A": { label: "Standard Refurb", color: "cyan", stages: ["Queue", "Cleaning", "Windows Install", "QC", "Packing"] },
  "Track B": { label: "Cosmetic Refurb", color: "purple", stages: ["Queue", "Disassembly", "Paint Queue", "Painting", "Drying", "Reassembly", "To Testing"] },
  "Track C": { label: "Repair Track", color: "magenta", stages: ["Queue", "Diagnosis", "Awaiting Parts", "Repair", "Repair Complete", "To Testing"] },
  "Track D": { label: "Testing", color: "green", stages: ["L1 Queue", "L1 Testing", "L1 Failed", "L2 Queue", "L2 Testing", "L2 Failed", "Passed"] },
  "Track E": { label: "Harvest/Dispose", color: "red", stages: ["Queue", "Disassembly/Harvest", "Parts Logged", "Complete/Disposed"] },
};

type AddPartPayload = Extract<Action, { type: "ADD_PART" }>["payload"];

function normalizeTrackLabel(track: string) {
  const match = /(?:Track\s*)?([A-E])/i.exec(track.trim());
  return match ? `Track ${match[1].toUpperCase()}` : track.trim();
}

export function ProcessingTracks() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [activeTrack, setActiveTrack] = useState("Track A");
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [selectedLaptop, setSelectedLaptop] = useState<string | null>(null);
  const [testResult, setTestResult] = useState("Passed");
  const [harvestPart, setHarvestPart] = useState("");
  const [harvestQty, setHarvestQty] = useState(1);

  const { run: logMove } = useIdempotentAction("wip-move-stage", "wip");
  const { trigger } = useUiActionFeedback();

  const config = trackConfig[activeTrack];
  const trackLetter = activeTrack.split(" ")[1] as "A" | "B" | "C" | "D" | "E";

  const getActiveTrackWip = (barcode: string) => {
    const jobs = state.wipJobs.filter(
      (w) => w.laptop === barcode && normalizeTrackLabel(w.track) === activeTrack && w.status !== "Completed"
    );
    if (jobs.length > 0) return jobs[jobs.length - 1];
    const fallback = state.wipJobs.filter((w) => w.laptop === barcode && normalizeTrackLabel(w.track) === activeTrack);
    return fallback.length > 0 ? fallback[fallback.length - 1] : undefined;
  };

  const trackBarcodes = new Set<string>();
  state.laptops.forEach((l) => {
    if (normalizeTrackLabel(l.track) === activeTrack) {
      trackBarcodes.add(l.barcode);
    }
  });
  state.wipJobs.forEach((w) => {
    if (normalizeTrackLabel(w.track) === activeTrack && w.status !== "Completed") {
      trackBarcodes.add(w.laptop);
    }
  });

  const trackLaptops = Array.from(trackBarcodes)
    .map((barcode) => state.laptops.find((l) => l.barcode === barcode))
    .filter((laptop): laptop is NonNullable<typeof laptop> => Boolean(laptop));

  const getLaptopsForStage = (stage: string) => {
    return trackLaptops.filter((l) => {
      const wip = getActiveTrackWip(l.barcode);
      const currentStage = wip?.stage ?? config.stages[0];
      return currentStage === stage;
    });
  };

  const moveLaptop = (laptopId: string, toStage: string) => {
    const laptop = state.laptops.find(l => l.id === laptopId);
    if (!laptop) return;
    const wip = getActiveTrackWip(laptop.barcode);
    const currentStage = wip?.stage ?? config.stages[0];

    if (!canAdvance(trackLetter, currentStage, toStage)) {
      trigger("error", `Invalid move: ${currentStage} → ${toStage}`);
      return;
    }

    logMove(laptop.barcode, { from: currentStage, to: toStage });

    if (wip) {
      dispatch({ type: "UPDATE_WIP", id: wip.id, payload: { stage: toStage, history: [...wip.history, { ts: new Date().toLocaleString(), action: `Moved to ${toStage}`, user: "admin" }] } });
    }
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `${laptop.barcode} moved to ${toStage} on ${activeTrack}`, time: "just now" } });
    trigger("success", `${laptop.barcode} → ${toStage}`);
    setDragItem(null);
  };

  const saveTestResult = () => {
    if (!selectedLaptop) return;
    const laptop = state.laptops.find(l => l.id === selectedLaptop);
    if (!laptop) return;
    dispatch({ type: "UPDATE_LAPTOP", id: laptop.id, payload: { testResult } });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Test result for ${laptop.barcode}: ${testResult}`, time: "just now" } });
    trigger("success", `Test result saved: ${testResult}`);
    setSelectedLaptop(null);
  };

  const addHarvestPart = () => {
    if (!selectedLaptop || !harvestPart) return;
    const laptop = state.laptops.find(l => l.id === selectedLaptop);
    const payload: AddPartPayload = {
      barcode: `ALM-PT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-H`,
      name: harvestPart,
      category: "Harvest",
      spec: laptop ? `${laptop.brand} ${laptop.model}` : "Harvest",
      condition: "Harvested",
      onHand: harvestQty,
      available: harvestQty,
      reorder: 0,
      cost: 0,
      location: "Harvest",
    };
    dispatch({
      type: "ADD_PART",
      payload,
    });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Harvested part: ${harvestPart} x${harvestQty}`, time: "just now" } });
    trigger("success", `Harvested ${harvestPart}`);
    setHarvestPart("");
  };

  const neonClass = (color: string) => {
    const map: Record<string, string> = { cyan: "neon-text-cyan", purple: "neon-text-purple", magenta: "neon-text-magenta", green: "neon-text-green", red: "text-red-400" };
    return map[color] || "neon-text-cyan";
  };

  const borderClass = (color: string) => {
    const map: Record<string, string> = { cyan: "border-cyan-500/20", purple: "border-purple-500/20", magenta: "border-pink-500/20", green: "border-green-500/20", red: "border-red-500/20" };
    return map[color] || "border-cyan-500/20";
  };

  return (
    <div data-page="processing-tracks" data-testid="page-processing-tracks" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>PROCESSING TRACKS</h1>
            <span className="cyber-chip cyber-badge-purple">KANBAN</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>Drag & drop laptops between processing stages</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(trackConfig).map(([key, tc]) => {
          const count = state.laptops.filter(l => l.track === key).length;
          return (
            <button key={key} onClick={() => setActiveTrack(key)} className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTrack === key ? `bg-${tc.color === "magenta" ? "pink" : tc.color}-500/15 ${neonClass(tc.color)} border border-${tc.color === "magenta" ? "pink" : tc.color}-500/30` : "text-cyan-500/30 border border-cyan-500/10"}`} style={{ fontFamily: "var(--font-heading)" }}>
              {key} <span className="ml-1 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-bold ${neonClass(config.color)}`} style={{ fontFamily: "var(--font-heading)" }}>{activeTrack} — {config.label}</h2>
            <p className="text-xs text-cyan-500/30 mt-1" style={{ fontFamily: "var(--font-mono)" }}>{trackLaptops.length} laptops in pipeline • {config.stages.length} stages</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs">📊 Stats</button>
            <button className="btn-ghost text-xs">↗ Export</button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
        {config.stages.map(stage => {
          const stageLaptops = getLaptopsForStage(stage);
          return (
            <div key={stage} className={`flex-shrink-0 w-[240px] glass-card p-0 overflow-hidden border ${borderClass(config.color)}`} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragItem) moveLaptop(dragItem, stage); }}>
              <div className={`px-3 py-2.5 border-b ${borderClass(config.color)} bg-cyan-500/5`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-200/70" style={{ fontFamily: "var(--font-heading)" }}>{stage.toUpperCase()}</h3>
                  <span className={`text-[10px] font-bold ${neonClass(config.color)}`} style={{ fontFamily: "var(--font-mono)" }}>{stageLaptops.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[300px]">
                {stageLaptops.length === 0 ? (
                  <div className="py-8 text-center text-cyan-500/15 text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>Drop here</div>
                ) : stageLaptops.map(laptop => (
                  <div key={laptop.id} draggable onDragStart={() => setDragItem(laptop.id)} onDragEnd={() => setDragItem(null)} className={`p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 cursor-grab hover:border-cyan-500/25 transition-all ${dragItem === laptop.id ? "opacity-50 scale-95" : ""}`}>
                    <p className="text-[10px] font-bold neon-text-cyan mb-1" style={{ fontFamily: "var(--font-mono)" }}>{laptop.barcode}</p>
                    <p className="text-[11px] text-cyan-200/60 font-semibold">{laptop.brand} {laptop.model}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${laptop.grade === "A" ? "bg-green-500/10 text-green-400" : laptop.grade === "B" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>Grade {laptop.grade}</span>
                      <button className="text-[9px] text-cyan-400/40" onClick={() => setSelectedLaptop(laptop.id)}>Detail</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLaptop && activeTrack === "Track D" && (
        <div className="glass-card neon-border p-5">
          <h3 className="text-sm font-bold neon-text-green" style={{ fontFamily: "Orbitron" }}>Track D Test Result</h3>
          <div className="flex gap-3 mt-3">
            <select className="px-3 py-2 rounded-lg text-sm" value={testResult} onChange={e => setTestResult(e.target.value)}>
              <option>Passed</option><option>Failed L1</option><option>Failed L2</option>
            </select>
            <button className="btn-cyber" onClick={saveTestResult}>Save Result</button>
          </div>
        </div>
      )}

      {selectedLaptop && activeTrack === "Track E" && (
        <div className="glass-card neon-border p-5">
          <h3 className="text-sm font-bold text-red-400" style={{ fontFamily: "Orbitron" }}>Track E Harvest Parts</h3>
          <div className="flex gap-3 mt-3">
            <input className="px-3 py-2 rounded-lg text-sm" placeholder="Part name" value={harvestPart} onChange={e => setHarvestPart(e.target.value)} />
            <input type="number" className="px-3 py-2 rounded-lg text-sm" placeholder="Qty" value={harvestQty} onChange={e => setHarvestQty(Number(e.target.value))} />
            <button className="btn-cyber" onClick={addHarvestPart}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
