// ═══════════════════════════════════════════
// TAHIR ERP — Centralized App State Store
// Client-side state management for all modules
//
// NOTE: This is an in-browser store used for the demo build.
// It enforces key integrity rules (stock invariants, WIP allocation)
// and records movement/audit logs for critical operations.
// ═══════════════════════════════════════════

import { laptopTable, partTable, activityFeed, alertList } from "@/data/mockData";
import { makeSequenceGenerator, computeVat, canAdvance, trackStages } from "@/domain";
import { canTransitionLaptopStatus, canTransitionLotStatus } from "@/domain/statusTransitions";

// ── Sequence Generators ──
const seqLaptop = makeSequenceGenerator("laptop");
const seqPart = makeSequenceGenerator("part");
const seqLot = makeSequenceGenerator("lot");
const seqWip = makeSequenceGenerator("wip");
const seqInvoice = makeSequenceGenerator("invoice");
const seqPurchase = makeSequenceGenerator("purchase");
const seqReceipt = makeSequenceGenerator("receipt");
const seqPayment = makeSequenceGenerator("payment");

export const generators = {
  laptop: seqLaptop,
  part: seqPart,
  lot: seqLot,
  wip: seqWip,
  invoice: seqInvoice,
  purchase: seqPurchase,
  receipt: seqReceipt,
  payment: seqPayment,
};

// ── Types ──
export type LaptopRecord = typeof laptopTable[0] & {
  id: string;
  selected?: boolean;
  lot?: string;
  testResult?: string;
  ramType?: string;
  ramCapacityGb?: number;
  ssdType?: string;
  ssdCapacityGb?: number;
  graphicsType?: "GPU" | "iGPU";
  importMeta?: Record<string, string>;
};

export type PartRecord = typeof partTable[0] & {
  id: string;
  /** Reserved quantity (allocated to WIP, etc.) */
  reserved?: number;
};

export type WipRecord = {
  id: string;
  wip: string;
  laptop: string;
  brand: string;
  track: string;
  stage: string;
  assignedTo: string;
  partsUsed: number;
  partsCost: number;
  laborHrs: number;
  priority: string;
  status: string;
  opened: string;
  diagnosisNotes: string;
  parts: { name: string; barcode: string; cost: number }[];
  laborEntries: { tech: string; hours: number; rate: number; date: string }[];
  history: { ts: string; action: string; user: string }[];
};

export type SaleRecord = {
  id: string;
  invoice: string;
  date: string;
  customer: string;
  items: number;
  subtotal: number;
  vat: number;
  total: number;
  profit: number;
  status: string;
  method: string;
  lineItems: { barcode: string; name: string; price: number; cost: number; profit: number }[];
};

export type ReceiptRecord = {
  id: string;
  receipt: string;
  date: string;
  invoice: string;
  amount: number;
  method: string;
  reference: string;
};

export type PurchaseRecord = {
  id: string;
  purchase: string;
  date: string;
  supplier: string;
  lot: string;
  subtotal: number;
  vat: number;
  total: number;
  paid: string;
  status: string;
};

export type PaymentRecord = {
  id: string;
  payment: string;
  date: string;
  supplier: string;
  purchase: string;
  amount: number;
  method: string;
  reference: string;
};

export type CashEntry = {
  id: string;
  time: string;
  type: string;
  desc: string;
  amount: number;
  balance: number;
};

export type OwnerEntry = {
  id: string;
  date: string;
  type: string;
  desc: string;
  amount: number;
  balance: number;
};

export type SupplierRecord = {
  id: string;
  name: string;
  contact: string;
  email: string;
  trn: string;
  lots: number;
  status: string;
};

export type LotRecord = {
  id: string;
  lot: string;
  supplier: string;
  received: string;
  status: string;
  items: number;
  verified: number;
  graded: number;
  cost: number;
  verificationNotes?: string;
};

export type ActivityItem = { action: string; time: string };
export type AlertItem = { id: string; title: string; description: string; tone: string };

