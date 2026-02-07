import { AlertCard } from "@/components/cards/AlertCard";
import { KpiCard } from "@/components/cards/KpiCard";
import { useStore } from "@/context/StoreContext";
import { BarChart } from "@/components/ui/BarChart";
import { PieChart } from "@/components/ui/PieChart";

const trackColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  "Track A": { bg: "from-cyan-500/15 to-cyan-500/5", border: "border-cyan-500/30", glow: "shadow-[0_0_15px_rgba(0,240,255,0.2)]", text: "neon-text-cyan" },
  "Track B": { bg: "from-green-500/15 to-green-500/5", border: "border-green-500/30", glow: "shadow-[0_0_15px_rgba(57,255,20,0.2)]", text: "neon-text-green" },
  "Track C": { bg: "from-yellow-500/15 to-yellow-500/5", border: "border-yellow-500/30", glow: "shadow-[0_0_15px_rgba(255,230,0,0.2)]", text: "neon-text-yellow" },
  "Track D": { bg: "from-purple-500/15 to-purple-500/5", border: "border-purple-500/30", glow: "shadow-[0_0_15px_rgba(123,45,255,0.2)]", text: "neon-text-purple" },
  "Track E": { bg: "from-red-500/15 to-red-500/5", border: "border-red-500/30", glow: "shadow-[0_0_15px_rgba(255,0,60,0.2)]", text: "neon-text-red" },
};

const quickActions = [
  { icon: "⊞", label: "Quick Scan", key: "scan" },
  { icon: "◈", label: "New Sale", key: "new-sale" },
  { icon: "⇊", label: "Import Lot", key: "import-lot" },
  { icon: "★", label: "Grade", key: "grade" },
  { icon: "⬢", label: "Add Laptop", key: "add-laptop" },
  { icon: "⬡", label: "Add Part", key: "add-part" },
];

