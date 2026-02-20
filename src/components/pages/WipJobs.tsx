import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { nextWipNumber } from "@/utils/dateUtils";
import { trackStages } from "@/domain";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";
import { REPLACEMENT_DESTINATIONS } from "@/utils/wipReplacement";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { evaluateWipCompletionGate } from "@/utils/wipQualityGate";
import { useLaborTimer } from "@/hooks/useLaborTimer";
import { formatElapsed, millisecondsToHours } from "@/utils/laborTimer";
import { computeWipQualityAnalytics } from "@/utils/wipQualityAnalytics";
import { computeWipLaborEfficiency } from "@/utils/wipLaborEfficiency";
import { computeTechnicianProductivityByTrack } from "@/utils/wipProductivity";
import { computeWipLaborDrilldown, laborDrilldownToCsv } from "@/utils/wipLaborDrilldown";
import { computeTrackProductivityTrends } from "@/utils/wipTrackTrend";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import { exportCsv } from "@/utils/exporters";
import { classifyWipAgingRisk, getWipAgingDays } from "@/utils/wipAging";
import { fetchAuthUsers } from "@/utils/javaAuth";

const priorityColors: Record<string, string> = {
  High: "cyber-badge-red",
  Normal: "cyber-badge-yellow",
  Low: "cyber-badge-green",
};
const statusColors: Record<string, string> = {
  "In Progress": "cyber-badge-purple",
  Active: "cyber-badge-cyan",
  "Awaiting Parts": "cyber-badge-yellow",
  Completed: "cyber-badge-green",
};

const riskColors: Record<string, string> = {
  Healthy: "cyber-badge-green",
  Watch: "cyber-badge-yellow",
  Risk: "cyber-badge-red",
};

