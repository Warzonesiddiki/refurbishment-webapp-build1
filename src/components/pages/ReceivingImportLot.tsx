import { useMemo, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { useIdempotentAction } from "@/hooks/useIdempotentAction";
import { useUiActionFeedback } from "@/hooks/useUiActionFeedback";
import {
  extractReceivingCanonicalFields,
  invalidImportRowsToCsv,
  validateReceivingCanonicalFields,
  type ImportRow,
} from "@/utils/receivingImport";

const steps = [
  { num: 1, label: "Lot Details", icon: "◈" },
  { num: 2, label: "Upload File", icon: "↑" },
  { num: 3, label: "Map Columns", icon: "⇄" },
  { num: 4, label: "Preview & Import", icon: "✓" },
];

type ImportUnit = {
  source: ImportRow;
  serial: string;
  unitIndex: number;
  unitsInRow: number;
};

type ImportPreviewRow = {
  canonical: Record<string, string>;
  barcode: string;
  brand: string;
  model: string;
  cost: number;
  ramType: string;
  ramCapacityGb: number;
  ssdType: string;
  ssdCapacityGb: number;
  graphicsType: "GPU" | "iGPU";
  importMeta: Record<string, string>;
  error: string;
};

type ImportMapping = {
  barcode: string;
  brand: string;
  model: string;
  cost: string;
  ramType: string;
  ramCapacityGb: string;
  ssdType: string;
  ssdCapacityGb: string;
  graphicsType: string;
};

function parseCsv(text: string): ImportRow[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      current.push(cell.trim());
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      current.push(cell.trim());
      cell = "";
      if (current.some((v) => v.length > 0)) rows.push(current);
      current = [];
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell.trim());
    if (current.some((v) => v.length > 0)) rows.push(current);
  }

  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((cols) =>
    headers.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = (cols[i] ?? "").trim();
      return acc;
    }, {}),
  );
}

function parseCapacityGb(input: string) {
  const match = input.match(/(\d+)\s*\/?\s*(gb|tb)/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2].toLowerCase() === "tb" ? value * 1024 : value;
}

function inferRamType(text: string) {
  if (/lpddr5/i.test(text)) return "LPDDR5";
  if (/lpddr4/i.test(text)) return "LPDDR4";
  if (/ddr5/i.test(text)) return "DDR5";
  if (/ddr4/i.test(text)) return "DDR4";
  if (/ddr3/i.test(text)) return "DDR3";
  return "Unknown";
}

function inferSsdType(text: string) {
  if (/nvme/i.test(text)) return "NVMe";
  if (/m\.2/i.test(text)) return "M.2";
  if (/sata/i.test(text)) return "SATA";
  return "Unknown";
}

