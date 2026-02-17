import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import type { Action } from "@/store/appState";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { canAdvance } from "@/domain";
import { exportCsv } from "@/utils/exporters";

const trackConfig: Record<
  string,
  { label: string; color: "cyan" | "purple" | "magenta" | "green" | "red"; stages: string[] }
> = {
  "Track A": {
    label: "Standard Refurb",
    color: "cyan",
    stages: ["Queue", "Cleaning", "Windows Install", "QC", "Packing"],
  },
  "Track B": {
    label: "Cosmetic Refurb",
    color: "purple",
    stages: ["Queue", "Disassembly", "Paint Queue", "Painting", "Drying", "Reassembly", "To Testing"],
  },
  "Track C": {
    label: "Repair Track",
    color: "magenta",
    stages: ["Queue", "Diagnosis", "Awaiting Parts", "Repair", "Repair Complete", "To Testing"],
  },
  "Track D": {
    label: "Testing",
    color: "green",
    stages: ["L1 Queue", "L1 Testing", "L1 Failed", "L2 Queue", "L2 Testing", "L2 Failed", "Passed"],
  },
  "Track E": {
    label: "Harvest/Dispose",
    color: "red",
    stages: ["Queue", "Disassembly/Harvest", "Parts Logged", "Complete/Disposed"],
  },
};

type AddPartPayload = Extract<Action, { type: "ADD_PART" }>["payload"];

function normalizeTrackLabel(track: string) {
  const match = /(?:Track\s*)?([A-E])/i.exec(track.trim());
  return match ? `Track ${match[1].toUpperCase()}` : track.trim();
}

function normalizeBarcode(barcode: string) {
  return barcode.trim().toUpperCase();
}

