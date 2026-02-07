export type CurrencyCode = "AED" | "USD" | "EUR" | string;

export type SequenceType =
  | "laptop"
  | "part"
  | "lot"
  | "wip"
  | "invoice"
  | "purchase"
  | "receipt"
  | "payment";

export type SequencePattern = Record<SequenceType, string>;

export interface BaseEntity {
  id: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier extends BaseEntity {
  name: string;
  trn?: string;
  contact?: string;
  email?: string;
}

export interface Lot extends BaseEntity {
  lotNumber: string;
  supplierId: string;
  arrivalDate?: string;
  purchaseDate?: string;
  totalCostExVat?: number;
  freight?: number;
  notes?: string;
  status: "pending" | "verified" | "grading" | "completed";
}

export interface Laptop extends BaseEntity {
  barcode: string;
  brand: string;
  model: string;
  specs?: string;
  grade?: "A" | "B" | "C";
  status: "pending_verification" | "pending_grading" | "in_processing" | "ready_for_sale" | "sold";
  track?: "A" | "B" | "C" | "D" | "E" | "completed";
  costExVat?: number;
  lotId?: string;
}

export interface Part extends BaseEntity {
  barcode: string;
  name: string;
  category?: string;
  specification?: string;
  condition?: "New" | "Refurbished" | "Used";
  quantityOnHand: number;
  quantityReserved: number;
  reorderLevel: number;
  unitCostExVat?: number;
  location?: string;
}

export interface WipJob extends BaseEntity {
  wipNumber: string;
  laptopId: string;
  track: "A" | "B" | "C" | "D" | "E";
  stage: string;
  assignedTo?: string;
  priority?: "High" | "Normal" | "Low";
  status: "active" | "in_progress" | "awaiting_parts" | "completed";
  partsCost?: number;
  laborCost?: number;
}

export interface Sale extends BaseEntity {
  invoiceNumber: string;
  customer?: string;
  subtotalExVat: number;
  vatAmount: number;
  totalIncVat: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMethod?: string;
  profit?: number;
}

export interface Receipt extends BaseEntity {
  receiptNumber: string;
  saleId: string;
  amount: number;
  method: string;
  reference?: string;
}

export interface Purchase extends BaseEntity {
  purchaseNumber: string;
  supplierId: string;
  lotId?: string;
  subtotalExVat: number;
  vatAmount: number;
  totalIncVat: number;
  status: "open" | "closed";
  paymentStatus: "paid" | "partial" | "due";
  method?: string;
}

export interface Payment extends BaseEntity {
  paymentNumber: string;
  purchaseId: string;
  amount: number;
  method: string;
  reference?: string;
}

export interface CashRegisterEntry extends BaseEntity {
  entryType: "opening" | "cash_in" | "cash_out" | "adjustment" | "closing";
  description: string;
  amount: number;
  balance: number;
  reason?: string;
}

export interface OwnerLedgerEntry extends BaseEntity {
  entryType: "investment" | "drawing" | "profit";
  description: string;
  amount: number;
  balance: number;
}

export interface MovementLog extends BaseEntity {
  entityType: string;
  entityId: string;
  action: string;
  from?: string;
  to?: string;
  userId: string;
}

export interface AuditLog extends BaseEntity {
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
  userId: string;
}

export type IdempotencyRecord = {
  key: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

// ---------- Validation ----------
export function assertStockInvariant(part: Pick<Part, "quantityOnHand" | "quantityReserved">) {
  const { quantityOnHand, quantityReserved } = part;
  if (quantityOnHand < 0) throw new Error("quantityOnHand < 0");
  if (quantityReserved < 0) throw new Error("quantityReserved < 0");
  if (quantityReserved > quantityOnHand) throw new Error("quantityReserved exceeds onHand");
  return quantityOnHand - quantityReserved;
}

export function computeVat(amountExVat: number, rate = 0.05) {
  const vat = +(amountExVat * rate).toFixed(2);
  const total = +(amountExVat + vat).toFixed(2);
  return { vat, total };
}

const sequencePatterns: SequencePattern = {
  laptop: "ALM-LP-YYYYMMDD-NNNN",
  part: "ALM-PT-YYYYMMDD-NNNN",
  lot: "ALM-LOT-YYYYMM-NN",
  wip: "ALM-WIP-YYYYMMDD-NNNN",
  invoice: "ALM-INV-YYYYMM-NNNN",
  purchase: "ALM-PO-YYYYMM-NNNN",
  receipt: "ALM-RC-YYYYMM-NNNN",
  payment: "ALM-PAY-YYYYMM-NNNN",
};

export function validateSequence(type: SequenceType, value: string) {
  const pattern = sequencePatterns[type];
  const regex = new RegExp(
    pattern
      .replace("YYYY", "\\d{4}")
      .replace("MM", "\\d{2}")
      .replace("DD", "\\d{2}")
      .replace("NNNN", "\\d{4}")
      .replace("NN", "\\d{2}")
  );
  if (!regex.test(value)) throw new Error(`Sequence ${value} does not match pattern ${pattern}`);
  return true;
}

export function makeSequenceGenerator(type: SequenceType) {
  let counter = 0;
  return (date: Date = new Date()) => {
    counter += 1;
    const yyyy = date.getFullYear().toString();
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    const seq = `${counter}`.padStart(4, "0");
    const pattern = sequencePatterns[type];
    return pattern
      .replace("YYYY", yyyy)
      .replace("MM", mm)
      .replace("DD", dd)
      .replace("NNNN", seq)
      .replace("NN", seq.slice(-2));
  };
}

// ---------- Idempotency ----------
const idemStore = new Map<string, IdempotencyRecord>();

export function recordIdempotency(key: string, entityType: string, entityId: string) {
  if (idemStore.has(key)) return idemStore.get(key)!;
  const record: IdempotencyRecord = {
    key,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  };
  idemStore.set(key, record);
  return record;
}

// ---------- Logging stubs ----------
export function logMovement(input: Omit<MovementLog, "id" | "createdAt" | "updatedAt">): MovementLog {
  const now = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
}

export function logAudit(input: Omit<AuditLog, "id" | "createdAt" | "updatedAt">): AuditLog {
  const now = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
}

// ---------- State machines ----------
export const trackStages: Record<"A" | "B" | "C" | "D" | "E", readonly string[]> = {
  A: ["Queue", "Cleaning", "Windows Install", "QC", "Packing"],
  B: ["Queue", "Disassembly", "Paint Queue", "Painting", "Drying", "Reassembly", "To Testing"],
  C: ["Queue", "Diagnosis", "Awaiting Parts", "Repair", "Repair Complete", "To Testing"],
  D: ["L1 Queue", "L1 Testing", "L1 Failed", "L2 Queue", "L2 Testing", "L2 Failed", "Passed"],
  E: ["Queue", "Disassembly/Harvest", "Parts Logged", "Complete/Disposed"],
};

export function canAdvance(track: keyof typeof trackStages, from: string, to: string) {
  const stages = trackStages[track];
  const iFrom = stages.indexOf(from);
  const iTo = stages.indexOf(to);
  return iFrom !== -1 && iTo === iFrom + 1;
}
