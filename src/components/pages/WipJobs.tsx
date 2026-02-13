import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { nextWipNumber } from "@/utils/dateUtils";
import { trackStages } from "@/domain";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

const priorityColors: Record<string, string> = { High: "cyber-badge-red", Normal: "cyber-badge-yellow", Low: "cyber-badge-green" };
const statusColors: Record<string, string> = { "In Progress": "cyber-badge-purple", Active: "cyber-badge-cyan", "Awaiting Parts": "cyber-badge-yellow", Completed: "cyber-badge-green" };

export function WipJobs() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = selectedJobId ? state.wipJobs.find((w) => w.id === selectedJobId) ?? null : null;
  const [detailTab, setDetailTab] = useState<"diagnosis" | "parts" | "labor" | "history">("diagnosis");
  const [showCreate, setShowCreate] = useState(false);
  const [newWip, setNewWip] = useState({ laptop: "", track: "Track C", assignedTo: "", priority: "Normal" });
  const [addPartBarcode, setAddPartBarcode] = useState("");
  const [addLaborTech, setAddLaborTech] = useState("");
  const [addLaborHours, setAddLaborHours] = useState(0);
  const [diagNotes, setDiagNotes] = useState("");

  const filtered = useMemo(() => {
    let data = state.wipJobs;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(w => w.wip.toLowerCase().includes(q) || w.laptop.toLowerCase().includes(q) || w.brand.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") data = data.filter(w => w.status === statusFilter);
    return data;
  }, [state.wipJobs, search, statusFilter]);

  const activeCount = state.wipJobs.filter(w => w.status !== "Completed").length;
  const inProgressCount = state.wipJobs.filter(w => w.status === "In Progress").length;
  const awaitingParts = state.wipJobs.filter(w => w.status === "Awaiting Parts").length;
  const totalPartsCost = state.wipJobs.reduce((a, w) => a + w.partsCost, 0);

  const createWip = () => {
    if (!newWip.laptop) return;
    const laptop = state.laptops.find(l => l.barcode === newWip.laptop);
    dispatch({
      type: "ADD_WIP",
      payload: {
        wip: nextWipNumber(state.wipJobs.map((w) => w.wip)),
        laptop: newWip.laptop,
        brand: laptop ? `${laptop.brand} ${laptop.model}` : newWip.laptop,
        track: newWip.track,
        stage: "Queue",
        assignedTo: newWip.assignedTo || "Unassigned",
        partsUsed: 0, partsCost: 0, laborHrs: 0,
        priority: newWip.priority,
        status: "Active",
        opened: new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        diagnosisNotes: "",
        parts: [], laborEntries: [],
        history: [{ ts: new Date().toLocaleString(), action: "WIP Job created", user: "admin" }],
      },
    });
    setNewWip({ laptop: "", track: "Track C", assignedTo: "", priority: "Normal" });
    setShowCreate(false);
  };

  const addPartToWip = () => {
    if (!selectedJob || !addPartBarcode) return;
    dispatch({ type: "WIP_ADD_PART", wipId: selectedJob.id, partBarcode: addPartBarcode.trim() });
    setAddPartBarcode("");
  };

  const removePartFromWip = (idx: number) => {
    if (!selectedJob) return;
    dispatch({ type: "WIP_REMOVE_PART", wipId: selectedJob.id, index: idx });
  };

  const addLabor = () => {
    if (!selectedJob || !addLaborTech || addLaborHours <= 0) return;
    dispatch({ type: "WIP_ADD_LABOR", wipId: selectedJob.id, tech: addLaborTech, hours: addLaborHours });
    setAddLaborTech("");
    setAddLaborHours(0);
  };

  const saveDiagnosis = () => {
    if (!selectedJob) return;
    dispatch({ type: "WIP_UPDATE_DIAGNOSIS", wipId: selectedJob.id, notes: diagNotes });
  };

  const completeJob = () => {
    if (!selectedJob) return;
    dispatch({ type: "WIP_COMPLETE", wipId: selectedJob.id });
  };


  const moveToNextStage = () => {
    if (!selectedJob) return;
    const m = /Track\s*([A-E])/i.exec(selectedJob.track);
    if (!m) return;
    const key = m[1].toUpperCase() as keyof typeof trackStages;
    const stages = trackStages[key];
    const idx = stages.indexOf(selectedJob.stage);
    if (idx === -1 || idx >= stages.length - 1) return;
    dispatch({ type: "WIP_MOVE_STAGE", wipId: selectedJob.id, toStage: stages[idx + 1] });
  };

  const laborCost = selectedJob ? selectedJob.laborEntries.reduce((a, l) => a + l.hours * l.rate, 0) : 0;
  const totalJobCost = selectedJob ? selectedJob.partsCost + laborCost : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>WIP JOBS</h1>
            <span className="cyber-chip cyber-badge-purple">{state.wipJobs.length} JOBS</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>Work-in-progress • Parts tracking • Labor costing</p>
        </div>
        <button className="btn-cyber" onClick={() => setShowCreate(true)}>+ New WIP Job</button>
      </div>

      <SectionHelpHint hint={getPageSectionHint("wipJobs")} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Active Jobs" value={activeCount} tone="cyan" icon="⬢" />
        <KpiCard label="In Progress" value={inProgressCount} tone="purple" icon="⚙" />
        <KpiCard label="Awaiting Parts" value={awaitingParts} tone="yellow" icon="⏳" />
        <KpiCard label="Completed Today" value={0} tone="green" icon="✓" />
        <KpiCard label="Total Parts Cost" value={`AED ${totalPartsCost}`} tone="magenta" icon="◈" />
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search WIP, laptop, brand..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm min-w-[140px]">
            <option value="All">All Status</option>
            <option>Active</option><option>In Progress</option><option>Awaiting Parts</option><option>Completed</option>
          </select>
          <button className="btn-ghost text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); }}>✕ Clear</button>
        </div>
      </div>

      {showCreate && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>CREATE WIP JOB</h3>
            <button className="btn-ghost text-xs" onClick={() => setShowCreate(false)}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input placeholder="Laptop Barcode *" value={newWip.laptop} onChange={e => setNewWip(p => ({ ...p, laptop: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
            <select value={newWip.track} onChange={e => setNewWip(p => ({ ...p, track: e.target.value }))} className="px-3 py-2 rounded-lg text-sm"><option>Track A</option><option>Track B</option><option>Track C</option><option>Track D</option><option>Track E</option></select>
            <input placeholder="Assigned To" value={newWip.assignedTo} onChange={e => setNewWip(p => ({ ...p, assignedTo: e.target.value }))} className="px-3 py-2 rounded-lg text-sm" />
            <select value={newWip.priority} onChange={e => setNewWip(p => ({ ...p, priority: e.target.value }))} className="px-3 py-2 rounded-lg text-sm"><option>High</option><option>Normal</option><option>Low</option></select>
            <button className="btn-cyber" onClick={createWip}>✓ Create</button>
          </div>
        </div>
      )}

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="py-3 px-4 text-left">WIP #</th><th className="py-3 px-4 text-left">Laptop</th><th className="py-3 px-4 text-left">Track</th><th className="py-3 px-4 text-left">Stage</th><th className="py-3 px-4 text-left">Assigned</th><th className="py-3 px-4 text-right">Parts</th><th className="py-3 px-4 text-right">Cost</th><th className="py-3 px-4 text-left">Priority</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Opened</th><th className="py-3 px-4 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(job => (
                <tr
                  key={job.id}
                  className="cursor-pointer hover:bg-cyan-500/5"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setDiagNotes(job.diagnosisNotes);
                    setDetailTab("diagnosis");
                  }}
                >
                  <td className="py-3 px-4" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}><span className="neon-text-cyan">{job.wip}</span></td>
                  <td className="py-3 px-4"><span className="text-cyan-200/70 font-semibold">{job.brand}</span><br /><span className="text-[10px] text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>{job.laptop}</span></td>
                  <td className="py-3 px-4 text-cyan-200/60">{job.track}</td>
                  <td className="py-3 px-4"><span className="cyber-chip">{job.stage}</span></td>
                  <td className="py-3 px-4 text-cyan-200/60">{job.assignedTo}</td>
                  <td className="py-3 px-4 text-right" style={{ fontFamily: "var(--font-mono)" }}>{job.partsUsed}</td>
                  <td className="py-3 px-4 text-right neon-text-green" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>AED {job.partsCost}</td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${priorityColors[job.priority] || ""}`}>{job.priority}</span></td>
                  <td className="py-3 px-4"><span className={`cyber-chip ${statusColors[job.status] || ""}`}>{job.status}</span></td>
                  <td className="py-3 px-4 text-cyan-300/30" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{job.opened}</td>
                  <td className="py-3 px-4"><button className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold">Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJobId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card neon-border w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>{selectedJob.wip}</h3>
                <p className="text-sm text-cyan-400/40">{selectedJob.brand} • {selectedJob.track} • {selectedJob.stage}</p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedJobId(null)}>✕ Close</button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <div className="text-center"><p className="text-[10px] text-cyan-500/30">PARTS COST</p><p className="text-lg font-bold neon-text-magenta">AED {selectedJob.partsCost}</p></div>
              <div className="text-center"><p className="text-[10px] text-cyan-500/30">LABOR COST</p><p className="text-lg font-bold neon-text-purple">AED {laborCost}</p></div>
              <div className="text-center"><p className="text-[10px] text-cyan-500/30">TOTAL COST</p><p className="text-lg font-bold neon-text-cyan">AED {totalJobCost}</p></div>
            </div>
            <div className="flex gap-2 border-b border-cyan-500/10 pb-2">
              {(["diagnosis", "parts", "labor", "history"] as const).map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${detailTab === tab ? "bg-cyan-500/15 neon-text-cyan border border-cyan-500/30" : "text-cyan-500/30"}`} style={{ fontFamily: "var(--font-heading)" }}>{tab.toUpperCase()}</button>
              ))}
            </div>
            {detailTab === "diagnosis" && (
              <div className="space-y-3"><textarea value={diagNotes} onChange={e => setDiagNotes(e.target.value)} rows={5} placeholder="Enter diagnosis notes..." className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} /><button className="btn-cyber text-xs" onClick={saveDiagnosis}>✓ Save Notes</button></div>
            )}
            {detailTab === "parts" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={addPartBarcode} onChange={e => setAddPartBarcode(e.target.value)} placeholder="Scan part barcode..." className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                  <button className="btn-cyber text-xs" onClick={addPartToWip}>+ Add Part</button>
                </div>
                {selectedJob.parts.length > 0 && (
                  <div className="glass-card p-3 border border-cyan-500/10">
                    {selectedJob.parts.map((p, idx) => (
                      <div key={`${p.barcode}-${idx}`} className="flex items-center justify-between text-xs py-1">
                        <span className="text-cyan-100/60" style={{ fontFamily: "var(--font-mono)" }}>{p.name}</span>
                        <button className="text-[10px] text-red-400/60 hover:text-red-300" onClick={() => removePartFromWip(idx)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {detailTab === "labor" && (
              <div className="space-y-3"><div className="flex gap-2"><input value={addLaborTech} onChange={e => setAddLaborTech(e.target.value)} placeholder="Technician name" className="flex-1 px-3 py-2 rounded-lg text-sm" /><input type="number" value={addLaborHours || ""} onChange={e => setAddLaborHours(Number(e.target.value))} placeholder="Hours" className="w-24 px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} /><button className="btn-cyber text-xs" onClick={addLabor}>+ Add Labor</button></div></div>
            )}
            {detailTab === "history" && (
              <div className="space-y-2">{selectedJob.history.map((h, i) => (<div key={i} className="flex items-start gap-3 py-2 border-b border-cyan-500/5"><div className="w-2 h-2 rounded-full bg-cyan-500/30 mt-1.5" /><div className="flex-1"><p className="text-sm text-cyan-200/70">{h.action}</p><p className="text-[10px] text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>{h.ts} • {h.user}</p></div></div>))}</div>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setSelectedJobId(null)}>Close</button>
              <button className="btn-ghost" data-action="wip-move-stage" onClick={moveToNextStage}>→ Next Stage</button>
              <button className="btn-cyber" onClick={completeJob}>✓ Complete Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