export type NotificationItem = {
  id: string;
  tone: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type SearchResult = {
  type: "laptop" | "part" | "supplier" | "lot" | "sale" | "wip";
  id: string;
  label: string;
  barcode?: string;
  status?: string;
};

export type MovementLogRecord = {
  id: string;
  ts: string;
  entityType: "laptop" | "part" | "wip" | "sale" | "receipt" | "purchase" | "payment" | "lot" | "settings";
  entityId: string;
  ref?: string;
  action: string;
  from?: string;
  to?: string;
  qty?: number;
  note?: string;
  user: string;
};

export type AuditLogRecord = {
  id: string;
  ts: string;
  entityType: MovementLogRecord["entityType"];
  entityId: string;
  ref?: string;
  action: string;
  payload?: Record<string, unknown>;
  user: string;
};

// ── Settings ──
export type AppSettings = {
  companyName: string;
  trn: string;
  address: string;
  currency: string;
  vatRate: number;
  laborRate: number;
  techRate: number;
  reorderLevel: number;
  dateFormat: string;
};

// ── Root State ──
export type AppState = {
  laptops: LaptopRecord[];
  parts: PartRecord[];
  wipJobs: WipRecord[];
  sales: SaleRecord[];
  receipts: ReceiptRecord[];
  purchases: PurchaseRecord[];
  payments: PaymentRecord[];
  cashEntries: CashEntry[];
  ownerEntries: OwnerEntry[];
  suppliers: SupplierRecord[];
  lots: LotRecord[];
  activity: ActivityItem[];
  alerts: AlertItem[];
  notifications: NotificationItem[];
  movementLog: MovementLogRecord[];
  auditLog: AuditLogRecord[];
  settings: AppSettings;
  cashDayOpen: boolean;
  searchResults: SearchResult[];
};

// ── Helpers ──
function uid() {
  return crypto.randomUUID();
}
const isoDate = () => new Date().toISOString().slice(0, 10);

function nowTs() {
  return new Date().toISOString();
}

function systemUser() {
  return "admin";
}

function deriveReserved(onHand: number, available: number | undefined) {
  const avail = typeof available === "number" ? available : onHand;
  return Math.max(0, onHand - avail);
}




function getTrackKey(trackLabel: string): keyof typeof trackStages | null {
  const m = /Track\s*([A-E])/i.exec(trackLabel);
  if (!m) return null;
  const key = m[1].toUpperCase() as keyof typeof trackStages;
  return key in trackStages ? key : null;
}

export function buildTrackEFollowupFromFailedTesting(wip: WipRecord): WipRecord {
  return {
    id: uid(),
    wip: generators.wip(new Date()),
    laptop: wip.laptop,
    brand: wip.brand,
    track: "Track E",
    stage: "Queue",
    assignedTo: "Unassigned",
    partsUsed: 0,
    partsCost: 0,
    laborHrs: 0,
    priority: "High",
    status: "Active",
    opened: new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    diagnosisNotes: `Auto-created from failed testing (${wip.wip})`,
    parts: [],
    laborEntries: [],
    history: [
      { ts: new Date().toLocaleString(), action: `Auto-created from ${wip.wip} after L2 Failed`, user: systemUser() },
    ],
  };
}

function isVerifiedStatus(status: string) {
  return status !== "Pending Verification";
}

function isGradedStatus(status: string) {
  return !["Pending Verification", "Pending Grading"].includes(status);
}


function deriveLotLifecycleStatus(lotLaptops: LaptopRecord[]) {
  const items = lotLaptops.length;
  if (items === 0) return "Pending";

  const verified = lotLaptops.filter((l) => isVerifiedStatus(l.status)).length;
  const graded = lotLaptops.filter((l) => isGradedStatus(l.status)).length;

  if (verified === 0) return "Pending";
  if (verified < items) return "Partially Verified";
  if (graded === 0) return "Verified";
  if (graded < items) return "Partially Graded";

  const settledStatuses = new Set(["Ready for Sale", "Sold", "Scrapped", "Missing", "Disposed"]);
  const completed = lotLaptops.every((l) => settledStatuses.has(l.status));
  return completed ? "Completed" : "Fully Graded";
}

function recalculateLotCounters(lotNumber: string, laptops: LaptopRecord[], currentLot: LotRecord) {
  const lotLaptops = laptops.filter((l) => l.lot === lotNumber);
  if (lotLaptops.length === 0) return currentLot;

  const items = lotLaptops.length;
  const verified = lotLaptops.filter((l) => isVerifiedStatus(l.status)).length;
  const graded = lotLaptops.filter((l) => isGradedStatus(l.status)).length;
  const status = deriveLotLifecycleStatus(lotLaptops);

  return {
    ...currentLot,
    items,
    verified,
    graded,
    status,
  };
}

function syncSupplierLotsFromLots(suppliers: SupplierRecord[], lots: LotRecord[]) {
  return suppliers.map((supplier) => ({
    ...supplier,
    lots: lots.filter((lot) => lot.supplier === supplier.name).length,
  }));
}

function reconcileSalesStatuses(sales: SaleRecord[], receipts: ReceiptRecord[]) {
  return sales.map((sale) => {
    const paidAmount = receipts
      .filter((r) => r.invoice === sale.invoice)
      .reduce((sum, r) => sum + r.amount, 0);
    const dueAmount = Math.max(0, sale.total - paidAmount);
    const status = dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";
    return { ...sale, status };
  });
}

function normalizePart(part: PartRecord): PartRecord {
  const reserved = typeof part.reserved === "number" ? part.reserved : deriveReserved(part.onHand, part.available);
  const onHand = Math.max(0, part.onHand);
  const safeReserved = Math.max(0, Math.min(reserved, onHand));
  const available = onHand - safeReserved;
  return {
    ...part,
    onHand,
    reserved: safeReserved,
    available,
  };
}


function recalculateCashLedger(entries: CashEntry[]) {
  const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));
  let running = 0;
  return sorted.map((entry) => {
    const normalizedAmount =
      entry.type === "Cash Out" || entry.type === "Adjustment"
        ? -Math.abs(entry.amount)
        : entry.type === "Cash In"
          ? Math.abs(entry.amount)
          : entry.type === "Opening" || entry.type === "Closing"
            ? 0
            : entry.amount;

    if (entry.type === "Opening") {
      running = entry.balance;
      return { ...entry, amount: 0, balance: running };
    }

    if (entry.type === "Closing") {
      return { ...entry, amount: 0, balance: running };
    }

    running += normalizedAmount;
    return { ...entry, amount: normalizedAmount, balance: running };
  });
}

function recalculateOwnerLedger(entries: OwnerEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  return sorted.map((entry) => {
    const normalizedAmount = entry.type === "Drawing" ? -Math.abs(entry.amount) : Math.abs(entry.amount);
    running += normalizedAmount;
    return { ...entry, amount: normalizedAmount, balance: running };
  });
}

function appendLogs(
  state: AppState,
  movement?: Omit<MovementLogRecord, "id" | "ts" | "user">,
  audit?: Omit<AuditLogRecord, "id" | "ts" | "user">
): Pick<AppState, "movementLog" | "auditLog"> {
  const user = systemUser();
  const ts = nowTs();
  return {
    movementLog: movement
      ? [{ ...movement, id: uid(), ts, user }, ...state.movementLog].slice(0, 1000)
      : state.movementLog,
    auditLog: audit ? [{ ...audit, id: uid(), ts, user }, ...state.auditLog].slice(0, 1000) : state.auditLog,
  };
}

