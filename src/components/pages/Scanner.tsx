import { useState } from "react";

const recentScans = [
  { barcode: "ALM-LP-20240115-0023", type: "Laptop", time: "2 min ago", status: "Ready for Sale" },
  { barcode: "ALM-PT-20240114-0089", type: "Part", time: "8 min ago", status: "In Stock" },
  { barcode: "ALM-LP-20240115-0024", type: "Laptop", time: "15 min ago", status: "In Processing" },
];

export function ScannerPage() {
  const [scanValue, setScanValue] = useState("");
  const [found, setFound] = useState<null | typeof recentScans[0]>(null);

  const handleScan = () => {
    const match = recentScans.find(s => s.barcode === scanValue);
    setFound(match || null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: 'Orbitron' }}>
              SCANNER
            </h1>
            <span className="cyber-chip">READY</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: 'Share Tech Mono' }}>
            Scan barcode • View details • Quick actions
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost">⟲ Scan History</button>
          <button className="btn-cyber">⬡ Generate Barcode</button>
        </div>
      </div>

      {/* Scan Input */}
      <div className="glass-card corner-marks p-8">
        <label className="block text-[11px] uppercase tracking-[0.15em] text-cyan-500/50 mb-3" style={{ fontFamily: 'Orbitron' }}>
          Scan or Enter Barcode
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <input
              type="text"
              value={scanValue}
              onChange={e => setScanValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              placeholder="ALM-LP-YYYYMMDD-NNNN or ALM-PT-YYYYMMDD-NNNN"
              className="w-full pl-12 pr-4 py-4 rounded-lg text-lg animate-border-glow"
              style={{ fontFamily: 'Share Tech Mono', fontSize: '16px' }}
              autoFocus
            />
          </div>
          <button className="btn-cyber px-6" onClick={handleScan}>
            SCAN
          </button>
          {scanValue && (
            <button className="btn-ghost px-4" onClick={() => { setScanValue(""); setFound(null); }}>
              CLEAR
            </button>
          )}
        </div>
        <p className="text-[11px] text-cyan-500/25 mt-2" style={{ fontFamily: 'Share Tech Mono' }}>
          ↵ Enter to search • Supports laptop & part barcodes • Camera scan coming soon
        </p>
      </div>

      {/* Found Result */}
      {found && (
        <div className="glass-card corner-marks p-6 neon-border animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="status-dot status-dot-online" />
            <h3 className="text-sm font-bold tracking-[0.12em] neon-text-green" style={{ fontFamily: 'Orbitron' }}>
              MATCH FOUND
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Detail Card */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Barcode" value={found.barcode} mono />
                <DetailField label="Type" value={found.type} />
                <DetailField label="Status" value={found.status} badge />
                <DetailField label="Last Updated" value={found.time} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="btn-cyber text-xs">✎ Edit</button>
                <button className="btn-ghost text-xs">⎙ Print Label</button>
                <button className="btn-ghost text-xs">◷ History</button>
              </div>
            </div>

            {/* Barcode Visual */}
            <div className="glass-card p-4 text-center border border-cyan-500/20">
              <div className="flex justify-center gap-[2px] mb-3 h-16">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="bg-cyan-400/60" style={{
                    width: [1, 2, 3][i % 3] + 'px',
                    opacity: 0.4 + Math.random() * 0.6
                  }} />
                ))}
              </div>
              <p className="text-[11px] neon-text-cyan" style={{ fontFamily: 'Share Tech Mono' }}>
                {found.barcode}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-cyan-500/10">
            <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-500/30 mb-3" style={{ fontFamily: 'Orbitron' }}>
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {["Update Status", "Change Track", "Add to Sale", "Open WIP", "Assign Tech", "Add Note"].map(a => (
                <button key={a} className="px-3 py-1.5 rounded text-[11px] font-semibold border border-cyan-500/15 text-cyan-300/60 hover:text-cyan-200 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all" style={{ fontFamily: 'Rajdhani' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Status Update */}
          <div className="mt-4 pt-4 border-t border-cyan-500/10">
            <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-500/30 mb-3" style={{ fontFamily: 'Orbitron' }}>
              Quick Status Update
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <select className="w-full rounded-lg px-3 py-2 text-sm">
                  <option>Select transition...</option>
                  <option>→ In Processing</option>
                  <option>→ Ready for Sale</option>
                  <option>→ Sold</option>
                </select>
              </div>
              <input className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm" placeholder="Note (optional)" />
              <button className="btn-cyber-green text-xs px-4 py-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-semibold transition-all">
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not found state */}
      {scanValue && !found && (
        <div className="glass-card corner-marks p-6 border border-yellow-500/20 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="status-dot status-dot-warning" />
            <h3 className="text-sm font-bold tracking-[0.12em] neon-text-yellow" style={{ fontFamily: 'Orbitron' }}>
              NOT FOUND
            </h3>
          </div>
          <p className="text-sm text-cyan-100/50 mb-4">No matching record for "{scanValue}". Create a new entry:</p>
          <div className="flex gap-3">
            <button className="btn-cyber">+ Create Laptop</button>
            <button className="btn-cyber-magenta px-4 py-2 rounded-lg border border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 font-semibold transition-all text-[13px] uppercase tracking-wider">
              + Create Part
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanValue && !found && (
        <div className="glass-card corner-marks p-12 text-center">
          <div className="text-5xl mb-4 opacity-30">⊞</div>
          <h3 className="text-lg font-bold tracking-wider text-cyan-200/60 mb-2" style={{ fontFamily: 'Orbitron' }}>
            READY TO SCAN
          </h3>
          <p className="text-sm text-cyan-500/30" style={{ fontFamily: 'Share Tech Mono' }}>
            Point your scanner at a barcode, or type it above and press Enter.
          </p>
        </div>
      )}

      {/* Recent Scans */}
      <div className="glass-card corner-marks p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="section-header flex-1">
            <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
              RECENT SCANS
            </h3>
          </div>
          <button className="text-[10px] uppercase tracking-wider text-cyan-500/30 hover:text-cyan-400 font-bold transition-colors" style={{ fontFamily: 'Orbitron' }}>
            Clear All
          </button>
        </div>
        <div className="space-y-2">
          {recentScans.map((scan, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg border border-cyan-500/8 hover:border-cyan-500/20 hover:bg-cyan-500/3 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="text-cyan-500/20 group-hover:text-cyan-400/60 transition-colors" style={{ fontFamily: 'Share Tech Mono' }}>
                  {scan.type === "Laptop" ? "⬢" : "⬡"}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-cyan-100/70 group-hover:text-cyan-100" style={{ fontFamily: 'Share Tech Mono' }}>
                    {scan.barcode}
                  </p>
                  <p className="text-[10px] text-cyan-500/25">{scan.type} • {scan.time}</p>
                </div>
              </div>
              <span className={`cyber-chip text-[10px] ${
                scan.status === "Ready for Sale" ? "cyber-badge-green" :
                scan.status === "In Stock" ? "cyber-badge-green" :
                "cyber-badge-yellow"
              }`}>
                {scan.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Movement History */}
      <div className="glass-card corner-marks p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="section-header flex-1">
            <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
              MOVEMENT HISTORY
            </h3>
          </div>
          <button className="btn-ghost text-xs">Export ↗</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">From</th>
                <th className="py-3 px-4 text-left">To</th>
                <th className="py-3 px-4 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ts: "2024-01-16 14:32", action: "Status Change", from: "In Processing", to: "Ready for Sale", user: "admin" },
                { ts: "2024-01-15 09:15", action: "Grade Assigned", from: "-", to: "Grade A", user: "tech1" },
                { ts: "2024-01-14 16:45", action: "Verified", from: "Pending", to: "Verified", user: "admin" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 font-mono text-[12px] text-cyan-300/50">{row.ts}</td>
                  <td className="py-3 px-4">{row.action}</td>
                  <td className="py-3 px-4 text-cyan-100/40">{row.from}</td>
                  <td className="py-3 px-4 neon-text-cyan text-[12px]">{row.to}</td>
                  <td className="py-3 px-4 text-cyan-300/40" style={{ fontFamily: 'Share Tech Mono' }}>{row.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-500/30 mb-1" style={{ fontFamily: 'Orbitron' }}>{label}</p>
      {badge ? (
        <span className="cyber-chip cyber-badge-green">{value}</span>
      ) : (
        <p className={`text-sm text-cyan-100/80 ${mono ? '' : ''}`} style={mono ? { fontFamily: 'Share Tech Mono' } : { fontFamily: 'Rajdhani' }}>
          {value}
        </p>
      )}
    </div>
  );
}
