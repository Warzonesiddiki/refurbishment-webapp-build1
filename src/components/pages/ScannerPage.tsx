import { useState, useRef, useEffect } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { printLabel } from "@/utils/print";
import { HistoryPanel } from "@/components/ui/HistoryPanel";
import type { LaptopRecord, PartRecord } from "@/store/appState";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

type ScanResult = { type: "laptop"; data: LaptopRecord } | { type: "part"; data: PartRecord } | null;

export function ScannerPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ScanResult>(null);
  const [notFound, setNotFound] = useState(false);
  const [history, setHistory] = useState<{ barcode: string; type: string; time: string }[]>([]);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    brand: "",
    model: "",
    specs: "",
    grade: "B",
    status: "Pending Verification",
    track: "-",
    cost: 0,
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (result?.type === "laptop") {
      setEditForm({
        brand: result.data.brand,
        model: result.data.model,
        specs: result.data.specs || "",
        grade: result.data.grade || "B",
        status: result.data.status || "Pending Verification",
        track: result.data.track || "-",
        cost: result.data.cost,
      });
    }
  }, [result]);
  const doScan = () => {
    const q = query.trim().toUpperCase();
    if (!q) return;

    const laptop = state.laptops.find(l => l.barcode.toUpperCase() === q);
    if (laptop) {
      setResult({ type: "laptop", data: laptop });
      setNotFound(false);
      setHistory(prev => [{ barcode: laptop.barcode, type: "Laptop", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setNewStatus(laptop.status);
      setQuery("");
      return;
    }

    const part = state.parts.find(p => p.barcode.toUpperCase() === q);
    if (part) {
      setResult({ type: "part", data: part });
      setNotFound(false);
      setHistory(prev => [{ barcode: part.barcode, type: "Part", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setQuery("");
      return;
    }

    setResult(null);
    setNotFound(true);
    setHistory(prev => [{ barcode: q, type: "Not Found", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") doScan(); };

  const applyStatus = () => {
    if (!result || result.type !== "laptop" || !newStatus) return;
    dispatch({ type: "UPDATE_LAPTOP", id: result.data.id, payload: { status: newStatus } });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `Status changed: ${result.data.barcode} → ${newStatus}${statusNote ? ` (${statusNote})` : ""}`, time: "just now" },
    });
    setResult({ ...result, data: { ...result.data, status: newStatus } });
    setStatusNote("");
  };

  const laptopStatuses = ["Pending Verification", "Pending Grading", "In Processing", "Ready for Sale", "Sold", "Disposed"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>SCANNER</h1>
            <span className="cyber-chip">SCAN‑FIRST</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>
            Scan barcode to look up laptops & parts • Quick status updates
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => setHistory([])}>✕ Clear History</button>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("scanner")} />

      {/* Scan Input */}
      <div className="glass-card corner-marks p-6">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="text-4xl mb-2">📷</div>
          <h2 className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>SCAN OR ENTER BARCODE</h2>
          <p className="text-xs text-cyan-400/40" style={{ fontFamily: "var(--font-mono)" }}>
            Position barcode in front of scanner or type manually
          </p>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="ALM-LP-XXXXXXXX-XXXX or ALM-PT-XXXXXXXX-XXXX"
              className="flex-1 px-4 py-3 rounded-lg text-center text-lg tracking-widest"
              style={{ fontFamily: "var(--font-mono)" }}
              autoFocus
            />
            <button className="btn-cyber px-6" onClick={doScan}>⏎ Scan</button>
            <button className="btn-ghost px-4" onClick={() => { setQuery(""); setResult(null); setNotFound(false); inputRef.current?.focus(); }}>✕</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result && result.type === "laptop" && (
            <>
              {/* Laptop Details */}
              <div className="glass-card corner-marks p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>LAPTOP FOUND</p>
                    <h3 className="text-xl font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
                      {result.data.brand} {result.data.model}
                    </h3>
                  </div>
                  <span className={`cyber-chip ${result.data.status === "Ready for Sale" ? "cyber-badge-green" : result.data.status === "In Processing" ? "cyber-badge-purple" : result.data.status === "Sold" ? "cyber-badge-magenta" : "cyber-badge-yellow"}`}>
                    {result.data.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Barcode</p>
                    <p className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>{result.data.barcode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Grade</p>
                    <span className={`cyber-chip ${result.data.grade === "A" ? "cyber-badge-green" : result.data.grade === "B" ? "cyber-badge-yellow" : "cyber-badge-red"}`}>{result.data.grade}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Track</p>
                    <p className="text-sm text-cyan-200/70">{result.data.track}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Cost (Ex VAT)</p>
                    <p className="text-sm font-bold neon-text-green" style={{ fontFamily: "var(--font-mono)" }}>AED {result.data.cost}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase mb-1" style={{ fontFamily: "var(--font-mono)" }}>Specs</p>
                  <p className="text-sm text-cyan-300/50" style={{ fontFamily: "var(--font-mono)" }}>{result.data.specs}</p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-cyan-500/10">
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => setEditOpen(true)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => printLabel(result.data.barcode)}
                  >
                    🖨️ Print Label
                  </button>
                  <button className="btn-ghost text-xs" onClick={() => setShowHistory((s) => !s)}>📋 History</button>
                </div>
              </div>

              {editOpen && (
                <div className="glass-card p-4 border border-cyan-500/20 space-y-3">
                  <h4 className="text-xs font-bold neon-text-purple" style={{ fontFamily: "var(--font-heading)" }}>EDIT LAPTOP</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      className="px-3 py-2 rounded-lg text-sm"
                      placeholder="Brand"
                      value={editForm.brand}
                      onChange={(e) => setEditForm((p) => ({ ...p, brand: e.target.value }))}
                    />
                    <input
                      className="px-3 py-2 rounded-lg text-sm"
                      placeholder="Model"
                      value={editForm.model}
                      onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))}
                    />
                    <input
                      className="px-3 py-2 rounded-lg text-sm"
                      placeholder="Specs"
                      value={editForm.specs}
                      onChange={(e) => setEditForm((p) => ({ ...p, specs: e.target.value }))}
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost text-xs" onClick={() => setEditOpen(false)}>Cancel</button>
                    <button
                      className="btn-cyber text-xs"
                      onClick={() => {
                        if (!result || result.type !== "laptop") return;
                        dispatch({ type: "UPDATE_LAPTOP", id: result.data.id, payload: { ...editForm } });
                        setResult({ ...result, data: { ...result.data, ...editForm } });
                        setEditOpen(false);
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Status Update */}
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-sm font-bold neon-text-purple" style={{ fontFamily: "var(--font-heading)" }}>QUICK STATUS UPDATE</h4>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>NEW STATUS</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm">
                      {laptopStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>NOTE</label>
                    <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Optional note..." className="w-full px-3 py-2 rounded-lg text-sm" />
                  </div>
                  <button className="btn-cyber" onClick={applyStatus}>✓ Apply</button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-sm font-bold neon-text-green" style={{ fontFamily: "var(--font-heading)" }}>QUICK ACTIONS</h4>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-ghost text-xs" onClick={() => onNavigate?.("sales-new")}>🛒 Add to Sale</button>
                  <button className="btn-ghost text-xs" onClick={() => onNavigate?.("processing-wip")}>🔧 Open WIP Job</button>
                  <button className="btn-ghost text-xs" onClick={() => onNavigate?.("processing-tracks")}>🔄 Change Track</button>
                  <button className="btn-ghost text-xs" onClick={() => onNavigate?.("processing-wip")}>👤 Assign Technician</button>
                  <button className="btn-ghost text-xs" onClick={() => dispatch({ type: "ADD_ACTIVITY", payload: { action: `Note added for ${result.data.barcode}`, time: "just now" } })}>📝 Add Note</button>
                </div>
              </div>
            </>
          )}

          {result && result.type === "part" && (
            <div className="glass-card corner-marks p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>PART FOUND</p>
                  <h3 className="text-xl font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
                    {result.data.name}
                  </h3>
                </div>
                <span className={`cyber-chip ${result.data.onHand > result.data.reorder ? "cyber-badge-green" : result.data.onHand > 0 ? "cyber-badge-yellow" : "cyber-badge-red"}`}>
                  {result.data.onHand > result.data.reorder ? "In Stock" : result.data.onHand > 0 ? "Low Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Barcode</p>
                  <p className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>{result.data.barcode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Category</p>
                  <p className="text-sm text-cyan-200/70">{result.data.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>On Hand / Reorder</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>
                    <span className={result.data.onHand <= result.data.reorder ? "text-red-400" : "neon-text-green"}>{result.data.onHand}</span>
                    <span className="text-cyan-500/30"> / {result.data.reorder}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Unit Cost</p>
                  <p className="text-sm font-bold neon-text-green" style={{ fontFamily: "var(--font-mono)" }}>AED {result.data.cost}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Specification</p>
                  <p className="text-sm text-cyan-300/50">{result.data.spec}</p>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-500/30 uppercase" style={{ fontFamily: "var(--font-mono)" }}>Location</p>
                  <p className="text-sm text-cyan-300/50">{result.data.location}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-cyan-500/10">
                <button className="btn-ghost text-xs" onClick={() => onNavigate?.("inventory-parts")}>✏️ Edit</button>
                <button className="btn-ghost text-xs" onClick={() => printLabel(result.data.barcode)}>🖨️ Print Label</button>
                <button className="btn-ghost text-xs" onClick={() => onNavigate?.("inventory-parts")}>📦 Adjust Stock</button>
              </div>
            </div>
          )}

          {notFound && (
            <div className="glass-card corner-marks p-6 text-center space-y-4">
              <div className="text-5xl mb-2">🔍</div>
              <h3 className="text-lg font-bold text-red-400" style={{ fontFamily: "var(--font-heading)" }}>NOT FOUND</h3>
              <p className="text-sm text-cyan-400/40" style={{ fontFamily: "var(--font-mono)" }}>
                No laptop or part found with barcode "{query || history[0]?.barcode}"
              </p>
              <div className="flex justify-center gap-3">
                <button
                  className="btn-cyber"
                  onClick={() => onNavigate?.("inventory-laptops")}
                >
                  + Create Laptop
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => onNavigate?.("inventory-parts")}
                >
                  + Create Part
                </button>
              </div>
            </div>
          )}

          {!result && !notFound && (
            <div className="glass-card corner-marks p-12 text-center">
              <div className="text-6xl mb-4 opacity-30">📡</div>
              <h3 className="text-lg font-bold text-cyan-500/30" style={{ fontFamily: "var(--font-heading)" }}>WAITING FOR SCAN</h3>
              <p className="text-sm text-cyan-500/20 mt-2" style={{ fontFamily: "var(--font-mono)" }}>
                Scan a barcode or type it above and press Enter
              </p>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>SCAN HISTORY</h4>
              <span className="cyber-chip">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-cyan-500/20 text-center py-6" style={{ fontFamily: "var(--font-mono)" }}>No scans yet</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-all"
                    onClick={() => { setQuery(h.barcode); }}
                  >
                    <div>
                      <p className="text-xs font-bold neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>{h.barcode}</p>
                      <p className="text-[10px] text-cyan-500/30">{h.type}</p>
                    </div>
                    <p className="text-[10px] text-cyan-500/20" style={{ fontFamily: "var(--font-mono)" }}>{h.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showHistory && result && result.type === "laptop" && (
            <HistoryPanel
              title="Movement History"
              entries={state.activity.slice(0, 6).map((a) => ({ ts: a.time, action: a.action, user: "system" }))}
            />
          )}

          {/* Quick Tips */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-bold neon-text-purple mb-3" style={{ fontFamily: "var(--font-heading)" }}>QUICK TIPS</h4>
            <ul className="space-y-2 text-xs text-cyan-400/40" style={{ fontFamily: "var(--font-mono)" }}>
              <li>• Press <span className="neon-text-cyan">Enter</span> to scan</li>
              <li>• Click history item to re-scan</li>
              <li>• Use ALM-LP-* for laptops</li>
              <li>• Use ALM-PT-* for parts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