function splitSerials(value: string) {
  return value
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildImportUnits(rows: ImportRow[], mapping: ImportMapping) {
  return rows.flatMap<ImportUnit>((row) => {
    const qty = Number(row.qty || row.accepted_qty || row.received_qty || 1);
    const normalizedQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
    const serialField = row[mapping.barcode] || row.serial_no || row.barcode || row.item_code || "";
    const serials = splitSerials(serialField);

    return Array.from({ length: normalizedQty }, (_, idx) => ({
      source: row,
      serial: serials[idx] || "",
      unitIndex: idx + 1,
      unitsInRow: normalizedQty,
    }));
  });
}

export function ReceivingImportLot() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(1);
  const [rawRows, setRawRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [supplier, setSupplier] = useState(state.suppliers[0]?.name || "");
  const [lotNumber, setLotNumber] = useState(`ALM-LOT-${new Date().toISOString().slice(0, 7).replace("-", "")}-01`);
  const [totalCost, setTotalCost] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>({
    barcode: "serial_no",
    brand: "brand",
    model: "item_name",
    cost: "valuation_rate",
    ramType: "ram_type",
    ramCapacityGb: "ram_gb",
    ssdType: "ssd_type",
    ssdCapacityGb: "ssd_gb",
    graphicsType: "gpu_type",
  });
  const [defaultRamType, setDefaultRamType] = useState("DDR4");
  const [defaultRamCapacityGb, setDefaultRamCapacityGb] = useState(16);
  const [defaultSsdType, setDefaultSsdType] = useState("NVMe");
  const [defaultSsdCapacityGb, setDefaultSsdCapacityGb] = useState(256);
  const [defaultGraphicsType, setDefaultGraphicsType] = useState<"GPU" | "iGPU">("iGPU");
  const requiredMapped = Object.values(mapping).every((v) => v && v.trim().length > 0);
  const missingMappings = Object.entries(mapping)
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([key]) => key);

  const { run: logCommit } = useIdempotentAction("import-lot-commit", "lot");
  const { trigger } = useUiActionFeedback();

  const previewRows = useMemo<ImportPreviewRow[]>(() => {
    const seen = new Set<string>();
    const existing = new Set(state.laptops.map((l) => l.barcode.toUpperCase()));
    const units = buildImportUnits(rawRows, mapping);

    return units.map((unit) => {
      const r = unit.source;
      const canonical = extractReceivingCanonicalFields(r);
      const itemName = (canonical.model || r[mapping.model] || r.item_name || r.model || r.description || "").trim();
      const desc = (r.description || "").trim();
      const itemCode = (r.item_code || itemName || "ITEM").replace(/\s+/g, "-");
      const generated = `${itemCode}-${String(unit.unitIndex).padStart(4, "0")}`;
      const canonicalSerial = splitSerials(canonical.serialNumber)[0] || "";
      const barcode = (unit.serial || canonicalSerial || generated).trim();
      const normalized = barcode.toUpperCase();
      const brand = (canonical.brand || r[mapping.brand] || itemName.split(/[-\s]/)[0] || "").trim();
      const model = itemName || canonical.model || (r[mapping.model] || "").trim();
      const cost = Number(canonical.purchasePrice || r[mapping.cost] || r.rate || r.net_rate || r.cost || 0);
      const mappedRamType = (canonical.memoryType || r[mapping.ramType] || "").trim();
      const mappedRamCapacity = (canonical.ramSize || r[mapping.ramCapacityGb] || "").trim();
      const mappedSsdType = (canonical.storageType || r[mapping.ssdType] || "").trim();
      const mappedSsdCapacity = (canonical.storageSize || r[mapping.ssdCapacityGb] || "").trim();
      const mappedGraphicsType = (r[mapping.graphicsType] || "").trim();
      const searchable = `${itemName} ${desc} ${mappedRamType} ${mappedRamCapacity} ${mappedSsdType} ${mappedSsdCapacity} ${mappedGraphicsType}`;
      const ramCapacityGb =
        parseCapacityGb(mappedRamCapacity) ||
        parseCapacityGb(searchable.match(/(\d+\s*(?:gb|tb))\s*ram/i)?.[1] || "") ||
        defaultRamCapacityGb;
      const ssdCapacityGb =
        parseCapacityGb(mappedSsdCapacity) ||
        parseCapacityGb(searchable.match(/(\d+\s*(?:gb|tb))\s*ssd/i)?.[1] || "") ||
        defaultSsdCapacityGb;
      const inferredRam = inferRamType(searchable);
      const inferredSsd = inferSsdType(searchable);
      const ramType = mappedRamType || (inferredRam !== "Unknown" ? inferredRam : defaultRamType);
      const ssdType = mappedSsdType || (inferredSsd !== "Unknown" ? inferredSsd : defaultSsdType);
      const graphicsType: "GPU" | "iGPU" = /^igpu$/i.test(mappedGraphicsType)
        ? "iGPU"
        : /^gpu$/i.test(mappedGraphicsType) || /\bgpu\b|nvidia|radeon|rtx|gtx/i.test(searchable)
          ? "GPU"
          : defaultGraphicsType;

      const canonicalErrors = validateReceivingCanonicalFields(canonical);
      let error = "";
      if (!barcode || !brand || !model) error = "Missing required fields";
      else if (canonicalErrors.length > 0) error = canonicalErrors[0];
      else if (existing.has(normalized)) error = "Barcode already exists";
      else if (seen.has(normalized)) error = "Duplicate barcode in file";

      seen.add(normalized);
      return {
        canonical,
        barcode,
        brand,
        model,
        cost,
        ramType,
        ramCapacityGb,
        ssdType,
        ssdCapacityGb,
        graphicsType,
        importMeta: {
          ...r,
          _unitIndex: String(unit.unitIndex),
          _unitsInRow: String(unit.unitsInRow),
          _serialUsed: unit.serial,
        },
        error,
      };
    });
  }, [
    rawRows,
    mapping,
    state.laptops,
    defaultRamType,
    defaultRamCapacityGb,
    defaultSsdType,
    defaultSsdCapacityGb,
    defaultGraphicsType,
  ]);

  const validRows = previewRows.filter((r) => !r.error);
  const invalidRows = previewRows.length - validRows.length;

  const receivingNextSteps = useMemo(() => {
    const tips: string[] = [];
    if (activeStep <= 1) {
      if (!supplier.trim()) tips.push("Select supplier name before moving to upload.");
      if (!lotNumber.trim()) tips.push("Enter a lot number to avoid commit blocking.");
      if (tips.length === 0) tips.push("Lot details are ready. Continue to Upload File.");
      return tips;
    }

    if (activeStep === 2) {
      if (!fileName) tips.push("Upload CSV first. Unit rows will be expanded automatically.");
      if (fileName && rawRows.length === 0)
        tips.push("CSV loaded but has no usable rows. Check header row and delimiters.");
      if (fileName && rawRows.length > 0) tips.push("Proceed to Map Columns and verify RAM/SSD/GPU fields.");
      return tips;
    }

    if (activeStep === 3) {
      if (missingMappings.length > 0) tips.push(`Complete missing mappings: ${missingMappings.join(", ")}.`);
      else tips.push("Mappings complete. Continue to preview for duplicate/missing barcode checks.");
      tips.push("Keep default RAM/SSD/GPU values for rows where supplier metadata is incomplete.");
      return tips;
    }

    if (activeStep === 4) {
      if (validRows.length === 0) tips.push("No valid rows found. Go back and fix mapping/data errors.");
      else tips.push(`Ready to import ${validRows.length} rows. ${invalidRows} row(s) still need correction.`);
      if (!lotNumber.trim()) tips.push("Set a lot number in Step 1 before import commit.");
      return tips;
    }

    return ["Follow guided import steps in order."];
  }, [activeStep, fileName, invalidRows, lotNumber, missingMappings, rawRows.length, supplier, validRows.length]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    file.text().then((text) => setRawRows(parseCsv(text)));
  };

  const exportInvalidRows = () => {
    const bad = previewRows.filter((row) => row.error);
    if (bad.length === 0) {
      trigger("warn", "No invalid rows to export");
      return;
    }
    const csv = invalidImportRowsToCsv(bad);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receiving-import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    trigger("success", `Exported ${bad.length} invalid row(s)`);
  };

  const handleCommit = () => {
    if (!lotNumber.trim()) {
      trigger("error", "Lot number is required");
      return;
    }
    if (!supplier.trim()) {
      trigger("error", "Supplier is required");
      return;
    }
    if (state.lots.some((l) => l.lot.toUpperCase() === lotNumber.trim().toUpperCase())) {
      trigger("error", `Lot ${lotNumber} already exists`);
      return;
    }
    if (validRows.length === 0) {
      trigger("error", "No valid rows to import");
      return;
    }

    const normalizedLot = lotNumber.trim();
    const computedLotCost =
      totalCost > 0 ? totalCost : Number(validRows.reduce((sum, row) => sum + row.cost, 0).toFixed(2));

    logCommit(normalizedLot, { validRows: validRows.length, totalRows: previewRows.length });
    dispatch({
      type: "ADD_LOT",
      payload: {
        lot: normalizedLot,
        supplier: supplier.trim(),
        received: new Date().toISOString().slice(0, 10),
        status: "Pending",
        items: validRows.length,
        verified: 0,
        graded: 0,
        cost: computedLotCost,
      },
    });
    validRows.forEach((r) => {
      const specs = `${r.ramCapacityGb}GB ${r.ramType} / ${r.ssdCapacityGb}GB ${r.ssdType} / ${r.graphicsType}`;
      const grade = (r.canonical.finalGrade || "B").trim().toUpperCase();
      dispatch({
        type: "ADD_LAPTOP",
        payload: {
          barcode: r.barcode,
          brand: r.brand,
          model: r.model,
          specs,
          grade: grade || "B",
          status: "Pending Verification",
          track: "-",
          cost: r.cost,
          date: new Date().toISOString().slice(0, 10),
          lot: normalizedLot,
          ramType: r.ramType,
          ramCapacityGb: r.ramCapacityGb,
          ssdType: r.ssdType,
          ssdCapacityGb: r.ssdCapacityGb,
          graphicsType: r.graphicsType,
          importMeta: {
            ...r.importMeta,
            ...Object.fromEntries(Object.entries(r.canonical).map(([k, v]) => [`canon_${k}`, v])),
          },
        },
      });
    });
    trigger("success", `Imported ${validRows.length} laptops into ${normalizedLot}`);
    setActiveStep(1);
    setRawRows([]);
    setFileName("");
  };

  return (
    <div data-page="receiving-import-lot" data-testid="page-receiving-import-lot" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan" style={{ fontFamily: "Orbitron" }}>
              IMPORT LOT
            </h1>
            <span className="cyber-chip cyber-badge-purple">WIZARD</span>
          </div>
          <p className="text-sm text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>
            Upload CSV • Map columns • Preview & import with error handling
          </p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <button
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${step.num === activeStep ? "bg-cyan-500/10 border border-cyan-500/30 neon-text-cyan" : "text-cyan-500/20"}`}
                onClick={() => setActiveStep(step.num)}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-cyan-500/10 border border-cyan-500/20">
                  {step.num}
                </span>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-bold tracking-wider" style={{ fontFamily: "Rajdhani" }}>
                    {step.label}
                  </p>
                </div>
              </button>
              {idx < steps.length - 1 && <div className="flex-1 h-[1px] mx-2 bg-cyan-500/10" />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 border border-emerald-500/20 bg-emerald-500/5">
        <p className="text-xs font-bold text-emerald-200 mb-2" style={{ fontFamily: "Rajdhani" }}>
          System suggested next steps
        </p>
        <div className="space-y-1.5">
          {receivingNextSteps.map((tip, idx) => (
            <p key={`${tip}-${idx}`} className="text-xs text-emerald-100/85">
              • {tip}
            </p>
          ))}
        </div>
      </div>

      {activeStep === 1 && (
        <div className="glass-card corner-marks p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>
                Supplier
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>
                Lot Number
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
              />
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>
                Default Graphics
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm"
                value={defaultGraphicsType}
                onChange={(e) => setDefaultGraphicsType(e.target.value as "GPU" | "iGPU")}
              >
                <option value="iGPU">Integrated GPU (iGPU)</option>
                <option value="GPU">Dedicated GPU</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] text-cyan-500/40" style={{ fontFamily: "Orbitron" }}>
                Total Cost
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg text-sm"
                value={totalCost || ""}
                onChange={(e) => setTotalCost(Number(e.target.value))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-cyan-500/40 mb-1" style={{ fontFamily: "Orbitron" }}>
                    Default RAM Type
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    value={defaultRamType}
                    onChange={(e) => setDefaultRamType(e.target.value)}
                  >
                    <option>DDR3</option>
                    <option>DDR4</option>
                    <option>DDR5</option>
                    <option>LPDDR4</option>
                    <option>LPDDR5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-500/40 mb-1" style={{ fontFamily: "Orbitron" }}>
                    Default RAM (GB)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    value={defaultRamCapacityGb}
                    onChange={(e) => setDefaultRamCapacityGb(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-500/40 mb-1" style={{ fontFamily: "Orbitron" }}>
                    Default SSD Type
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    value={defaultSsdType}
                    onChange={(e) => setDefaultSsdType(e.target.value)}
                  >
                    <option>NVMe</option>
                    <option>M.2</option>
                    <option>SATA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-500/40 mb-1" style={{ fontFamily: "Orbitron" }}>
                    Default SSD (GB)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    value={defaultSsdCapacityGb}
                    onChange={(e) => setDefaultSsdCapacityGb(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button className="btn-cyber" onClick={() => setActiveStep(2)}>
              Next → Upload
            </button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="glass-card corner-marks p-6">
          <input type="file" accept=".csv" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          {fileName && (
            <p className="text-xs text-cyan-300/40 mt-2">
              Loaded: {fileName} ({rawRows.length} source rows, {previewRows.length} unit rows)
            </p>
          )}
          <div className="flex justify-between mt-6">
            <button className="btn-ghost" onClick={() => setActiveStep(1)}>
              ← Back
            </button>
            <button className="btn-cyber" onClick={() => setActiveStep(3)}>
              Next → Map
            </button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="glass-card corner-marks p-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(mapping).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-cyan-100/60" style={{ fontFamily: "Share Tech Mono" }}>
                  {key}
                </span>
                <input
                  className="px-3 py-2 rounded-lg text-sm"
                  value={val}
                  onChange={(e) => setMapping((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button className="btn-ghost" onClick={() => setActiveStep(2)}>
              ← Back
            </button>
            <button className="btn-cyber" disabled={!requiredMapped} onClick={() => setActiveStep(4)}>
              Next → Preview
            </button>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="glass-card corner-marks p-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-3">Barcode</th>
                <th className="py-2 px-3">Brand</th>
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3">Specs</th>
                <th className="py-2 px-3">Cost</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 neon-text-cyan" style={{ fontFamily: "Share Tech Mono" }}>
                    {r.barcode || "—"}
                  </td>
                  <td className="py-2 px-3">{r.brand}</td>
                  <td className="py-2 px-3">{r.model}</td>
                  <td className="py-2 px-3">
                    {r.ramCapacityGb}GB {r.ramType} / {r.ssdCapacityGb}GB {r.ssdType} / {r.graphicsType}
                  </td>
                  <td className="py-2 px-3">AED {r.cost}</td>
                  <td className="py-2 px-3">{r.error || "Valid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-cyan-400/50">
              Valid: {validRows.length} / {previewRows.length}
            </p>
            <button type="button" className="btn-ghost" onClick={exportInvalidRows}>
              Export Invalid Rows CSV
            </button>
          </div>
          <div className="flex justify-between mt-6">
            <button className="btn-ghost" onClick={() => setActiveStep(3)}>
              ← Back
            </button>
            <button data-testid="import-commit" className="btn-cyber" onClick={handleCommit}>
              ✓ Import {validRows.length} Rows
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