function colorClasses(color: "cyan" | "purple" | "magenta" | "green" | "red") {
  const map = {
    cyan: {
      neon: "neon-text-cyan",
      border: "border-cyan-500/30",
      activeButton: "bg-cyan-500/15 neon-text-cyan border border-cyan-500/30",
    },
    purple: {
      neon: "neon-text-purple",
      border: "border-purple-500/30",
      activeButton: "bg-purple-500/15 neon-text-purple border border-purple-500/30",
    },
    magenta: {
      neon: "neon-text-magenta",
      border: "border-pink-500/30",
      activeButton: "bg-pink-500/15 neon-text-magenta border border-pink-500/30",
    },
    green: {
      neon: "neon-text-green",
      border: "border-green-500/30",
      activeButton: "bg-green-500/15 neon-text-green border border-green-500/30",
    },
    red: {
      neon: "text-red-400",
      border: "border-red-500/30",
      activeButton: "bg-red-500/15 text-red-300 border border-red-500/30",
    },
  } as const;

  return map[color];
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
  const [search, setSearch] = useState("");

  const { run: logMove } = useIdempotentAction("wip-move-stage", "wip");
  const { trigger } = useUiActionFeedback();

  const config = trackConfig[activeTrack];
  const trackLetter = activeTrack.split(" ")[1] as "A" | "B" | "C" | "D" | "E";
  const c = colorClasses(config.color);

  const getActiveTrackWip = (barcode: string) => {
    const normalized = normalizeBarcode(barcode);
    const jobs = state.wipJobs.filter(
      (w) =>
        normalizeBarcode(w.laptop) === normalized &&
        normalizeTrackLabel(w.track) === activeTrack &&
        w.status !== "Completed",
    );
    if (jobs.length > 0) return jobs[jobs.length - 1];
    const fallback = state.wipJobs.filter(
      (w) => normalizeBarcode(w.laptop) === normalized && normalizeTrackLabel(w.track) === activeTrack,
    );
    return fallback.length > 0 ? fallback[fallback.length - 1] : undefined;
  };

  const trackLaptops = useMemo(() => {
    const trackBarcodes = new Set<string>();

    state.laptops.forEach((laptop) => {
      if (normalizeTrackLabel(laptop.track) === activeTrack) {
        trackBarcodes.add(normalizeBarcode(laptop.barcode));
      }
    });

    state.wipJobs.forEach((wip) => {
      if (normalizeTrackLabel(wip.track) === activeTrack && wip.status !== "Completed") {
        trackBarcodes.add(normalizeBarcode(wip.laptop));
      }
    });

    const normalizedSearch = search.trim().toLowerCase();

    return Array.from(trackBarcodes)
      .map((barcode) => state.laptops.find((laptop) => normalizeBarcode(laptop.barcode) === barcode))
      .filter((laptop): laptop is NonNullable<typeof laptop> => Boolean(laptop))
      .filter((laptop) => {
        if (!normalizedSearch) return true;
        return [laptop.barcode, laptop.brand, laptop.model, laptop.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [activeTrack, search, state.laptops, state.wipJobs]);

  const stageStats = useMemo(
    () =>
      config.stages.map((stage) => {
        const count = trackLaptops.filter((laptop) => {
          const wip = getActiveTrackWip(laptop.barcode);
          const currentStage = wip?.stage ?? config.stages[0];
          return currentStage === stage;
        }).length;
        return { stage, count };
      }),
    [config.stages, trackLaptops],
  );

  const getLaptopsForStage = (stage: string) => {
    return trackLaptops.filter((laptop) => {
      const wip = getActiveTrackWip(laptop.barcode);
      const currentStage = wip?.stage ?? config.stages[0];
      return currentStage === stage;
    });
  };

  const moveLaptop = (laptopId: string, toStage: string) => {
    const laptop = state.laptops.find((l) => l.id === laptopId);
    if (!laptop) return;
    const wip = getActiveTrackWip(laptop.barcode);

    if (!wip) {
      trigger("warn", `No active WIP found for ${laptop.barcode}. Create/activate WIP first.`);
      return;
    }

    const currentStage = wip.stage ?? config.stages[0];

    if (!canAdvance(trackLetter, currentStage, toStage)) {
      trigger("error", `Invalid move: ${currentStage} → ${toStage}`);
      return;
    }

    logMove(laptop.barcode, { from: currentStage, to: toStage });
    dispatch({
      type: "UPDATE_WIP",
      id: wip.id,
      payload: {
        stage: toStage,
        history: [...wip.history, { ts: new Date().toLocaleString(), action: `Moved to ${toStage}`, user: "admin" }],
      },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `${laptop.barcode} moved to ${toStage} on ${activeTrack}`, time: "just now" },
    });
    trigger("success", `${laptop.barcode} → ${toStage}`);
    setDragItem(null);
  };

  const exportTrackCsv = () => {
    const rows = [
      ["Track", activeTrack],
      ["Generated", new Date().toISOString()],
      [],
      ["Stage", "Count"],
      ...stageStats.map((row) => [row.stage, String(row.count)]),
      [],
      ["Barcode", "Brand", "Model", "Current Stage", "Status"],
      ...trackLaptops.map((laptop) => {
        const wip = getActiveTrackWip(laptop.barcode);
        return [laptop.barcode, laptop.brand, laptop.model, wip?.stage ?? config.stages[0], laptop.status];
      }),
    ];

    exportCsv(
      `processing-${activeTrack.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
    trigger("info", `Exported ${trackLaptops.length} row(s) for ${activeTrack}`);
  };

  const saveTestResult = () => {
    if (!selectedLaptop) return;
    const laptop = state.laptops.find((l) => l.id === selectedLaptop);
    if (!laptop) return;
    dispatch({ type: "UPDATE_LAPTOP", id: laptop.id, payload: { testResult } });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `Test result for ${laptop.barcode}: ${testResult}`, time: "just now" },
    });
    trigger("success", `Test result saved: ${testResult}`);
    setSelectedLaptop(null);
  };

  const addHarvestPart = () => {
    if (!selectedLaptop || !harvestPart.trim()) return;
    const laptop = state.laptops.find((l) => l.id === selectedLaptop);
    const baseBarcode = laptop ? normalizeBarcode(laptop.barcode) : `LAP-${Date.now()}`;
    const payload: AddPartPayload = {
      barcode: `${baseBarcode}-H-${Date.now().toString().slice(-4)}`,
      name: harvestPart.trim(),
      category: "Harvest",
      spec: laptop ? `${laptop.brand} ${laptop.model}` : "Harvest",
      condition: "Harvested",
      onHand: Math.max(1, harvestQty),
      available: Math.max(1, harvestQty),
      reorder: 0,
      cost: 0,
      location: "Harvest",
    };

    dispatch({ type: "ADD_PART", payload });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `Harvested part: ${payload.name} x${payload.onHand}`, time: "just now" },
    });
    trigger("success", `Harvested ${payload.name}`);
    setHarvestPart("");
    setHarvestQty(1);
  };

  return (
    <div data-page="processing-tracks" data-testid="page-processing-tracks" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl font-bold tracking-wider neon-text-cyan card-title"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              PROCESSING TRACKS
            </h1>
            <span className="cyber-chip">5 TRACKS</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>
            Drag & drop laptops between processing stages
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(trackConfig).map(([key, tc]) => {
          const count = state.laptops.filter((l) => normalizeTrackLabel(l.track) === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTrack(key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTrack === key ? colorClasses(tc.color).activeButton : "text-cyan-500/30 border border-cyan-500/10"}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {key} <span className="ml-1 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={`text-lg font-bold ${c.neon}`} style={{ fontFamily: "var(--font-heading)" }}>
              {activeTrack} — {config.label}
            </h2>
            <p className="text-xs text-cyan-500/30 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
              {trackLaptops.length} laptops in pipeline • {config.stages.length} stages
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search barcode/brand/model"
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <button className="btn-ghost text-xs" onClick={exportTrackCsv}>
              ↗ Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
        {config.stages.map((stage) => {
          const stageLaptops = getLaptopsForStage(stage);
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-[240px] glass-card p-0 overflow-hidden border ${c.border}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragItem) moveLaptop(dragItem, stage);
              }}
            >
              <div className={`px-3 py-2.5 border-b ${c.border} bg-cyan-500/5`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-200/70" style={{ fontFamily: "var(--font-heading)" }}>
                    {stage.toUpperCase()}
                  </h3>
                  <span className={`text-[10px] font-bold ${c.neon}`} style={{ fontFamily: "var(--font-mono)" }}>
                    {stageLaptops.length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[300px]">
                {stageLaptops.length === 0 ? (
                  <div
                    className="py-8 text-center text-cyan-500/15 text-[10px]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Drop here
                  </div>
                ) : (
                  stageLaptops.map((laptop) => (
                    <div
                      key={laptop.id}
                      draggable
                      onDragStart={() => setDragItem(laptop.id)}
                      onDragEnd={() => setDragItem(null)}
                      className={`p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 cursor-grab hover:border-cyan-500/25 transition-all ${dragItem === laptop.id ? "opacity-50 scale-95" : ""}`}
                    >
                      <p
                        className="text-[10px] font-bold neon-text-cyan mb-1"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {laptop.barcode}
                      </p>
                      <p className="text-[11px] text-cyan-200/60 font-semibold">
                        {laptop.brand} {laptop.model}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${laptop.grade === "A" ? "bg-green-500/10 text-green-400" : laptop.grade === "B" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}
                        >
                          Grade {laptop.grade}
                        </span>
                        <button className="text-[9px] text-cyan-400/40" onClick={() => setSelectedLaptop(laptop.id)}>
                          Detail
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLaptop && activeTrack === "Track D" && (
        <div className="glass-card neon-border p-5">
          <h3 className="text-sm font-bold neon-text-green" style={{ fontFamily: "Orbitron" }}>
            Track D Test Result
          </h3>
          <div className="flex gap-3 mt-3">
            <select
              className="px-3 py-2 rounded-lg text-sm"
              value={testResult}
              onChange={(e) => setTestResult(e.target.value)}
            >
              <option>Passed</option>
              <option>Failed L1</option>
              <option>Failed L2</option>
            </select>
            <button className="btn-cyber" onClick={saveTestResult}>
              Save Result
            </button>
          </div>
        </div>
      )}

      {selectedLaptop && activeTrack === "Track E" && (
        <div className="glass-card neon-border p-5">
          <h3 className="text-sm font-bold text-red-400" style={{ fontFamily: "Orbitron" }}>
            Track E Harvest Parts
          </h3>
          <div className="flex gap-3 mt-3">
            <input
              className="px-3 py-2 rounded-lg text-sm"
              placeholder="Part name"
              value={harvestPart}
              onChange={(e) => setHarvestPart(e.target.value)}
            />
            <input
              type="number"
              className="px-3 py-2 rounded-lg text-sm"
              placeholder="Qty"
              value={harvestQty}
              onChange={(e) => setHarvestQty(Number(e.target.value))}
            />
            <button className="btn-cyber" onClick={addHarvestPart}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