// ── Initial State (seeded from mock) ──
export function createInitialState(): AppState {
  const laptops: LaptopRecord[] = laptopTable.map((l, idx) => ({
    ...l,
    id: uid(),
    lot: idx % 2 === 0 ? "ALM-LOT-202401-05" : "ALM-LOT-202401-06",
    status: idx === 0 ? "Pending Verification" : idx === 1 ? "Pending Grading" : l.status,
  }));

  const parts: PartRecord[] = partTable.map((p) =>
    normalizePart({
      ...p,
      id: uid(),
      reserved: deriveReserved(p.onHand, p.available),
    })
  );

  // Wire seeded WIP to *real* seeded laptop/part barcodes.
  const laptop0 = laptops[0];
  const laptop1 = laptops[1];
  const part0 = parts[0];
  const part2 = parts[2];

  const wipJobs: WipRecord[] = [
    {
      id: uid(),
      wip: "ALM-WIP-20240115-0001",
      laptop: laptop0?.barcode ?? "ALM-LP-UNKNOWN",
      brand: laptop0 ? `${laptop0.brand} ${laptop0.model}` : "Dell Latitude 5420",
      track: "Track C",
      stage: "Diagnosis",
      assignedTo: "Tech A",
      partsUsed: 2,
      partsCost: (part0?.cost ?? 0) + (part2?.cost ?? 0),
      laborHrs: 2.5,
      priority: "High",
      status: "In Progress",
      opened: "Jan 15",
      diagnosisNotes: "",
      parts: [
        { name: part0?.name ?? "Battery Pack", barcode: part0?.barcode ?? "", cost: part0?.cost ?? 0 },
        { name: part2?.name ?? "SSD Drive", barcode: part2?.barcode ?? "", cost: part2?.cost ?? 0 },
      ],
      laborEntries: [{ tech: "Tech A", hours: 2.5, rate: 50, date: isoDate() }],
      history: [{ ts: "Jan 15, 16:00", action: "WIP Job created", user: "admin" }],
    },
    {
      id: uid(),
      wip: "ALM-WIP-20240115-0002",
      laptop: laptop1?.barcode ?? "ALM-LP-UNKNOWN",
      brand: laptop1 ? `${laptop1.brand} ${laptop1.model}` : "HP EliteBook 840",
      track: "Track A",
      stage: "Cleaning",
      assignedTo: "Tech B",
      partsUsed: 0,
      partsCost: 0,
      laborHrs: 1,
      priority: "Normal",
      status: "Active",
      opened: "Jan 16",
      diagnosisNotes: "",
      parts: [],
      laborEntries: [],
      history: [{ ts: "Jan 16, 09:00", action: "WIP Job created", user: "admin" }],
    },
  ];

  const movementLog: MovementLogRecord[] = [
    {
      id: uid(),
      ts: nowTs(),
      entityType: "lot",
      entityId: "seed",
      ref: "ALM-LOT-202401-05",
      action: "seed",
      note: "Seeded demo data",
      user: systemUser(),
    },
  ];

  const auditLog: AuditLogRecord[] = [
    {
      id: uid(),
      ts: nowTs(),
      entityType: "settings",
      entityId: "seed",
      ref: "settings",
      action: "seed",
      payload: { demo: true },
      user: systemUser(),
    },
  ];

  return {
    laptops,
    parts,
    wipJobs,
    sales: [
      {
        id: uid(),
        invoice: "ALM-INV-202401-0045",
        date: "2024-01-16",
        customer: "Walk-in",
        items: 2,
        subtotal: 2550,
        vat: 127.5,
        total: 2677.5,
        profit: 750,
        status: "Paid",
        method: "Cash",
        lineItems: [],
      },
      {
        id: uid(),
        invoice: "ALM-INV-202401-0046",
        date: "2024-01-17",
        customer: "TechCorp LLC",
        items: 1,
        subtotal: 1350,
        vat: 67.5,
        total: 1417.5,
        profit: 400,
        status: "Paid",
        method: "Transfer",
        lineItems: [],
      },
    ],
    receipts: [
      {
        id: uid(),
        receipt: "ALM-RC-202401-0010",
        date: "2024-01-16",
        invoice: "ALM-INV-202401-0045",
        amount: 2677.5,
        method: "Cash",
        reference: "",
      },
      {
        id: uid(),
        receipt: "ALM-RC-202401-0011",
        date: "2024-01-17",
        invoice: "ALM-INV-202401-0046",
        amount: 1417.5,
        method: "Transfer",
        reference: "FT-9982",
      },
    ],
    purchases: [
      {
        id: uid(),
        purchase: "ALM-PO-202401-0007",
        date: "2024-01-15",
        supplier: "Global IT",
        lot: "ALM-LOT-202401-05",
        subtotal: 8500,
        vat: 425,
        total: 8925,
        paid: "Paid",
        status: "Closed",
      },
      {
        id: uid(),
        purchase: "ALM-PO-202401-0008",
        date: "2024-01-18",
        supplier: "PartsHub",
        lot: "-",
        subtotal: 620,
        vat: 31,
        total: 651,
        paid: "Due",
        status: "Open",
      },
    ],
    payments: [
      {
        id: uid(),
        payment: "ALM-PAY-202401-0004",
        date: "2024-01-16",
        supplier: "Global IT",
        purchase: "ALM-PO-202401-0007",
        amount: 8925,
        method: "Transfer",
        reference: "FT-7721",
      },
    ],
    cashEntries: [
      {
        id: uid(),
        time: "08:00",
        type: "Opening",
        desc: "Daily opening balance",
        amount: 1500,
        balance: 1500,
      },
      {
        id: uid(),
        time: "09:15",
        type: "Cash In",
        desc: "Sale ALM-INV-202401-0045",
        amount: 2677.5,
        balance: 4177.5,
      },
    ],
    ownerEntries: [
      { id: uid(), date: "2024-01-01", type: "Investment", desc: "Initial capital injection", amount: 50000, balance: 50000 },
      { id: uid(), date: "2024-01-15", type: "Profit", desc: "January profit", amount: 15200, balance: 65200 },
    ],
    suppliers: [
      {
        id: uid(),
        name: "Global IT Solutions",
        contact: "+971 50 123 4567",
        email: "ops@globalit.com",
        trn: "100200300400005",
        lots: 3,
        status: "Active",
      },
      {
        id: uid(),
        name: "PartsHub Trading",
        contact: "+971 55 222 8899",
        email: "sales@partshub.ae",
        trn: "100200300400006",
        lots: 1,
        status: "Active",
      },
    ],
    lots: [
      {
        id: uid(),
        lot: "ALM-LOT-202401-05",
        supplier: "Global IT",
        received: "2024-01-15",
        status: "Verified",
        items: 24,
        verified: 24,
        graded: 20,
        cost: 20400,
      },
      {
        id: uid(),
        lot: "ALM-LOT-202401-06",
        supplier: "PartsHub",
        received: "2024-01-18",
        status: "Pending",
        items: 18,
        verified: 0,
        graded: 0,
        cost: 14400,
      },
    ],
    activity: [...activityFeed],
    alerts: [...alertList],
    notifications: [],
    movementLog,
    auditLog,
    settings: {
      companyName: "Tahir ERP",
      trn: "100200300400005",
      address: "Dubai, UAE",
      currency: "AED",
      vatRate: 5,
      laborRate: 50,
      techRate: 65,
      reorderLevel: 5,
      dateFormat: "DD/MM/YYYY",
    },
    cashDayOpen: true,
    searchResults: [],
  };
}