export function WipJobs() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [slaRiskFilter, setSlaRiskFilter] = useState<"All" | "Healthy" | "Watch" | "Risk">("All");
  const deferredSearch = useDeferredValue(search);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = selectedJobId ? (state.wipJobs.find((w) => w.id === selectedJobId) ?? null) : null;
  const [detailTab, setDetailTab] = useState<"diagnosis" | "parts" | "labor" | "history">("diagnosis");
  const [showCreate, setShowCreate] = useState(false);
  const [newWip, setNewWip] = useState({ laptop: "", track: "Track C", assignedTo: "", priority: "Normal" });
  const [addPartBarcode, setAddPartBarcode] = useState("");
  const [addLaborTech, setAddLaborTech] = useState("");
  const [addLaborHours, setAddLaborHours] = useState(0);
  const [laborApprover, setLaborApprover] = useState("Supervisor");
  const [directoryUsers, setDirectoryUsers] = useState<string[]>([]);
  const [diagNotes, setDiagNotes] = useState("");
  const [replaceInstalledBarcode, setReplaceInstalledBarcode] = useState("");
  const [replaceRemovedName, setReplaceRemovedName] = useState("");
  const [replaceRemovedComponent, setReplaceRemovedComponent] = useState("RAM");
  const [replaceRemovedSpec, setReplaceRemovedSpec] = useState("");
  const [replaceRemovedCondition, setReplaceRemovedCondition] = useState("Refurbished");
  const [replaceEstimatedValue, setReplaceEstimatedValue] = useState(0);
  const [replaceRemovedSerial, setReplaceRemovedSerial] = useState("");
  const [replaceDestination, setReplaceDestination] =
    useState<(typeof REPLACEMENT_DESTINATIONS)[number]>("Harvest QA Bin");
  const { enqueue } = useOfflineQueue();
  const laborTimer = useLaborTimer("tahir.wipLaborTimer.startedAt");
  const { trigger } = useUiActionFeedback();

  const filtered = useMemo(() => {
    let data = state.wipJobs;
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      data = data.filter(
        (w) =>
          w.wip.toLowerCase().includes(q) || w.laptop.toLowerCase().includes(q) || w.brand.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "All") data = data.filter((w) => w.status === statusFilter);
    if (slaRiskFilter !== "All") {
      data = data.filter((w) => classifyWipAgingRisk(w.opened, w.status) === slaRiskFilter);
    }
    return data;
  }, [deferredSearch, state.wipJobs, statusFilter, slaRiskFilter]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedJobId(null);
      return;
    }

    if (selectedJobId && filtered.some((job) => job.id === selectedJobId)) return;
    setSelectedJobId(filtered[0].id);
  }, [filtered, selectedJobId]);

  useEffect(() => {
    let active = true;

    fetchAuthUsers()
      .then((users) => {
        if (!active) return;
        const names = users.map((user) => user.fullName.trim()).filter((name) => name.length > 0);
        setDirectoryUsers(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {
        if (!active) return;
        setDirectoryUsers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const userOptions = useMemo(() => {
    const fromWip = state.wipJobs
      .map((job) => job.assignedTo.trim())
      .filter((name) => name.length > 0 && name !== "Unassigned");
    return Array.from(new Set([...directoryUsers, ...fromWip])).sort((a, b) => a.localeCompare(b));
  }, [directoryUsers, state.wipJobs]);

  const laborUserOptions = useMemo(() => {
    const merged = Array.from(new Set([...userOptions, "Supervisor"])).filter((name) => name.trim().length > 0);
    return merged.sort((a, b) => a.localeCompare(b));
  }, [userOptions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTech = window.localStorage.getItem("tahir.wipLaborTimer.tech");
    if (savedTech) setAddLaborTech(savedTech);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (addLaborTech.trim()) window.localStorage.setItem("tahir.wipLaborTimer.tech", addLaborTech.trim());
    else window.localStorage.removeItem("tahir.wipLaborTimer.tech");
  }, [addLaborTech]);

  useEffect(() => {
    if (!laborUserOptions.includes(laborApprover)) {
      setLaborApprover(laborUserOptions[0] ?? "Supervisor");
    }

    if (addLaborTech && !laborUserOptions.includes(addLaborTech)) {
      setAddLaborTech("");
    }
  }, [addLaborTech, laborApprover, laborUserOptions]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "All" || slaRiskFilter !== "All";

  const dashboardMetrics = useMemo(() => {
    const jobs = state.wipJobs;
    const activeCount = jobs.filter((w) => w.status !== "Completed").length;
    const inProgressCount = jobs.filter((w) => w.status === "In Progress").length;
    const awaitingParts = jobs.filter((w) => w.status === "Awaiting Parts").length;
    const completedCount = jobs.filter((w) => w.status === "Completed").length;
    const totalPartsCost = jobs.reduce((a, w) => a + w.partsCost, 0);
    const riskCounts = jobs.reduce(
      (acc, job) => {
        const risk = classifyWipAgingRisk(job.opened, job.status);
        acc[risk] += 1;
        return acc;
      },
      { Healthy: 0, Watch: 0, Risk: 0 },
    );
    const qualityAnalytics = computeWipQualityAnalytics(jobs);
    const laborEfficiency = computeWipLaborEfficiency(jobs);
    const productivityTop = computeTechnicianProductivityByTrack(jobs).slice(0, 5);
    const laborDrilldown = computeWipLaborDrilldown(jobs);
    const trackTrends = computeTrackProductivityTrends(jobs).slice(0, 5);

    return {
      activeCount,
      inProgressCount,
      awaitingParts,
      completedCount,
      totalPartsCost,
      riskCounts,
      qualityAnalytics,
      laborEfficiency,
      productivityTop,
      laborDrilldown,
      trackTrends,
    };
  }, [state.wipJobs]);

  const {
    activeCount,
    inProgressCount,
    awaitingParts,
    completedCount,
    totalPartsCost,
    riskCounts,
    qualityAnalytics,
    laborEfficiency,
    productivityTop,
    laborDrilldown,
    trackTrends,
  } = dashboardMetrics;

  const openJobDetails = (job: (typeof state.wipJobs)[number]) => {
    setSelectedJobId(job.id);
    setDiagNotes(job.diagnosisNotes);
    setDetailTab("diagnosis");
  };

  const createWip = () => {
    const normalizedLaptop = newWip.laptop.trim().toUpperCase();
    if (!normalizedLaptop) return;

    const existing = state.wipJobs.find(
      (job) => job.laptop.trim().toUpperCase() === normalizedLaptop && job.status !== "Completed",
    );
    if (existing) {
      trigger("warn", `${normalizedLaptop} already has active WIP ${existing.wip}`);
      setSelectedJobId(existing.id);
      setShowCreate(false);
      return;
    }

    const laptop = state.laptops.find((l) => l.barcode.trim().toUpperCase() === normalizedLaptop);
    const trackMatch = /Track\s*([A-E])/i.exec(newWip.track);
    const trackKey = (trackMatch?.[1]?.toUpperCase() ?? "C") as keyof typeof trackStages;
    const initialStage = trackStages[trackKey]?.[0] ?? "Queue";
    dispatch({
      type: "ADD_WIP",
      payload: {
        wip: nextWipNumber(state.wipJobs.map((w) => w.wip)),
        laptop: normalizedLaptop,
        brand: laptop ? `${laptop.brand} ${laptop.model}` : newWip.laptop,
        track: newWip.track,
        stage: initialStage,
        assignedTo: newWip.assignedTo || "Unassigned",
        partsUsed: 0,
        partsCost: 0,
        laborHrs: 0,
        priority: newWip.priority,
        status: "Active",
        opened: new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        diagnosisNotes: "",
        parts: [],
        laborEntries: [],
        history: [{ ts: new Date().toLocaleString(), action: "WIP Job created", user: "admin" }],
      },
    });
    setNewWip({ laptop: "", track: "Track C", assignedTo: "", priority: "Normal" });
    setShowCreate(false);
    trigger("success", `Created WIP for ${laptop ? `${laptop.brand} ${laptop.model}` : normalizedLaptop}`);
  };

  const addPartToWip = () => {
    if (!selectedJob || !addPartBarcode) return;
    dispatch({ type: "WIP_ADD_PART", wipId: selectedJob.id, partBarcode: addPartBarcode.trim() });
    if (!navigator.onLine) {
      enqueue({
        type: "WIP_ADD_PART",
        summary: `Queued part add for ${selectedJob.wip}`,
        payload: { partBarcode: addPartBarcode.trim() },
      });
    }
    setAddPartBarcode("");
  };

  const removePartFromWip = (idx: number) => {
    if (!selectedJob) return;
    dispatch({ type: "WIP_REMOVE_PART", wipId: selectedJob.id, index: idx });
  };

  const replacePartInWip = () => {
    if (!selectedJob || !replaceInstalledBarcode.trim() || !replaceRemovedName.trim()) return;

    dispatch({
      type: "WIP_REPLACE_PART",
      wipId: selectedJob.id,
      installedPartBarcode: replaceInstalledBarcode.trim(),
      removedPart: {
        component: replaceRemovedComponent.trim() || "Component",
        name: replaceRemovedName.trim(),
        spec: replaceRemovedSpec.trim() || undefined,
        condition: replaceRemovedCondition.trim() || undefined,
        estimatedValue: replaceEstimatedValue > 0 ? replaceEstimatedValue : undefined,
        removedSerial: replaceRemovedSerial.trim() || undefined,
        destination: replaceDestination,
      },
    });

    if (!navigator.onLine) {
      enqueue({
        type: "WIP_REPLACE_PART",
        summary: `Queued replacement for ${selectedJob.wip}`,
        payload: { installedPartBarcode: replaceInstalledBarcode.trim(), removedName: replaceRemovedName.trim() },
      });
    }

    setReplaceInstalledBarcode("");
    setReplaceRemovedName("");
    setReplaceRemovedSpec("");
    setReplaceEstimatedValue(0);
    setReplaceRemovedSerial("");
    setReplaceDestination("Harvest QA Bin");
  };

  const addLabor = () => {
    if (!selectedJob || !addLaborTech || addLaborHours <= 0) return;
    dispatch({
      type: "WIP_ADD_LABOR",
      wipId: selectedJob.id,
      tech: addLaborTech,
      hours: addLaborHours,
      source: "manual",
    });
    if (!navigator.onLine) {
      enqueue({
        type: "WIP_ADD_LABOR",
        summary: `Queued labor entry for ${selectedJob.wip}`,
        payload: { tech: addLaborTech, hours: addLaborHours },
      });
    }
    setAddLaborTech("");
    setAddLaborHours(0);
  };

  const stopLaborTimer = () => {
    if (!selectedJob || !addLaborTech) return;
    const session = laborTimer.stop();
    if (!session) return;
    const hours = Number(millisecondsToHours(session.elapsedMs).toFixed(2));
    if (hours <= 0) return;
    dispatch({
      type: "WIP_ADD_LABOR",
      wipId: selectedJob.id,
      tech: addLaborTech,
      hours,
      source: "timer",
      startedAt: new Date(session.start).toISOString(),
      endedAt: new Date(session.end).toISOString(),
    });
    if (!navigator.onLine) {
      enqueue({
        type: "WIP_ADD_LABOR",
        summary: `Queued timed labor entry for ${selectedJob.wip}`,
        payload: { tech: addLaborTech, hours, source: "timer" },
      });
    }
  };

  const approveLaborEntry = (index: number) => {
    if (!selectedJob || !laborApprover.trim()) return;
    dispatch({ type: "WIP_APPROVE_LABOR_ENTRY", wipId: selectedJob.id, index, approvedBy: laborApprover.trim() });
  };

  const saveDiagnosis = () => {
    if (!selectedJob) return;
    dispatch({ type: "WIP_UPDATE_DIAGNOSIS", wipId: selectedJob.id, notes: diagNotes });
  };

  const exportLaborDrilldown = () => {
    const csv = laborDrilldownToCsv(laborDrilldown);
    const rows = csv.split("\n").map((line) => line.split(","));
    exportCsv(`wip-labor-drilldown-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    trigger("info", `Exported labor drilldown (${laborDrilldown.length} track row(s))`);
  };

  const completeJob = () => {
    if (!selectedJob) return;
    const gate = evaluateWipCompletionGate(selectedJob);
    if (!gate.canComplete) return;
    dispatch({ type: "WIP_COMPLETE", wipId: selectedJob.id });
  };

  const handleCompleteStatus = () => {
    if (!selectedJob) return;
    const m = /Track\s*([A-E])/i.exec(selectedJob.track);
    if (!m) return;
    const key = m[1].toUpperCase() as keyof typeof trackStages;
    const stages = trackStages[key];
    const idx = stages.indexOf(selectedJob.stage);
    if (idx === -1) return;

    if (idx < stages.length - 1) {
      dispatch({ type: "WIP_MOVE_STAGE", wipId: selectedJob.id, toStage: stages[idx + 1] });
      return;
    }

    const gate = evaluateWipCompletionGate(selectedJob);
    if (gate.canComplete) {
      dispatch({ type: "WIP_COMPLETE", wipId: selectedJob.id });
    }
  };

  const laborCost = selectedJob ? selectedJob.laborEntries.reduce((a, l) => a + l.hours * l.rate, 0) : 0;
  const selectedWipAudit = useMemo(() => {
    if (!selectedJob) return [];
    return state.movementLog
      .filter((entry) => entry.entityType === "wip" && entry.ref === selectedJob.wip)
      .slice(0, 12);
  }, [selectedJob, state.movementLog]);
  const totalJobCost = selectedJob ? selectedJob.partsCost + laborCost : 0;
  const completionGate = selectedJob ? evaluateWipCompletionGate(selectedJob) : null;
  const nextStepSuggestions = useMemo(() => {
    if (!selectedJob) return [] as string[];
    const suggestions: string[] = [];
    const stageName = selectedJob.stage?.toLowerCase() || "";

    if ((selectedJob.diagnosisNotes || "").trim().length < 8) {
      suggestions.push("Add diagnosis notes so the next technician can continue without context loss.");
    }

    if (selectedJob.parts.length === 0 && !/queue|inspect|diagnos/i.test(stageName)) {
      suggestions.push("Add at least one required part or mark this job as no-parts-required before completion.");
    }

    const pendingApprovals = selectedJob.laborEntries.filter((entry) => entry.approved === false).length;
    if (pendingApprovals > 0) {
      suggestions.push(
        `Approve ${pendingApprovals} pending labor entr${pendingApprovals > 1 ? "ies" : "y"} to satisfy completion quality checks.`,
      );
    }

    const m = /Track\s*([A-E])/i.exec(selectedJob.track);
    const key = (m?.[1]?.toUpperCase() ?? "C") as keyof typeof trackStages;
    const stages = trackStages[key] || [];
    const idx = stages.indexOf(selectedJob.stage);
    if (idx >= 0 && idx < stages.length - 1) {
      suggestions.push(`Move stage to ${stages[idx + 1]} using “✓ Complete Status”.`);
    }

    const agingDays = getWipAgingDays(selectedJob.opened);
    const agingRisk = classifyWipAgingRisk(selectedJob.opened, selectedJob.status);
    if (agingRisk !== "Healthy") {
      suggestions.push(`SLA ${agingRisk.toLowerCase()}: job has been open ${agingDays} day(s). Prioritize escalation.`);
    }

    if (completionGate?.canComplete) {
      suggestions.push("Quality gate passed. You can safely click “✓ Complete Job”.");
    } else {
      const failing = completionGate?.checks.filter((check) => !check.pass).map((check) => check.label) || [];
      if (failing.length > 0) {
        suggestions.push(`Resolve completion gate blockers: ${failing.join(", ")}.`);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push("No blockers detected. Keep moving this job with “✓ Complete Status”.");
    }
    return suggestions.slice(0, 5);
  }, [completionGate, selectedJob]);

  return (
    <div data-page="wip-jobs" data-testid="page-wip-jobs" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl font-bold tracking-wider neon-text-cyan card-title"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              WIP JOBS
            </h1>
            <span className="cyber-chip cyber-badge-purple">{state.wipJobs.length} JOBS</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>
            Work-in-progress • Parts tracking • Labor costing
          </p>
        </div>
        <button className="btn-cyber" onClick={() => setShowCreate(true)}>
          + New WIP Job
        </button>
      </div>

      <SectionHelpHint hint={getPageSectionHint("wipJobs")} />

      <div className="grid grid-cols-2 lg:grid-cols-12 gap-4">
        <KpiCard label="Active Jobs" value={activeCount} tone="cyan" icon="⬢" />
        <KpiCard label="In Progress" value={inProgressCount} tone="purple" icon="⚙" />
        <KpiCard label="Awaiting Parts" value={awaitingParts} tone="yellow" icon="⏳" />
        <KpiCard label="SLA Watch" value={riskCounts.Watch} tone="yellow" icon="⚠️" />
        <KpiCard label="SLA Risk" value={riskCounts.Risk} tone="red" icon="🚨" />
        <KpiCard label="Completed Jobs" value={completedCount} tone="green" icon="✓" />
        <KpiCard label="Total Parts Cost" value={`AED ${totalPartsCost.toFixed(2)}`} tone="magenta" icon="◈" />
        <KpiCard label="Ready to Complete" value={qualityAnalytics.readyToComplete} tone="green" icon="◎" />
        <KpiCard label="Labor Approval Pending" value={qualityAnalytics.pendingLaborApproval} tone="yellow" icon="!" />
        <KpiCard
          label="Approved Labor Rate"
          value={`${qualityAnalytics.approvedLaborRatePct}%`}
          tone="purple"
          icon="◔"
        />
        <KpiCard
          label="Labor Variance (h)"
          value={laborEfficiency.varianceHours}
          tone={laborEfficiency.varianceHours > 0 ? "yellow" : "green"}
          icon="Δ"
        />
        <KpiCard label="Labor Efficiency" value={`${laborEfficiency.efficiencyPct}%`} tone="cyan" icon="◍" />
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
            TECHNICIAN PRODUCTIVITY BY TRACK
          </p>
          <span className="text-[10px] text-cyan-500/40">Top 5 by labor hours</span>
        </div>
        {productivityTop.length === 0 ? (
          <p className="text-xs text-cyan-500/40">No labor entries yet.</p>
        ) : (
          <div className="space-y-1">
            {productivityTop.map((row) => (
              <div
                key={`${row.tech}-${row.track}`}
                className="flex items-center justify-between text-xs border-b border-cyan-500/10 py-1"
              >
                <span>
                  {row.tech} • {row.track}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {row.hours}h ({row.entries} entries)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
            LABOR VARIANCE DRILLDOWN (FINANCE)
          </p>
          <button className="btn-ghost text-[11px]" onClick={exportLaborDrilldown}>
            Export CSV
          </button>
        </div>
        {laborDrilldown.length === 0 ? (
          <p className="text-xs text-cyan-500/40">No labor data yet.</p>
        ) : (
          <div className="space-y-1">
            {laborDrilldown.map((row) => (
              <div
                key={row.track}
                className="flex items-center justify-between text-xs border-b border-cyan-500/10 py-1"
              >
                <span>
                  {row.track} • jobs {row.jobs}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  Δh {row.varianceHours} • Δcost AED {row.varianceCost}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
            TRACK PRODUCTIVITY TRENDS
          </p>
          <span className="text-[10px] text-cyan-500/40">Average hours per labor entry</span>
        </div>
        {trackTrends.length === 0 ? (
          <p className="text-xs text-cyan-500/40">No trend data yet.</p>
        ) : (
          <div className="space-y-1">
            {trackTrends.map((row) => (
              <div
                key={row.track}
                className="flex items-center justify-between text-xs border-b border-cyan-500/10 py-1"
              >
                <span>{row.track}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {row.avgHoursPerEntry}h avg ({row.entries} entries)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search WIP, laptop, brand..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm min-w-[140px]"
          >
            <option value="All">All Status</option>
            <option>Active</option>
            <option>In Progress</option>
            <option>Awaiting Parts</option>
            <option>Completed</option>
          </select>
          <select
            value={slaRiskFilter}
            onChange={(e) => setSlaRiskFilter(e.target.value as "All" | "Healthy" | "Watch" | "Risk")}
            className="px-3 py-2 rounded-lg text-sm min-w-[140px]"
          >
            <option value="All">All SLA Risk</option>
            <option value="Risk">Risk</option>
            <option value="Watch">Watch</option>
            <option value="Healthy">Healthy</option>
          </select>
          <button
            className="btn-ghost text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasActiveFilters}
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setSlaRiskFilter("All");
            }}
          >
            ✕ Clear
          </button>
        </div>
        <div className="mt-2 text-[11px] text-cyan-500/35" style={{ fontFamily: "var(--font-mono)" }}>
          Showing {filtered.length} of {state.wipJobs.length} jobs
          {hasActiveFilters ? " (filtered)" : ""}
        </div>
      </div>

      {showCreate && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
              CREATE WIP JOB
            </h3>
            <button className="btn-ghost text-xs" onClick={() => setShowCreate(false)}>
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              placeholder="Laptop Barcode *"
              value={newWip.laptop}
              onChange={(e) => setNewWip((p) => ({ ...p, laptop: e.target.value.toUpperCase() }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <select
              value={newWip.track}
              onChange={(e) => setNewWip((p) => ({ ...p, track: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>Track A</option>
              <option>Track B</option>
              <option>Track C</option>
              <option>Track D</option>
              <option>Track E</option>
            </select>
            <select
              value={newWip.assignedTo}
              onChange={(e) => setNewWip((p) => ({ ...p, assignedTo: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option value="">Unassigned</option>
              {userOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={newWip.priority}
              onChange={(e) => setNewWip((p) => ({ ...p, priority: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
            <button className="btn-cyber" onClick={createWip}>
              ✓ Create
            </button>
          </div>
        </div>
      )}

      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">WIP #</th>
                <th className="py-3 px-4 text-left">Laptop</th>
                <th className="py-3 px-4 text-left">Track</th>
                <th className="py-3 px-4 text-left">Stage</th>
                <th className="py-3 px-4 text-left">Assigned</th>
                <th className="py-3 px-4 text-right">Parts</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">SLA Risk</th>
                <th className="py-3 px-4 text-left">Opened</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr
                  key={job.id}
                  className="cursor-pointer hover:bg-cyan-500/5 focus-within:bg-cyan-500/5"
                  onClick={() => openJobDetails(job)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openJobDetails(job);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${job.wip} details`}
                >
                  <td className="py-3 px-4" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    <span className="neon-text-cyan">{job.wip}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-cyan-200/70 font-semibold">{job.brand}</span>
                    <br />
                    <span className="text-[10px] text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>
                      {job.laptop}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyan-200/60">{job.track}</td>
                  <td className="py-3 px-4">
                    <span className="cyber-chip">{job.stage}</span>
                  </td>
                  <td className="py-3 px-4 text-cyan-200/60">{job.assignedTo}</td>
                  <td className="py-3 px-4 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {job.partsUsed}
                  </td>
                  <td
                    className="py-3 px-4 text-right neon-text-green"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                  >
                    AED {job.partsCost}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`cyber-chip ${priorityColors[job.priority] || ""}`}>{job.priority}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`cyber-chip ${statusColors[job.status] || ""}`}>{job.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {(() => {
                      const risk = classifyWipAgingRisk(job.opened, job.status);
                      const days = getWipAgingDays(job.opened);
                      return (
                        <span className={`cyber-chip ${riskColors[risk] || ""}`} title={`${days} day(s) open`}>
                          {risk}
                        </span>
                      );
                    })()}
                  </td>
                  <td
                    className="py-3 px-4 text-cyan-300/30"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                  >
                    {job.opened}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      className="text-[11px] text-cyan-400/50 hover:text-cyan-300 font-semibold"
                      onClick={(event) => {
                        event.stopPropagation();
                        openJobDetails(job);
                      }}
                      aria-label={`Open details for ${job.wip}`}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="py-8 px-4 text-center text-cyan-500/35"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    No WIP jobs match the active filters. Clear filters or create a new WIP job.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJobId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative glass-card neon-border w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedJob.wip}
                </h3>
                <p className="text-sm text-cyan-400/40">
                  {selectedJob.brand} • {selectedJob.track} • {selectedJob.stage}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedJobId(null)}>
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <div className="text-center">
                <p className="text-[10px] text-cyan-500/30">PARTS COST</p>
                <p className="text-lg font-bold neon-text-magenta">AED {selectedJob.partsCost}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-cyan-500/30">LABOR COST</p>
                <p className="text-lg font-bold neon-text-purple">AED {laborCost}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-cyan-500/30">TOTAL COST</p>
                <p className="text-lg font-bold neon-text-cyan">AED {totalJobCost}</p>
              </div>
            </div>
            <div className="flex gap-2 border-b border-cyan-500/10 pb-2">
              {(["diagnosis", "parts", "labor", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${detailTab === tab ? "bg-cyan-500/15 neon-text-cyan border border-cyan-500/30" : "text-cyan-500/30"}`}
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {detailTab === "diagnosis" && (
              <div className="space-y-3">
                <textarea
                  value={diagNotes}
                  onChange={(e) => setDiagNotes(e.target.value)}
                  rows={5}
                  placeholder="Enter diagnosis notes..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <button className="btn-cyber text-xs" onClick={saveDiagnosis}>
                  ✓ Save Notes
                </button>
              </div>
            )}
            {detailTab === "parts" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={addPartBarcode}
                    onChange={(e) => setAddPartBarcode(e.target.value)}
                    placeholder="Scan part barcode..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                  <button className="btn-cyber text-xs" onClick={addPartToWip}>
                    + Add Part
                  </button>
                </div>

                <div className="glass-card p-3 border border-cyan-500/10 space-y-2">
                  <p className="text-[11px] text-cyan-400/50" style={{ fontFamily: "var(--font-mono)" }}>
                    Replacement flow: install new part + harvest removed part to inventory.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      value={replaceInstalledBarcode}
                      onChange={(e) => setReplaceInstalledBarcode(e.target.value)}
                      placeholder="Installed part barcode"
                      className="px-3 py-2 rounded-lg text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <select
                      value={replaceRemovedComponent}
                      onChange={(e) => setReplaceRemovedComponent(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm"
                    >
                      <option>RAM</option>
                      <option>SSD</option>
                      <option>Battery</option>
                      <option>Keyboard</option>
                      <option>Other</option>
                    </select>
                    <input
                      value={replaceRemovedName}
                      onChange={(e) => setReplaceRemovedName(e.target.value)}
                      placeholder="Removed part name"
                      className="px-3 py-2 rounded-lg text-sm"
                    />
                    <input
                      value={replaceRemovedSpec}
                      onChange={(e) => setReplaceRemovedSpec(e.target.value)}
                      placeholder="Removed part spec (optional)"
                      className="px-3 py-2 rounded-lg text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <input
                      value={replaceRemovedSerial}
                      onChange={(e) => setReplaceRemovedSerial(e.target.value)}
                      placeholder="Removed part serial (optional)"
                      className="px-3 py-2 rounded-lg text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <select
                      value={replaceRemovedCondition}
                      onChange={(e) => setReplaceRemovedCondition(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm"
                    >
                      <option>Refurbished</option>
                      <option>Used</option>
                      <option>New</option>
                    </select>
                    <select
                      value={replaceDestination}
                      onChange={(e) =>
                        setReplaceDestination(e.target.value as (typeof REPLACEMENT_DESTINATIONS)[number])
                      }
                      className="px-3 py-2 rounded-lg text-sm"
                    >
                      {REPLACEMENT_DESTINATIONS.map((destination) => (
                        <option key={destination} value={destination}>
                          {destination}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={replaceEstimatedValue || ""}
                      onChange={(e) => setReplaceEstimatedValue(Number(e.target.value) || 0)}
                      placeholder="Est. salvage value"
                      className="px-3 py-2 rounded-lg text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <button className="btn-cyber text-xs" onClick={replacePartInWip}>
                      ↺ Replace + Harvest
                    </button>
                  </div>
                </div>
                {selectedJob.parts.length > 0 && (
                  <div className="glass-card p-3 border border-cyan-500/10">
                    {selectedJob.parts.map((p, idx) => (
                      <div key={`${p.barcode}-${idx}`} className="flex items-center justify-between text-xs py-1">
                        <span className="text-cyan-100/60" style={{ fontFamily: "var(--font-mono)" }}>
                          {p.name}
                        </span>
                        <button
                          className="text-[10px] text-red-400/60 hover:text-red-300"
                          onClick={() => removePartFromWip(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {detailTab === "labor" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={addLaborTech}
                    onChange={(e) => setAddLaborTech(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="">Technician</option>
                    {laborUserOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={addLaborHours || ""}
                    onChange={(e) => setAddLaborHours(Number(e.target.value))}
                    placeholder="Hours"
                    className="w-24 px-3 py-2 rounded-lg text-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                  <button className="btn-cyber text-xs" onClick={addLabor}>
                    + Add Labor
                  </button>
                </div>
                <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3 space-y-2">
                  <p className="text-[11px] text-cyan-400/60" style={{ fontFamily: "var(--font-mono)" }}>
                    Labor timer session
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatElapsed(laborTimer.elapsedMs)}
                    </span>
                    {!laborTimer.running ? (
                      <button className="btn-ghost text-xs" onClick={laborTimer.start}>
                        ▶ Start Timer
                      </button>
                    ) : (
                      <button className="btn-cyber text-xs" onClick={stopLaborTimer}>
                        ■ Stop + Add
                      </button>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={laborApprover}
                      onChange={(e) => setLaborApprover(e.target.value)}
                      className="px-3 py-2 rounded-lg text-xs"
                    >
                      {laborUserOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-cyan-400/60">Timer entries require approval</span>
                  </div>
                  {selectedJob.laborEntries.map((entry, idx) => (
                    <div
                      key={`${entry.tech}-${idx}`}
                      className="flex items-center justify-between text-xs border-b border-cyan-500/10 py-1"
                    >
                      <span>
                        {entry.tech} • {entry.hours}h • {entry.source || "manual"}{" "}
                        {entry.approved ? `• approved by ${entry.approvedBy || "system"}` : "• pending approval"}
                      </span>
                      {!entry.approved && (
                        <button className="btn-ghost text-[10px]" onClick={() => approveLaborEntry(idx)}>
                          Approve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailTab === "history" && (
              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                <div>
                  <p className="text-[11px] font-bold text-cyan-300/75 mb-2" style={{ fontFamily: "Rajdhani" }}>
                    JOB HISTORY
                  </p>
                  <div className="space-y-2">
                    {selectedJob.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-cyan-500/5">
                        <div className="w-2 h-2 rounded-full bg-cyan-500/30 mt-1.5" />
                        <div className="flex-1">
                          <p className="text-sm text-cyan-200/70">{h.action}</p>
                          <p className="text-[10px] text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>
                            {h.ts} • {h.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-cyan-300/75 mb-2" style={{ fontFamily: "Rajdhani" }}>
                    SYSTEM AUDIT TRAIL
                  </p>
                  {selectedWipAudit.length === 0 ? (
                    <p className="text-xs text-cyan-500/50">No system audit entries yet for this job.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedWipAudit.map((entry) => (
                        <div key={entry.id} className="p-2 rounded bg-purple-500/5 border border-purple-500/20 text-xs">
                          <p className="text-cyan-100/80">
                            {entry.action}
                            {entry.note ? ` — ${entry.note}` : ""}
                          </p>
                          <p className="text-cyan-500/40">
                            {new Date(entry.ts).toLocaleString()} · {entry.user}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {completionGate && (
              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                <p className="text-[11px] text-cyan-400/60 mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                  Quality gate before completion
                </p>
                <div className="space-y-1">
                  {completionGate.checks.map((check) => (
                    <p key={check.label} className={check.pass ? "text-green-300 text-xs" : "text-yellow-300 text-xs"}>
                      {check.pass ? "✓" : "•"} {check.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[11px] text-emerald-300/80 mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                System suggested next steps
              </p>
              <div className="space-y-1.5">
                {nextStepSuggestions.map((item, idx) => (
                  <p key={`${item}-${idx}`} className="text-xs text-emerald-100/85">
                    • {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setSelectedJobId(null)}>
                Close
              </button>
              <button className="btn-ghost" data-action="wip-move-stage" onClick={handleCompleteStatus}>
                ✓ Complete Status
              </button>
              <button
                className="btn-cyber disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={completeJob}
                disabled={!completionGate?.canComplete}
              >
                ✓ Complete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