export function DashboardSection({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { state, kpis, dispatch } = useStore();

  const trackSummary = [
    { name: "Track A", laptops: state.laptops.filter(l => l.track === "Track A" || l.track === "Completed").length },
    { name: "Track B", laptops: state.laptops.filter(l => l.track === "Track B").length },
    { name: "Track C", laptops: state.wipJobs.filter(w => w.track === "Track C").length },
    { name: "Track D", laptops: state.wipJobs.filter(w => w.track === "Track D").length },
    { name: "Track E", laptops: state.wipJobs.filter(w => w.track === "Track E").length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: 'Orbitron' }}>
              DASHBOARD
            </h1>
            <span className="cyber-chip animate-pulse-glow">LIVE</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: 'Share Tech Mono' }}>
            Business overview • KPIs • Tracks • Alerts
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => onNavigate?.("dashboard")}>↻ Refresh</button>
          <button className="btn-cyber" onClick={() => onNavigate?.("reports")}>⬡ Export Report</button>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Laptops" value={kpis.totalLaptops} trend={`+${kpis.totalLaptops}`} tone="cyan" icon="💻" />
        <KpiCard label="In Processing" value={kpis.inProcessing} tone="purple" icon="⚙" />
        <KpiCard label="Ready for Sale" value={kpis.readyForSale} tone="green" icon="✓" />
        <KpiCard label="Today's Sales" value={`AED ${kpis.todaysSales.toLocaleString()}`} tone="magenta" icon="◈" />
      </div>

      {/* ── KPI Row 2 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pending Verification" value={kpis.pendingVerification} tone="yellow" icon="⊘" />
        <KpiCard label="Pending Grading" value={kpis.pendingGrading} tone="yellow" icon="★" />
        <KpiCard label="Low Stock Parts" value={kpis.lowStockParts} tone="red" icon="⚠" />
        <KpiCard label="This Month Profit" value={`AED ${kpis.monthProfit.toLocaleString()}`} trend="+22%" tone="green" icon="▲" />
      </div>

      {/* ── Processing Tracks ── */}
      <div className="glass-card corner-marks p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="section-header flex-1">
            <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
              PROCESSING TRACKS
            </h3>
          </div>
                      <button className="btn-ghost text-xs" onClick={() => onNavigate?.("reports")}>View All →</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {trackSummary.map((track) => {
            const tc = trackColors[track.name] || trackColors["Track A"];
            return (
              <div
                key={track.name}
                className={`glass-card p-4 text-center ${tc.border} ${tc.glow} bg-gradient-to-b ${tc.bg} hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className={`text-3xl font-black ${tc.text} mb-1`} style={{ fontFamily: 'Orbitron' }}>
                  {track.laptops}
                </div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-100/50 font-bold" style={{ fontFamily: 'Rajdhani' }}>
                  {track.name}
                </p>
                <div className="mt-3 progress-cyber">
                  <div className="progress-cyber-fill" style={{ width: `${Math.min((track.laptops / 20) * 100, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="glass-card corner-marks p-6">
        <div className="section-header mb-5">
          <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
            QUICK ACTIONS
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.key}
              data-action={action.key}
              className="glass-card p-4 text-center border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group cursor-pointer"
              onClick={() => {
                const map: Record<string, string> = {
                  "scan": "scanner",
                  "new-sale": "sales-new",
                  "import-lot": "receiving-import",
                  "grade": "receiving-grading",
                  "add-laptop": "inventory-laptops",
                  "add-part": "inventory-parts",
                };
                const page = map[action.key] || "dashboard";
                onNavigate?.(page);
              }}
            >
              <div className="text-2xl mb-2 neon-text-cyan opacity-50 group-hover:opacity-100 transition-opacity">
                {action.icon}
              </div>
              <div className="text-[12px] font-bold uppercase tracking-wider text-cyan-100/50 group-hover:text-cyan-200 transition-colors" style={{ fontFamily: 'Rajdhani' }}>
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Activity + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card corner-marks p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="section-header flex-1">
              <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
                ACTIVITY FEED
              </h3>
            </div>
            <button className="btn-ghost text-xs" onClick={() => onNavigate?.("processing-tracks")}>View All →</button>
          </div>
          <div className="space-y-3">
            {state.activity.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="mt-1.5 relative">
                  <span className="status-dot status-dot-online" />
                  {idx < state.activity.length - 1 && (
                    <div className="absolute top-3 left-[3px] w-[2px] h-6 bg-gradient-to-b from-cyan-500/20 to-transparent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-cyan-100/70 group-hover:text-cyan-100 transition-colors leading-relaxed">
                    {item.action}
                  </p>
                  <p className="text-[10px] text-cyan-500/30 mt-0.5" style={{ fontFamily: 'Share Tech Mono' }}>
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-card corner-marks p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="section-header flex-1">
              <h3 className="text-sm font-bold tracking-[0.15em] text-red-400" style={{ fontFamily: 'Orbitron' }}>
                ALERTS
              </h3>
            </div>
            <button
              className="text-[10px] uppercase tracking-wider text-red-500/50 hover:text-red-400 font-bold transition-colors"
              style={{ fontFamily: 'Orbitron' }}
              onClick={() => state.alerts.forEach((alert) => dispatch({ type: "CLEAR_ALERT", id: alert.id }))}
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {state.alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-cyan-500/25" style={{ fontFamily: 'Share Tech Mono' }}>No active alerts ✓</p>
              </div>
            ) : (
              state.alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  title={alert.title}
                  description={alert.description}
                  tone={alert.tone as "red" | "yellow" | "blue" | "green"}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card corner-marks p-6">
          <div className="section-header mb-4">
            <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
              SALES TREND
            </h3>
          </div>
          <div className="flex gap-2 mb-4">
            {["7D", "30D", "90D"].map((period, idx) => (
              <button
                key={period}
                className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                  idx === 1
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-cyan-500/30 border border-transparent hover:border-cyan-500/15 hover:text-cyan-400"
                }`}
                style={{ fontFamily: 'Orbitron' }}
              >
                {period}
              </button>
            ))}
          </div>
          <BarChart
            data={state.sales.slice(-12).map((s, idx) => ({ label: String(idx + 1), value: s.total || 0 }))}
            height={160}
          />
        </div>

        <div className="glass-card corner-marks p-6">
          <div className="section-header mb-4">
            <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
              INVENTORY BY STATUS
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChart
              data={[
                { label: "Ready", value: kpis.readyForSale, color: "#39ff14" },
                { label: "Processing", value: kpis.inProcessing, color: "#7b2dff" },
                { label: "Pending", value: kpis.pendingVerification + kpis.pendingGrading, color: "#ffe600" },
              ]}
            />
            <div className="space-y-4">
              {[
                { label: "Ready for Sale", count: kpis.readyForSale, pct: kpis.totalLaptops > 0 ? Math.round((kpis.readyForSale / kpis.totalLaptops) * 100) : 0, color: "from-green-500/50 to-green-500/20", textColor: "neon-text-green" },
                { label: "In Processing", count: kpis.inProcessing, pct: kpis.totalLaptops > 0 ? Math.round((kpis.inProcessing / kpis.totalLaptops) * 100) : 0, color: "from-purple-500/50 to-purple-500/20", textColor: "neon-text-purple" },
                { label: "Pending Verification", count: kpis.pendingVerification, pct: kpis.totalLaptops > 0 ? Math.round((kpis.pendingVerification / kpis.totalLaptops) * 100) : 0, color: "from-yellow-500/50 to-yellow-500/20", textColor: "neon-text-yellow" },
                { label: "Pending Grading", count: kpis.pendingGrading, pct: kpis.totalLaptops > 0 ? Math.round((kpis.pendingGrading / kpis.totalLaptops) * 100) : 0, color: "from-cyan-500/50 to-cyan-500/20", textColor: "neon-text-cyan" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-cyan-100/60 font-semibold" style={{ fontFamily: 'Rajdhani' }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${item.textColor}`} style={{ fontFamily: 'Orbitron', fontSize: '12px' }}>{item.count}</span>
                      <span className="text-[10px] text-cyan-500/30" style={{ fontFamily: 'Share Tech Mono' }}>{item.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-cyan-500/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      style={{ width: `${item.pct}%`, boxShadow: '0 0 8px rgba(0,240,255,0.2)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