// ── Actions / Mutations ──
export type Action =
  | { type: "ADD_LAPTOP"; payload: Omit<LaptopRecord, "id"> }
  | { type: "UPDATE_LAPTOP"; id: string; payload: Partial<LaptopRecord> }
  | { type: "DELETE_LAPTOP"; id: string }
  | { type: "ADD_PART"; payload: Omit<PartRecord, "id"> }
  | { type: "UPDATE_PART"; id: string; payload: Partial<PartRecord> }
  | { type: "PART_ADJUST_STOCK"; id: string; delta: number; reason: string }
  | { type: "ADD_SALE"; payload: Omit<SaleRecord, "id"> }
  | { type: "DELETE_SALE"; id: string }
  | { type: "ADD_RECEIPT"; payload: Omit<ReceiptRecord, "id"> }
  | { type: "DELETE_RECEIPT"; id: string }
  | { type: "ADD_PURCHASE"; payload: Omit<PurchaseRecord, "id"> }
  | { type: "UPDATE_PURCHASE"; id: string; payload: Partial<PurchaseRecord> }
  | { type: "ADD_PAYMENT"; payload: Omit<PaymentRecord, "id"> }
  | { type: "DELETE_PAYMENT"; id: string }
  | { type: "ADD_CASH_ENTRY"; payload: Omit<CashEntry, "id"> }
  | { type: "DELETE_CASH_ENTRY"; id: string }
  | { type: "ADD_OWNER_ENTRY"; payload: Omit<OwnerEntry, "id"> }
  | { type: "DELETE_OWNER_ENTRY"; id: string }
  | { type: "ADD_SUPPLIER"; payload: Omit<SupplierRecord, "id"> }
  | { type: "UPDATE_SUPPLIER"; id: string; payload: Partial<SupplierRecord> }
  | { type: "DELETE_SUPPLIER"; id: string }
  | { type: "ADD_LOT"; payload: Omit<LotRecord, "id"> }
  | { type: "UPDATE_LOT"; id: string; payload: Partial<LotRecord> }
  | { type: "DELETE_LOT"; id: string }
  | { type: "ADD_WIP"; payload: Omit<WipRecord, "id"> }
  | { type: "UPDATE_WIP"; id: string; payload: Partial<WipRecord> }
  | { type: "WIP_MOVE_STAGE"; wipId: string; toStage: string }
  | { type: "WIP_ADD_PART"; wipId: string; partBarcode: string }
  | { type: "WIP_REMOVE_PART"; wipId: string; index: number }
  | { type: "WIP_ADD_LABOR"; wipId: string; tech: string; hours: number }
  | { type: "WIP_UPDATE_DIAGNOSIS"; wipId: string; notes: string }
  | { type: "WIP_COMPLETE"; wipId: string }
  | { type: "ADD_ACTIVITY"; payload: ActivityItem }
  | { type: "SET_ACTIVITY"; payload: ActivityItem[] }
  | { type: "CLEAR_ACTIVITY" }
  | { type: "CLEAR_ALERT"; id: string }
  | { type: "ADD_NOTIFICATION"; payload: Omit<NotificationItem, "id"> }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "TOGGLE_CASH_DAY" }
  | { type: "GLOBAL_SEARCH"; query: string }
  | { type: "RESTORE_STATE"; payload: AppState }
  | { type: "RESET_STATE" };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_LAPTOP": {
      const exists = state.laptops.some((l) => l.barcode.toUpperCase() === action.payload.barcode.toUpperCase());
      if (exists) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Duplicate barcode", description: `${action.payload.barcode} already exists`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const record: LaptopRecord = { ...action.payload, id: uid() };
      const nextLaptops = [...state.laptops, record];
      const nextLots = record.lot
        ? state.lots.map((lot) => (lot.lot === record.lot ? recalculateLotCounters(lot.lot, nextLaptops, lot) : lot))
        : state.lots;
      const logs = appendLogs(
        state,
        { entityType: "laptop", entityId: record.id, ref: record.barcode, action: "create" },
        { entityType: "laptop", entityId: record.id, ref: record.barcode, action: "create", payload: { ...action.payload } }
      );
      return {
        ...state,
        ...logs,
        laptops: nextLaptops,
        lots: nextLots,
      };
    }
    case "UPDATE_LAPTOP": {
      const before = state.laptops.find((l) => l.id === action.id);
      if (before && action.payload.status && !canTransitionLaptopStatus(before.status, action.payload.status)) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Invalid laptop transition", description: `${before.status} → ${action.payload.status} is not allowed`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }
      const nextLaptops = state.laptops.map((l) => (l.id === action.id ? { ...l, ...action.payload } : l));
      const after = nextLaptops.find((l) => l.id === action.id);
      const impactedLots = new Set([before?.lot, after?.lot].filter(Boolean));
      const nextLots = state.lots.map((lot) => (impactedLots.has(lot.lot) ? recalculateLotCounters(lot.lot, nextLaptops, lot) : lot));
      const logs = before && after
        ? appendLogs(
            state,
            {
              entityType: "laptop",
              entityId: action.id,
              ref: before.barcode,
              action: "update",
              from: before.status,
              to: after.status,
            },
            {
              entityType: "laptop",
              entityId: action.id,
              ref: before.barcode,
              action: "update",
              payload: { ...action.payload },
            }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, laptops: nextLaptops, lots: nextLots };
    }
    case "DELETE_LAPTOP": {
      const before = state.laptops.find((l) => l.id === action.id);
      const nextLaptops = state.laptops.filter((l) => l.id !== action.id);
      const nextLots = before?.lot
        ? state.lots.map((lot) => (lot.lot === before.lot ? recalculateLotCounters(lot.lot, nextLaptops, lot) : lot))
        : state.lots;
      const logs = before
        ? appendLogs(
            state,
            { entityType: "laptop", entityId: action.id, ref: before.barcode, action: "delete" },
            { entityType: "laptop", entityId: action.id, ref: before.barcode, action: "delete" }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, laptops: nextLaptops, lots: nextLots };
    }

    case "ADD_PART": {
      const record = normalizePart({ ...action.payload, id: uid() } as PartRecord);
      const logs = appendLogs(
        state,
        { entityType: "part", entityId: record.id, ref: record.barcode, action: "create" },
        { entityType: "part", entityId: record.id, ref: record.barcode, action: "create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, parts: [...state.parts, record] };
    }
    case "UPDATE_PART": {
      const before = state.parts.find((p) => p.id === action.id);
      const nextParts = state.parts.map((p) => (p.id === action.id ? normalizePart({ ...p, ...action.payload } as PartRecord) : p));
      const after = nextParts.find((p) => p.id === action.id);
      const logs = before && after
        ? appendLogs(
            state,
            {
              entityType: "part",
              entityId: action.id,
              ref: before.barcode,
              action: "update",
              from: `${before.onHand}/${before.reserved ?? 0}/${before.available}`,
              to: `${after.onHand}/${after.reserved ?? 0}/${after.available}`,
            },
            { entityType: "part", entityId: action.id, ref: before.barcode, action: "update", payload: { ...action.payload } }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, parts: nextParts };
    }
    case "PART_ADJUST_STOCK": {
      const before = state.parts.find((p) => p.id === action.id);
      if (!before) return state;

      const next = normalizePart({
        ...before,
        onHand: before.onHand + action.delta,
      } as PartRecord);

      // Invariant: onHand cannot go below reserved.
      if ((next.reserved ?? 0) > next.onHand) {
        return {
          ...state,
          alerts: [
            {
              id: uid(),
              title: "Stock adjustment blocked",
              description: `Cannot reduce on-hand below reserved for ${before.barcode}`,
              tone: "red",
            },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const logs = appendLogs(
        state,
        {
          entityType: "part",
          entityId: before.id,
          ref: before.barcode,
          action: "stock_adjust",
          qty: action.delta,
          from: `onHand=${before.onHand}`,
          to: `onHand=${next.onHand}`,
          note: action.reason,
        },
        {
          entityType: "part",
          entityId: before.id,
          ref: before.barcode,
          action: "stock_adjust",
          payload: { delta: action.delta, reason: action.reason },
        }
      );

      return {
        ...state,
        ...logs,
        parts: state.parts.map((p) => (p.id === before.id ? next : p)),
        activity: [
          { action: `Stock adjust ${before.barcode}: ${action.delta} (${action.reason})`, time: "just now" },
          ...state.activity,
        ].slice(0, 50),
      };
    }

    case "ADD_SALE": {
      const sale = { ...action.payload, id: uid() };
      const logs = appendLogs(
        state,
        { entityType: "sale", entityId: sale.id, ref: sale.invoice, action: "create" },
        { entityType: "sale", entityId: sale.id, ref: sale.invoice, action: "create", payload: { ...action.payload } }
      );
      return {
        ...state,
        ...logs,
        sales: [...state.sales, sale],
        activity: [{ action: `Sale ${sale.invoice} completed for AED ${sale.total.toFixed(2)}`, time: "just now" }, ...state.activity].slice(0, 50),
      };
    }
    case "DELETE_SALE": {
      const before = state.sales.find((s) => s.id === action.id);
      const logs = before
        ? appendLogs(
            state,
            { entityType: "sale", entityId: before.id, ref: before.invoice, action: "delete" },
            { entityType: "sale", entityId: before.id, ref: before.invoice, action: "delete" }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, sales: state.sales.filter((s) => s.id !== action.id) };
    }

    case "ADD_RECEIPT": {
      const receipt = { ...action.payload, id: uid() };
      const nextReceipts = [...state.receipts, receipt];
      const logs = appendLogs(
        state,
        { entityType: "receipt", entityId: receipt.id, ref: receipt.receipt, action: "create" },
        { entityType: "receipt", entityId: receipt.id, ref: receipt.receipt, action: "create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, receipts: nextReceipts, sales: reconcileSalesStatuses(state.sales, nextReceipts) };
    }
    case "DELETE_RECEIPT": {
      const before = state.receipts.find((r) => r.id === action.id);
      const nextReceipts = state.receipts.filter((r) => r.id !== action.id);
      const logs = before
        ? appendLogs(
            state,
            { entityType: "receipt", entityId: before.id, ref: before.receipt, action: "delete" },
            { entityType: "receipt", entityId: before.id, ref: before.receipt, action: "delete" }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, receipts: nextReceipts, sales: reconcileSalesStatuses(state.sales, nextReceipts) };
    }

    case "ADD_PURCHASE": {
      const purchase = { ...action.payload, id: uid() };
      const supplierExists = state.suppliers.some((s) => s.name === purchase.supplier);
      const nextSuppliersBase = supplierExists
        ? state.suppliers
        : [
            ...state.suppliers,
            { id: uid(), name: purchase.supplier, contact: "", email: "", trn: "", lots: 0, status: "Active" },
          ];

      const hasLotRef = Boolean(purchase.lot && purchase.lot !== "-");
      const lotExists = hasLotRef ? state.lots.some((lot) => lot.lot === purchase.lot) : true;

      const lotsWithLinkedPurchase = lotExists
        ? state.lots.map((lot) =>
            lot.lot === purchase.lot ? { ...lot, supplier: purchase.supplier, cost: lot.cost + purchase.subtotal } : lot
          )
        : state.lots;

      const nextLots = hasLotRef && !lotExists
        ? [
            ...lotsWithLinkedPurchase,
            {
              id: uid(),
              lot: purchase.lot,
              supplier: purchase.supplier,
              received: purchase.date,
              status: "Pending",
              items: 0,
              verified: 0,
              graded: 0,
              cost: purchase.subtotal,
            },
          ]
        : lotsWithLinkedPurchase;

      const nextSuppliers = syncSupplierLotsFromLots(nextSuppliersBase, nextLots);

      const logs = appendLogs(
        state,
        { entityType: "purchase", entityId: purchase.id, ref: purchase.purchase, action: "create" },
        { entityType: "purchase", entityId: purchase.id, ref: purchase.purchase, action: "create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, purchases: [...state.purchases, purchase], lots: nextLots, suppliers: nextSuppliers };
    }
    case "UPDATE_PURCHASE": {
      const before = state.purchases.find((p) => p.id === action.id);
      const next = state.purchases.map((p) => (p.id === action.id ? { ...p, ...action.payload } : p));
      const after = next.find((p) => p.id === action.id);
      const logs = before && after
        ? appendLogs(
            state,
            { entityType: "purchase", entityId: action.id, ref: before.purchase, action: "update", from: before.paid, to: after.paid },
            { entityType: "purchase", entityId: action.id, ref: before.purchase, action: "update", payload: { ...action.payload } }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, purchases: next };
    }

    case "ADD_PAYMENT": {
      const nextPayments = [...state.payments, { ...action.payload, id: uid() }];
      const purchase = state.purchases.find((p) => p.purchase === action.payload.purchase);
      let nextPurchases = state.purchases;
      if (purchase) {
        const paidAmount = nextPayments.filter((p) => p.purchase === purchase.purchase).reduce((a, p) => a + p.amount, 0);
        const paidStatus = paidAmount >= purchase.total ? "Paid" : paidAmount > 0 ? "Partial" : "Due";
        const status = paidStatus === "Paid" ? "Closed" : "Open";
        nextPurchases = state.purchases.map((p) => (p.id === purchase.id ? { ...p, paid: paidStatus, status } : p));
      }
      const payment = nextPayments[nextPayments.length - 1];
      const logs = appendLogs(
        state,
        { entityType: "payment", entityId: payment.id, ref: payment.payment, action: "create" },
        { entityType: "payment", entityId: payment.id, ref: payment.payment, action: "create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, payments: nextPayments, purchases: nextPurchases };
    }

    case "DELETE_PAYMENT": {
      const payment = state.payments.find((p) => p.id === action.id);
      const nextPayments = state.payments.filter((p) => p.id !== action.id);
      let nextPurchases = state.purchases;
      if (payment) {
        const purchase = state.purchases.find((p) => p.purchase === payment.purchase);
        if (purchase) {
          const paidAmount = nextPayments.filter((p) => p.purchase === purchase.purchase).reduce((a, p) => a + p.amount, 0);
          const paidStatus = paidAmount >= purchase.total ? "Paid" : paidAmount > 0 ? "Partial" : "Due";
          const status = paidStatus === "Paid" ? "Closed" : "Open";
          nextPurchases = state.purchases.map((p) => (p.id === purchase.id ? { ...p, paid: paidStatus, status } : p));
        }
      }
      const logs = payment
        ? appendLogs(
            state,
            { entityType: "payment", entityId: payment.id, ref: payment.payment, action: "delete" },
            { entityType: "payment", entityId: payment.id, ref: payment.payment, action: "delete" }
          )
        : { movementLog: state.movementLog, auditLog: state.auditLog };
      return { ...state, ...logs, payments: nextPayments, purchases: nextPurchases };
    }

    case "ADD_CASH_ENTRY": {
      const entryType = action.payload.type;
      const requiresOpenDay = !["Opening", "Closing"].includes(entryType);
      if (requiresOpenDay && !state.cashDayOpen) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Cash day closed", description: "Open day before adding cash movements", tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      if (entryType === "Opening" && state.cashDayOpen) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Cash day already open", description: "Opening entry is only allowed when day is closed", tone: "yellow" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      if (entryType === "Closing" && !state.cashDayOpen) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Cash day already closed", description: "Closing entry requires an open day", tone: "yellow" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const entry = { ...action.payload, id: uid() };
      const logs = appendLogs(
        state,
        { entityType: "settings", entityId: entry.id, ref: "cash", action: "cash_entry", note: entry.desc },
        { entityType: "settings", entityId: entry.id, ref: "cash", action: "cash_entry", payload: { ...action.payload } }
      );
      const nextEntries = recalculateCashLedger([...state.cashEntries, entry]);
      return { ...state, ...logs, cashEntries: nextEntries };
    }
    case "DELETE_CASH_ENTRY": {
      const nextEntries = recalculateCashLedger(state.cashEntries.filter((e) => e.id !== action.id));
      return { ...state, cashEntries: nextEntries };
    }

    case "ADD_OWNER_ENTRY": {
      const normalizedAmount = action.payload.type === "Drawing" ? -Math.abs(action.payload.amount) : Math.abs(action.payload.amount);
      const entry = { ...action.payload, amount: normalizedAmount, id: uid() };
      const nextEntries = recalculateOwnerLedger([...state.ownerEntries, entry]);
      const hasNegativeCapital = nextEntries.some((ownerEntry) => ownerEntry.balance < 0);
      if (hasNegativeCapital) {
        return {
          ...state,
          alerts: [
            {
              id: uid(),
              title: "Owner drawing blocked",
              description: "Drawing amount exceeds current capital balance",
              tone: "red",
            },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const logs = appendLogs(
        state,
        { entityType: "settings", entityId: entry.id, ref: "owner", action: "owner_entry", note: entry.desc },
        { entityType: "settings", entityId: entry.id, ref: "owner", action: "owner_entry", payload: { ...action.payload } }
      );
      return { ...state, ...logs, ownerEntries: nextEntries };
    }
    case "DELETE_OWNER_ENTRY": {
      const nextEntries = recalculateOwnerLedger(state.ownerEntries.filter((e) => e.id !== action.id));
      return { ...state, ownerEntries: nextEntries };
    }

    case "ADD_SUPPLIER": {
      const supplier = { ...action.payload, id: uid() };
      const logs = appendLogs(
        state,
        { entityType: "settings", entityId: supplier.id, ref: supplier.name, action: "supplier_create" },
        { entityType: "settings", entityId: supplier.id, ref: supplier.name, action: "supplier_create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, suppliers: [...state.suppliers, supplier] };
    }
    case "UPDATE_SUPPLIER": {
      const before = state.suppliers.find((s) => s.id === action.id);
      const nextSuppliers = state.suppliers.map((s) => (s.id === action.id ? { ...s, ...action.payload } : s));

      if (!before) return { ...state, suppliers: nextSuppliers };

      const nextName = typeof action.payload.name === "string" ? action.payload.name : before.name;
      if (nextName === before.name) return { ...state, suppliers: nextSuppliers };

      const nextLots = state.lots.map((lot) => (lot.supplier === before.name ? { ...lot, supplier: nextName } : lot));
      const nextPurchases = state.purchases.map((purchase) =>
        purchase.supplier === before.name ? { ...purchase, supplier: nextName } : purchase
      );

      return {
        ...state,
        suppliers: syncSupplierLotsFromLots(nextSuppliers, nextLots),
        lots: nextLots,
        purchases: nextPurchases,
      };
    }
    case "DELETE_SUPPLIER": {
      const supplier = state.suppliers.find((s) => s.id === action.id);
      if (!supplier) return state;

      const hasLinkedLots = state.lots.some((lot) => lot.supplier === supplier.name);
      const hasLinkedPurchases = state.purchases.some((purchase) => purchase.supplier === supplier.name);
      if (hasLinkedLots || hasLinkedPurchases) {
        return {
          ...state,
          alerts: [
            {
              id: uid(),
              title: "Supplier delete blocked",
              description: `${supplier.name} is linked to lots/purchases`,
              tone: "red",
            },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) };
    }

    case "ADD_LOT": {
      const lot = { ...action.payload, id: uid() };
      const supplierExists = state.suppliers.some((s) => s.name === lot.supplier);
      const nextSuppliersBase = supplierExists
        ? state.suppliers
        : [...state.suppliers, { id: uid(), name: lot.supplier, contact: "", email: "", trn: "", lots: 0, status: "Active" }];
      const nextLots = [...state.lots, lot];
      const nextSuppliers = syncSupplierLotsFromLots(nextSuppliersBase, nextLots);
      const logs = appendLogs(
        state,
        { entityType: "lot", entityId: lot.id, ref: lot.lot, action: "create" },
        { entityType: "lot", entityId: lot.id, ref: lot.lot, action: "create", payload: { ...action.payload } }
      );
      return { ...state, ...logs, lots: nextLots, suppliers: nextSuppliers };
    }
    case "UPDATE_LOT": {
      const currentLot = state.lots.find((l) => l.id === action.id);
      const invalidStatusTransition = Boolean(
        currentLot && action.payload.status && !canTransitionLotStatus(currentLot.status, action.payload.status)
      );

      const nextLots = state.lots.map((l) => {
        if (l.id !== action.id) return l;
        const merged = {
          ...l,
          ...action.payload,
          status: invalidStatusTransition ? l.status : (action.payload.status ?? l.status),
        };
        const items = Math.max(0, merged.items);
        const verified = Math.max(0, Math.min(merged.verified, items));
        const graded = Math.max(0, Math.min(merged.graded, verified));
        const status = verified >= items && items > 0 ? "Verified" : merged.status;
        const lifecycleStatus = action.payload.status ? status : deriveLotLifecycleStatus(state.laptops.filter((lp) => lp.lot === l.lot));
        return { ...merged, items, verified, graded, status: lifecycleStatus };
      });

      if (invalidStatusTransition && currentLot && action.payload.status) {
        return {
          ...state,
          lots: nextLots,
          suppliers: syncSupplierLotsFromLots(state.suppliers, nextLots),
          alerts: [
            { id: uid(), title: "Invalid lot transition", description: `${currentLot.status} → ${action.payload.status} is not allowed`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      return { ...state, lots: nextLots, suppliers: syncSupplierLotsFromLots(state.suppliers, nextLots) };
    }
    case "DELETE_LOT": {
      const lot = state.lots.find((l) => l.id === action.id);
      if (!lot) return state;

      const hasLinkedLaptops = state.laptops.some((l) => l.lot === lot.lot);
      if (hasLinkedLaptops) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Lot delete blocked", description: `${lot.lot} still has linked laptops`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const hasLinkedPurchases = state.purchases.some((p) => p.lot === lot.lot);
      if (hasLinkedPurchases) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Lot delete blocked", description: `${lot.lot} is linked to purchases`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const nextLots = state.lots.filter((l) => l.id !== action.id);
      return { ...state, lots: nextLots, suppliers: syncSupplierLotsFromLots(state.suppliers, nextLots) };
    }

    case "ADD_WIP": {
      const laptopExists = state.laptops.some((l) => l.barcode === action.payload.laptop);
      if (!laptopExists) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "WIP blocked", description: `Laptop ${action.payload.laptop} not found in inventory`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const wip = { ...action.payload, id: uid() };
      // Enforce one active WIP per laptop: close existing actives
      const nextWips = state.wipJobs.map((w) =>
        w.laptop === wip.laptop && w.status !== "Completed"
          ? { ...w, status: "Completed", stage: "Complete", history: [...w.history, { ts: new Date().toLocaleString(), action: "Auto-closed (new WIP created)", user: systemUser() }] }
          : w
      );
      const logs = appendLogs(
        state,
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "create" },
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "create", payload: { ...action.payload } }
      );
      const nextLaptops = state.laptops.map((l) =>
        l.barcode === wip.laptop && l.status !== "Sold" ? { ...l, status: "In Processing", track: wip.track } : l
      );
      const nextLots = state.lots.map((lot) => recalculateLotCounters(lot.lot, nextLaptops, lot));

      return {
        ...state,
        ...logs,
        laptops: nextLaptops,
        lots: nextLots,
        wipJobs: [...nextWips, wip],
        activity: [{ action: `WIP ${wip.wip} created for ${wip.brand}`, time: "just now" }, ...state.activity].slice(0, 50),
      };
    }
    case "UPDATE_WIP":
      return { ...state, wipJobs: state.wipJobs.map((w) => (w.id === action.id ? { ...w, ...action.payload } : w)) };

    case "WIP_MOVE_STAGE": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;

      const trackKey = getTrackKey(wip.track);
      const fromStage = wip.stage;
      const toStage = action.toStage;

      if (trackKey && !canAdvance(trackKey, fromStage, toStage)) {
        return {
          ...state,
          alerts: [
            {
              id: uid(),
              title: "Invalid stage transition",
              description: `${wip.wip}: ${fromStage} -> ${toStage} not allowed`,
              tone: "red",
            },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const rerouteToTesting = ["Track B", "Track C"].includes(wip.track) && toStage === "To Testing";
      const failedTestingToTrackE = wip.track === "Track D" && toStage === "L2 Failed";

      const nextWip = {
        ...wip,
        track: rerouteToTesting ? "Track D" : wip.track,
        stage: rerouteToTesting ? "L1 Queue" : toStage,
        status: failedTestingToTrackE ? "Completed" : toStage === "Awaiting Parts" ? "Awaiting Parts" : wip.status,
        history: [
          ...wip.history,
          { ts: new Date().toLocaleString(), action: `Stage moved: ${fromStage} → ${toStage}`, user: systemUser() },
          ...(rerouteToTesting
            ? [{ ts: new Date().toLocaleString(), action: "Auto-routed to Track D (Testing)", user: systemUser() }]
            : []),
          ...(failedTestingToTrackE
            ? [{ ts: new Date().toLocaleString(), action: "Marked completed after L2 Failed; Track E follow-up created", user: systemUser() }]
            : []),
        ],
      };

      const logs = appendLogs(
        state,
        {
          entityType: "wip",
          entityId: wip.id,
          ref: wip.wip,
          action: "move_stage",
          from: `${wip.track}:${fromStage}`,
          to: `${nextWip.track}:${nextWip.stage}`,
        },
        {
          entityType: "wip",
          entityId: wip.id,
          ref: wip.wip,
          action: "move_stage",
          payload: { fromStage, toStage, rerouteToTesting },
        }
      );

      const existingTrackE = failedTestingToTrackE
        ? state.wipJobs.find((x) => x.id !== wip.id && x.laptop === wip.laptop && x.track === "Track E" && x.status !== "Completed")
        : null;
      const followup = failedTestingToTrackE && !existingTrackE ? buildTrackEFollowupFromFailedTesting(wip) : null;

      return {
        ...state,
        ...logs,
        alerts: failedTestingToTrackE
          ? [
              {
                id: uid(),
                title: existingTrackE ? "Track E follow-up already open" : "Track E follow-up created",
                description: existingTrackE
                  ? `${wip.wip} failed testing; existing follow-up ${existingTrackE.wip} kept active`
                  : `${wip.wip} failed testing and was routed to ${followup?.wip}`,
                tone: "yellow",
              },
              ...state.alerts,
            ].slice(0, 50)
          : state.alerts,
        wipJobs: [
          ...state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
          ...(followup ? [followup] : []),
        ],
      };
    }

    case "WIP_ADD_PART": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;
      const part = state.parts.find((p) => p.barcode.toUpperCase() === action.partBarcode.toUpperCase());
      if (!part) return state;

      const normalized = normalizePart(part);
      const reserved = normalized.reserved ?? 0;
      const available = normalized.onHand - reserved;
      if (available <= 0) {
        return {
          ...state,
          alerts: [
            { id: uid(), title: "Out of stock", description: `${part.name} (${part.barcode}) is not available`, tone: "red" },
            ...state.alerts,
          ].slice(0, 50),
        };
      }

      const nextPart = normalizePart({ ...normalized, reserved: reserved + 1 } as PartRecord);
      const nextParts = state.parts.map((p) => (p.id === part.id ? nextPart : p));

      const wipPart = { name: part.name, barcode: part.barcode, cost: part.cost };
      const nextWipParts = [...wip.parts, wipPart];
      const nextWipCost = nextWipParts.reduce((a, x) => a + x.cost, 0);
      const nextWip: WipRecord = {
        ...wip,
        parts: nextWipParts,
        partsUsed: nextWipParts.length,
        partsCost: nextWipCost,
        history: [...wip.history, { ts: new Date().toLocaleString(), action: `Part allocated: ${part.name}`, user: systemUser() }],
      };

      const logs = appendLogs(
        state,
        {
          entityType: "part",
          entityId: part.id,
          ref: part.barcode,
          action: "reserve",
          from: `reserved=${reserved}`,
          to: `reserved=${reserved + 1}`,
          qty: 1,
          note: `Allocated to ${wip.wip}`,
        },
        {
          entityType: "wip",
          entityId: wip.id,
          ref: wip.wip,
          action: "add_part",
          payload: { partBarcode: part.barcode },
        }
      );

      return {
        ...state,
        ...logs,
        parts: nextParts,
        wipJobs: state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
      };
    }

    case "WIP_REMOVE_PART": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;
      const removed = wip.parts[action.index];
      if (!removed) return state;

      const part = state.parts.find((p) => p.barcode === removed.barcode);
      let nextParts = state.parts;
      let movementLogs = state.movementLog;
      let auditLogs = state.auditLog;
      if (part) {
        const normalized = normalizePart(part);
        const reserved = normalized.reserved ?? 0;
        const nextPart = normalizePart({ ...normalized, reserved: Math.max(0, reserved - 1) } as PartRecord);
        nextParts = state.parts.map((p) => (p.id === part.id ? nextPart : p));

        const logs = appendLogs(
          state,
          {
            entityType: "part",
            entityId: part.id,
            ref: part.barcode,
            action: "release",
            from: `reserved=${reserved}`,
            to: `reserved=${Math.max(0, reserved - 1)}`,
            qty: 1,
            note: `Removed from ${wip.wip}`,
          },
          {
            entityType: "wip",
            entityId: wip.id,
            ref: wip.wip,
            action: "remove_part",
            payload: { partBarcode: removed.barcode },
          }
        );
        movementLogs = logs.movementLog;
        auditLogs = logs.auditLog;
      }

      const nextWipParts = wip.parts.filter((_, i) => i !== action.index);
      const nextWipCost = nextWipParts.reduce((a, x) => a + x.cost, 0);
      const nextWip: WipRecord = {
        ...wip,
        parts: nextWipParts,
        partsUsed: nextWipParts.length,
        partsCost: nextWipCost,
        history: [...wip.history, { ts: new Date().toLocaleString(), action: `Part released: ${removed.name}`, user: systemUser() }],
      };

      return {
        ...state,
        movementLog: movementLogs,
        auditLog: auditLogs,
        parts: nextParts,
        wipJobs: state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
      };
    }

    case "WIP_ADD_LABOR": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;
      const entry = {
        tech: action.tech,
        hours: action.hours,
        rate: state.settings.laborRate,
        date: isoDate(),
      };
      const laborEntries = [...wip.laborEntries, entry];
      const laborHrs = laborEntries.reduce((a, x) => a + x.hours, 0);
      const nextWip: WipRecord = {
        ...wip,
        laborEntries,
        laborHrs,
        history: [...wip.history, { ts: new Date().toLocaleString(), action: `Labor added: ${action.hours}h (${action.tech})`, user: systemUser() }],
      };

      const logs = appendLogs(
        state,
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "labor_add", qty: action.hours, note: action.tech },
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "labor_add", payload: { tech: action.tech, hours: action.hours } }
      );

      return {
        ...state,
        ...logs,
        wipJobs: state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
      };
    }

    case "WIP_UPDATE_DIAGNOSIS": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;
      const nextWip: WipRecord = { ...wip, diagnosisNotes: action.notes };
      const logs = appendLogs(
        state,
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "diagnosis_update" },
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "diagnosis_update", payload: { notesLen: action.notes.length } }
      );
      return {
        ...state,
        ...logs,
        wipJobs: state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
      };
    }

    case "WIP_COMPLETE": {
      const wip = state.wipJobs.find((w) => w.id === action.wipId);
      if (!wip) return state;

      // Consume reserved quantities for parts used.
      const partCounts = new Map<string, number>();
      wip.parts.forEach((p) => partCounts.set(p.barcode, (partCounts.get(p.barcode) ?? 0) + 1));

      const nextParts = state.parts.map((p) => {
        const qty = partCounts.get(p.barcode) ?? 0;
        if (!qty) return p;
        const normalized = normalizePart(p);
        const reserved = normalized.reserved ?? 0;
        const nextReserved = Math.max(0, reserved - qty);
        const nextOnHand = Math.max(0, normalized.onHand - qty);
        return normalizePart({ ...normalized, reserved: nextReserved, onHand: nextOnHand } as PartRecord);
      });

      const nextWip: WipRecord = {
        ...wip,
        status: "Completed",
        stage: "Complete",
        history: [...wip.history, { ts: new Date().toLocaleString(), action: "WIP completed", user: systemUser() }],
      };

      const laptop = state.laptops.find((l) => l.barcode === wip.laptop);
      const nextLaptops = laptop
        ? state.laptops.map((l) => (l.id === laptop.id ? { ...l, status: "Ready for Sale" } : l))
        : state.laptops;

      const logs = appendLogs(
        state,
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "complete" },
        { entityType: "wip", entityId: wip.id, ref: wip.wip, action: "complete", payload: { partsConsumed: wip.parts.length } }
      );

      const nextLots = state.lots.map((lot) => recalculateLotCounters(lot.lot, nextLaptops, lot));

      return {
        ...state,
        ...logs,
        parts: nextParts,
        laptops: nextLaptops,
        lots: nextLots,
        wipJobs: state.wipJobs.map((x) => (x.id === wip.id ? nextWip : x)),
        activity: [{ action: `WIP ${wip.wip} completed`, time: "just now" }, ...state.activity].slice(0, 50),
      };
    }

    case "ADD_ACTIVITY":
      return { ...state, activity: [action.payload, ...state.activity].slice(0, 50) };
    case "SET_ACTIVITY":
      return { ...state, activity: action.payload };
    case "CLEAR_ACTIVITY":
      return { ...state, activity: [] };
    case "CLEAR_ALERT":
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [{ ...action.payload, id: uid() }, ...state.notifications] };
    case "MARK_NOTIFICATION_READ":
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) };
    case "UPDATE_SETTINGS": {
      const next = { ...state.settings, ...action.payload };
      const logs = appendLogs(
        state,
        { entityType: "settings", entityId: "settings", ref: "settings", action: "update" },
        { entityType: "settings", entityId: "settings", ref: "settings", action: "update", payload: { ...action.payload } }
      );
      return { ...state, ...logs, settings: next };
    }
    case "TOGGLE_CASH_DAY":
      return { ...state, cashDayOpen: !state.cashDayOpen };
    case "RESTORE_STATE":
      return { ...action.payload };
    case "RESET_STATE":
      return createInitialState();

    case "GLOBAL_SEARCH": {
      const q = action.query.toLowerCase().trim();
      if (!q) return { ...state, searchResults: [] };
      const results: SearchResult[] = [];
      state.laptops.forEach((l) => {
        if (l.barcode.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q) || l.model.toLowerCase().includes(q))
          results.push({ type: "laptop", id: l.id, label: `${l.brand} ${l.model}`, barcode: l.barcode, status: l.status });
      });
      state.parts.forEach((p) => {
        if (p.barcode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
          results.push({ type: "part", id: p.id, label: p.name, barcode: p.barcode });
      });
      state.suppliers.forEach((s) => {
        if (s.name.toLowerCase().includes(q)) results.push({ type: "supplier", id: s.id, label: s.name });
      });
      state.wipJobs.forEach((w) => {
        if (w.wip.toLowerCase().includes(q) || w.laptop.toLowerCase().includes(q))
          results.push({ type: "wip", id: w.id, label: w.wip, barcode: w.laptop });
      });
      return { ...state, searchResults: results.slice(0, 15) };
    }

    default:
      return state;
  }
}

// ── Selectors ──
export const selectKpis = (s: AppState) => {
  const totalLaptops = s.laptops.length;
  const pendingVerification = s.laptops.filter((l) => l.status === "Pending Verification").length;
  const pendingGrading = s.laptops.filter((l) => l.status === "Pending Grading").length;
  const verifiedUnits = totalLaptops - pendingVerification;
  const gradedUnits = totalLaptops - pendingVerification - pendingGrading;

  return {
    totalLaptops,
    inProcessing: s.laptops.filter((l) => l.status === "In Processing").length,
    readyForSale: s.laptops.filter((l) => l.status === "Ready for Sale").length,
    todaysSales: s.sales.filter((sl) => sl.date === isoDate()).reduce((a, sl) => a + sl.total, 0),
    pendingVerification,
    verificationProgressPct: totalLaptops > 0 ? Math.round((verifiedUnits / totalLaptops) * 100) : 0,
    pendingGrading,
    gradingProgressPct: totalLaptops > 0 ? Math.round((gradedUnits / totalLaptops) * 100) : 0,
    lowStockParts: s.parts.filter((p) => p.onHand <= p.reorder && p.onHand > 0).length,
    monthProfit: s.sales.reduce((a, sl) => a + sl.profit, 0),
    totalPartValue: s.parts.reduce((a, p) => a + p.onHand * p.cost, 0),
    activeWip: s.wipJobs.filter((w) => w.status !== "Completed").length,
    cashBalance: s.cashEntries.length > 0 ? s.cashEntries[s.cashEntries.length - 1].balance : 0,
    ownerCapital: s.ownerEntries.length > 0 ? s.ownerEntries[s.ownerEntries.length - 1].balance : 0,
  };
};

export const selectVatSummary = (s: AppState) => {
  const outputVat = s.sales.reduce((a, sl) => a + sl.vat, 0);
  const inputVat = s.purchases.reduce((a, p) => a + p.vat, 0);
  return { outputVat, inputVat, netVat: outputVat - inputVat };
};

// Re-export computeVat for convenience
export { computeVat };
