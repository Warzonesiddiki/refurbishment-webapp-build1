import { useState, useMemo } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { KpiCard } from "@/components/cards/KpiCard";
import type { Action, LaptopRecord } from "@/store/appState";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { getPageSectionHint } from "@/components/pages/pageSectionHints";

type AddLaptopPayload = Extract<Action, { type: "ADD_LAPTOP" }>["payload"];

const gradeColors: Record<string, string> = { A: "cyber-badge-green", B: "cyber-badge-yellow", C: "cyber-badge-red" };
const statusColors: Record<string, string> = {
  "Ready for Sale": "cyber-badge-green",
  "In Processing": "cyber-badge-purple",
  "Pending Grading": "cyber-badge-yellow",
  "Pending Verification": "cyber-badge-yellow",
  Sold: "cyber-badge-magenta",
};

export function InventoryLaptops() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [trackFilter, setTrackFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LaptopRecord>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newLaptop, setNewLaptop] = useState<AddLaptopPayload>({
    barcode: "",
    brand: "",
    model: "",
    specs: "",
    grade: "B",
    status: "Pending Verification",
    track: "-",
    cost: 0,
    date: new Date().toISOString().slice(0, 10),
    ramType: "DDR4",
    ramCapacityGb: 16,
    ssdType: "NVMe",
    ssdCapacityGb: 256,
    graphicsType: "iGPU",
  });
  const [bulkTrack, setBulkTrack] = useState("Track A");
  const pageSize = 10;

  const filtered = useMemo(() => {
    let data = state.laptops;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.barcode.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q) || l.model.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "All") data = data.filter((l) => l.status === statusFilter);
    if (trackFilter !== "All") data = data.filter((l) => l.track === trackFilter);
    if (brandFilter !== "All") data = data.filter((l) => l.brand === brandFilter);
    return data;
  }, [state.laptops, search, statusFilter, trackFilter, brandFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const brands = [...new Set(state.laptops.map((l) => l.brand))];
  const tracks = [...new Set(state.laptops.map((l) => l.track).filter((t) => t !== "-"))];
  const selectedLaptopMovement = useMemo(() => {
    if (!editData.barcode) return [];
    return state.movementLog.filter((m) => m.ref === editData.barcode).slice(0, 8);
  }, [editData.barcode, state.movementLog]);

  const toggleSelect = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () => setSelected((p) => (p.length === paged.length ? [] : paged.map((r) => r.id)));

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTrackFilter("All");
    setBrandFilter("All");
    setPage(1);
  };

  const bulkChangeStatus = (status: string) => {
    selected.forEach((id) => dispatch({ type: "UPDATE_LAPTOP", id, payload: { status } }));
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `Bulk status change: ${selected.length} laptops → ${status}`, time: "just now" },
    });
    setSelected([]);
  };

  const bulkDelete = () => {
    selected.forEach((id) => dispatch({ type: "DELETE_LAPTOP", id }));
    dispatch({
      type: "ADD_ACTIVITY",
      payload: { action: `Bulk deleted ${selected.length} laptops`, time: "just now" },
    });
    setSelected([]);
  };

  const startEdit = (laptop: LaptopRecord) => {
    setEditId(laptop.id);
    setEditData({ ...laptop });
  };
  const saveEdit = () => {
    if (!editId) return;
    dispatch({ type: "UPDATE_LAPTOP", id: editId, payload: editData });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Updated laptop ${editData.barcode}`, time: "just now" } });
    setEditId(null);
    setEditData({});
  };

  const addLaptop = () => {
    if (!newLaptop.barcode || !newLaptop.brand) return;
    const payload: AddLaptopPayload = {
      ...newLaptop,
      specs:
        newLaptop.specs ||
        `${newLaptop.ramCapacityGb || 0}GB ${newLaptop.ramType || ""} / ${newLaptop.ssdCapacityGb || 0}GB ${newLaptop.ssdType || ""} / ${newLaptop.graphicsType || "iGPU"}`,
    };
    dispatch({ type: "ADD_LAPTOP", payload });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: `Added laptop ${newLaptop.barcode}`, time: "just now" } });
    setNewLaptop({
      barcode: "",
      brand: "",
      model: "",
      specs: "",
      grade: "B",
      status: "Pending Verification",
      track: "-",
      cost: 0,
      date: new Date().toISOString().slice(0, 10),
      ramType: "DDR4",
      ramCapacityGb: 16,
      ssdType: "NVMe",
      ssdCapacityGb: 256,
      graphicsType: "iGPU",
    });
    setShowAdd(false);
  };

  const printLabels = (items: LaptopRecord[]) => {
    if (items.length === 0) return;
    const html = items
      .map(
        (l) =>
          `<div style="padding:12px;border:1px solid #ccc;margin:8px"><strong>${l.barcode}</strong><div>${l.brand} ${l.model}</div></div>`,
      )
      .join("");
    const w = window.open("", "labels");
    if (!w) return;
    w.document.write(`<html><head><title>Labels</title></head><body>${html}</body></html>`);
    w.document.close();
    w.print();
  };

  const bulkPrintLabels = () => {
    const items = selected.map((id) => state.laptops.find((l) => l.id === id)).filter(Boolean) as LaptopRecord[];
    printLabels(items);
  };

  const printSingleLabel = (laptop: LaptopRecord) => printLabels([laptop]);

  const totalValue = state.laptops.reduce((a, l) => a + l.cost, 0);

  return (
    <div data-page="inventory-laptops" data-testid="page-inventory-laptops" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl font-bold tracking-wider neon-text-cyan card-title"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              LAPTOPS
            </h1>
            <span className="cyber-chip">{state.laptops.length} UNITS</span>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>
            Inventory management • Filters • Bulk actions
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-ghost"
            onClick={() => {
              const rows = [
                ["Barcode", "Brand", "Model", "Specs", "Grade", "Status", "Track", "Cost", "Date"],
                ...state.laptops.map((l) => [
                  l.barcode,
                  l.brand,
                  l.model,
                  l.specs,
                  l.grade,
                  l.status,
                  l.track,
                  String(l.cost),
                  l.date,
                ]),
              ];
              const csv = rows.map((r) => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `laptops-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ↗ Export
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const text = await file.text();
                const lines = text.split(/\r?\n/).filter(Boolean);
                const headers = lines[0].split(",").map((h) => h.trim());
                lines.slice(1).forEach((line) => {
                  const cols = line.split(",");
                  const row = headers.reduce<Record<string, string>>((acc, h, i) => {
                    acc[h] = (cols[i] ?? "").trim();
                    return acc;
                  }, {});
                  dispatch({
                    type: "ADD_LAPTOP",
                    payload: {
                      barcode: row.Barcode || row.barcode,
                      brand: row.Brand || row.brand,
                      model: row.Model || row.model,
                      specs: row.Specs || row.specs || "",
                      grade: row.Grade || "B",
                      status: row.Status || "Pending Verification",
                      track: row.Track || "-",
                      cost: Number(row.Cost || 0),
                      date: row.Date || new Date().toISOString().slice(0, 10),
                    },
                  });
                });
              };
              input.click();
            }}
          >
            ↙ Import
          </button>
          <button className="btn-cyber" onClick={() => setShowAdd(true)}>
            + Add Laptop
          </button>
        </div>
      </div>

      <SectionHelpHint hint={getPageSectionHint("inventoryLaptops")} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Units" value={state.laptops.length} tone="cyan" icon="⬢" />
        <KpiCard
          label="Ready for Sale"
          value={state.laptops.filter((l) => l.status === "Ready for Sale").length}
          tone="green"
          icon="✓"
        />
        <KpiCard
          label="In Processing"
          value={state.laptops.filter((l) => l.status === "In Processing").length}
          tone="purple"
          icon="⚙"
        />
        <KpiCard label="Total Value" value={`AED ${(totalValue / 1000).toFixed(0)}K`} tone="magenta" icon="◈" />
      </div>

      {/* Add Laptop Modal */}
      {showAdd && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>
              ADD NEW LAPTOP
            </h3>
            <button className="btn-ghost text-xs" onClick={() => setShowAdd(false)}>
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              placeholder="Barcode *"
              value={newLaptop.barcode}
              onChange={(e) => setNewLaptop((p) => ({ ...p, barcode: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <input
              placeholder="Brand *"
              value={newLaptop.brand}
              onChange={(e) => setNewLaptop((p) => ({ ...p, brand: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            />
            <input
              placeholder="Model"
              value={newLaptop.model}
              onChange={(e) => setNewLaptop((p) => ({ ...p, model: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            />
            <input
              placeholder="Specs"
              value={newLaptop.specs}
              onChange={(e) => setNewLaptop((p) => ({ ...p, specs: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <select
              value={newLaptop.ramType || "DDR4"}
              onChange={(e) => setNewLaptop((p) => ({ ...p, ramType: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>DDR3</option>
              <option>DDR4</option>
              <option>DDR5</option>
              <option>LPDDR4</option>
              <option>LPDDR5</option>
            </select>
            <input
              type="number"
              placeholder="RAM Capacity (GB)"
              value={newLaptop.ramCapacityGb || ""}
              onChange={(e) => setNewLaptop((p) => ({ ...p, ramCapacityGb: Number(e.target.value) }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <select
              value={newLaptop.ssdType || "NVMe"}
              onChange={(e) => setNewLaptop((p) => ({ ...p, ssdType: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>NVMe</option>
              <option>M.2</option>
              <option>SATA</option>
            </select>
            <input
              type="number"
              placeholder="SSD Capacity (GB)"
              value={newLaptop.ssdCapacityGb || ""}
              onChange={(e) => setNewLaptop((p) => ({ ...p, ssdCapacityGb: Number(e.target.value) }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <select
              value={newLaptop.graphicsType || "iGPU"}
              onChange={(e) => setNewLaptop((p) => ({ ...p, graphicsType: e.target.value as "GPU" | "iGPU" }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option value="iGPU">iGPU</option>
              <option value="GPU">Dedicated GPU</option>
            </select>
            <select
              value={newLaptop.grade}
              onChange={(e) => setNewLaptop((p) => ({ ...p, grade: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            <select
              value={newLaptop.status}
              onChange={(e) => setNewLaptop((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>Pending Verification</option>
              <option>Pending Grading</option>
              <option>In Processing</option>
              <option>Ready for Sale</option>
            </select>
            <input
              type="number"
              placeholder="Cost (Ex VAT)"
              value={newLaptop.cost || ""}
              onChange={(e) => setNewLaptop((p) => ({ ...p, cost: Number(e.target.value) }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <button className="btn-cyber" onClick={addLaptop}>
              ✓ Add Laptop
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editId && (
        <div className="glass-card neon-border p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold neon-text-purple" style={{ fontFamily: "var(--font-heading)" }}>
              EDIT LAPTOP — {editData.barcode}
            </h3>
            <button className="btn-ghost text-xs" onClick={() => setEditId(null)}>
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              placeholder="Brand"
              value={editData.brand || ""}
              onChange={(e) => setEditData((p) => ({ ...p, brand: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            />
            <input
              placeholder="Model"
              value={editData.model || ""}
              onChange={(e) => setEditData((p) => ({ ...p, model: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            />
            <input
              placeholder="Specs"
              value={editData.specs || ""}
              onChange={(e) => setEditData((p) => ({ ...p, specs: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <select
              value={editData.grade || ""}
              onChange={(e) => setEditData((p) => ({ ...p, grade: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            <select
              value={editData.status || ""}
              onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option>Pending Verification</option>
              <option>Pending Grading</option>
              <option>In Processing</option>
              <option>Ready for Sale</option>
              <option>Sold</option>
            </select>
            <select
              value={editData.track || ""}
              onChange={(e) => setEditData((p) => ({ ...p, track: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm"
            >
              <option value="-">No Track</option>
              <option>Track A</option>
              <option>Track B</option>
              <option>Track C</option>
              <option>Track D</option>
              <option>Track E</option>
            </select>
            <input
              type="number"
              placeholder="Cost"
              value={editData.cost || ""}
              onChange={(e) => setEditData((p) => ({ ...p, cost: Number(e.target.value) }))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <button className="btn-cyber" onClick={saveEdit}>
              ✓ Save
            </button>
          </div>
          <div className="mt-4 border border-cyan-500/20 rounded-lg p-3 bg-cyan-500/5">
            <p className="text-[11px] font-bold text-cyan-300/80 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              MOVEMENT HISTORY
            </p>
            {selectedLaptopMovement.length === 0 ? (
              <p className="text-xs text-cyan-500/50">No movement events recorded for this laptop yet.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedLaptopMovement.map((m) => (
                  <p key={m.id} className="text-xs text-cyan-100/75">
                    • {new Date(m.ts).toLocaleString()} — {m.action}
                    {m.from ? ` (${m.from} → ${m.to || "n/a"})` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search barcode, brand, model..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg text-sm min-w-[140px]"
          >
            <option value="All">All Status</option>
            <option>Ready for Sale</option>
            <option>In Processing</option>
            <option>Pending Verification</option>
            <option>Pending Grading</option>
            <option>Sold</option>
          </select>
          <select
            value={trackFilter}
            onChange={(e) => {
              setTrackFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg text-sm min-w-[120px]"
          >
            <option value="All">All Tracks</option>
            {tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg text-sm min-w-[120px]"
          >
            <option value="All">All Brands</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <button className="btn-ghost text-xs" onClick={clearFilters}>
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="glass-card p-3 neon-border animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-[12px] font-bold neon-text-cyan" style={{ fontFamily: "var(--font-mono)" }}>
              {selected.length} SELECTED
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold border border-green-500/20 text-green-300/60 hover:text-green-200 hover:border-green-500/40 transition-all"
                onClick={() => bulkChangeStatus("Ready for Sale")}
              >
                → Ready
              </button>
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold border border-purple-500/20 text-purple-300/60 hover:text-purple-200 hover:border-purple-500/40 transition-all"
                onClick={() => bulkChangeStatus("In Processing")}
              >
                → Processing
              </button>
              <select
                value={bulkTrack}
                onChange={(e) => setBulkTrack(e.target.value)}
                className="px-2 py-1 rounded text-[11px] border border-cyan-500/20 bg-transparent"
              >
                <option>Track A</option>
                <option>Track B</option>
                <option>Track C</option>
                <option>Track D</option>
                <option>Track E</option>
              </select>
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold border border-cyan-500/20 text-cyan-300/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-all"
                onClick={() =>
                  selected.forEach((id) => dispatch({ type: "UPDATE_LAPTOP", id, payload: { track: bulkTrack } }))
                }
              >
                Assign
              </button>
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold border border-red-500/20 text-red-300/60 hover:text-red-200 hover:border-red-500/40 transition-all"
                onClick={bulkDelete}
              >
                🗑 Delete
              </button>
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold border border-cyan-500/20 text-cyan-300/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-all"
                onClick={bulkPrintLabels}
              >
                🖨 Labels
              </button>
              <button
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-cyan-500/30 hover:text-cyan-400 transition-all"
                onClick={() => setSelected([])}
              >
                ✕ Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card corner-marks p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === paged.length && paged.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="py-3 px-4 text-left">Barcode</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Model</th>
                <th className="py-3 px-4 text-left">Specs</th>
                <th className="py-3 px-4 text-left">Grade</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Track</th>
                <th className="py-3 px-4 text-left">Cost (Ex VAT)</th>
                <th className="py-3 px-4 text-left">Date Added</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-12 text-center text-cyan-500/20"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    No laptops match your filters
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className={selected.includes(row.id) ? "!bg-cyan-500/5" : ""}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="py-3 px-4" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      <span className="neon-text-cyan">{row.barcode}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-cyan-100/80">{row.brand}</td>
                    <td className="py-3 px-4 text-cyan-100/60">{row.model}</td>
                    <td
                      className="py-3 px-4 text-cyan-300/40"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                    >
                      {row.specs}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`cyber-chip ${gradeColors[row.grade] || "cyber-chip"}`}>{row.grade}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`cyber-chip ${statusColors[row.status] || "cyber-chip"}`}>{row.status}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-100/50">{row.track}</td>
                    <td
                      className="py-3 px-4 font-semibold neon-text-green"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                    >
                      AED {row.cost}
                    </td>
                    <td
                      className="py-3 px-4 text-cyan-300/30"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                    >
                      {row.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold"
                          onClick={() => startEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold"
                          onClick={() => printSingleLabel(row)}
                        >
                          Label
                        </button>
                        <button
                          className="text-[11px] text-cyan-400/50 hover:text-cyan-300 transition-colors font-semibold"
                          onClick={() =>
                            dispatch({
                              type: "ADD_ACTIVITY",
                              payload: { action: `History viewed for ${row.barcode}`, time: "just now" },
                            })
                          }
                        >
                          History
                        </button>
                        <button
                          className="text-[11px] text-red-400/50 hover:text-red-300 transition-colors font-semibold"
                          onClick={() => {
                            dispatch({ type: "DELETE_LAPTOP", id: row.id });
                          }}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-cyan-500/10 flex items-center justify-between">
          <span className="text-[11px] text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded text-[11px] font-bold border border-cyan-500/15 text-cyan-500/30 hover:text-cyan-400 disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), page + 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-[11px] font-bold transition-all ${p === page ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "text-cyan-500/20 hover:text-cyan-400 border border-transparent hover:border-cyan-500/15"}`}
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded text-[11px] font-bold border border-cyan-500/15 text-cyan-500/30 hover:text-cyan-400 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
