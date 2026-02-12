import type { VATConfig, VATRate } from "@/store/types/VATTypes";
import type { VATReturn, VATTransaction } from "@/store/types/VATTransactionTypes";

export type VATState = {
  config: VATConfig;
  rates: Record<string, VATRate>;
  transactions: VATTransaction[];
  returns: Record<string, VATReturn>;
};

export type VATAction =
  | { type: "SET_VAT_CONFIG"; payload: Partial<VATConfig> }
  | { type: "ADD_VAT_RATE"; payload: Omit<VATRate, "id"> }
  | { type: "RECORD_VAT_TRANSACTION"; payload: Omit<VATTransaction, "id" | "createdAt"> }
  | { type: "REVERSE_VAT_TRANSACTION"; payload: { transactionId: string; reason: string } }
  | { type: "GENERATE_VAT_RETURN"; payload: { periodStart: string; periodEnd: string } }
  | { type: "FILE_VAT_RETURN"; payload: { returnId: string; reference: string } }
  | { type: "MARK_VAT_RETURN_PAID"; payload: { returnId: string; paidDate: string } };

const round2 = (n: number) => Number(n.toFixed(2));
const uid = () => crypto.randomUUID();

export const createInitialVATState = (): VATState => ({
  config: {
    defaultRate: "standard",
    defaultMode: "EXCLUSIVE",
    registrationNumber: "",
    registrationName: "",
    filingFrequency: "MONTHLY",
    fiscalYearStart: 1,
  },
  rates: {
    standard: {
      id: "standard",
      code: "STANDARD",
      name: "Standard",
      rate: 15,
      isDefault: true,
      effectiveFrom: new Date(0).toISOString(),
      effectiveTo: null,
      isActive: true,
    },
  },
  transactions: [],
  returns: {},
});

function hasOverlap(existing: VATRate, candidate: Omit<VATRate, "id">) {
  if (existing.code !== candidate.code) return false;
  const a1 = +new Date(existing.effectiveFrom);
  const a2 = existing.effectiveTo ? +new Date(existing.effectiveTo) : Number.POSITIVE_INFINITY;
  const b1 = +new Date(candidate.effectiveFrom);
  const b2 = candidate.effectiveTo ? +new Date(candidate.effectiveTo) : Number.POSITIVE_INFINITY;
  return a1 <= b2 && b1 <= a2;
}

export function vatReducer(state: VATState, action: VATAction): VATState {
  switch (action.type) {
    case "SET_VAT_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };
    case "ADD_VAT_RATE": {
      for (const rate of Object.values(state.rates)) {
        if (hasOverlap(rate, action.payload)) throw new Error("Overlapping VAT rate effective dates");
      }
      const id = uid();
      return { ...state, rates: { ...state.rates, [id]: { ...action.payload, id } } };
    }
    case "RECORD_VAT_TRANSACTION": {
      const tx: VATTransaction = { ...action.payload, id: uid(), createdAt: new Date().toISOString() };
      return { ...state, transactions: [...state.transactions, tx] };
    }
    case "REVERSE_VAT_TRANSACTION": {
      const original = state.transactions.find((t) => t.id === action.payload.transactionId);
      if (!original) throw new Error("Transaction not found");
      const reversal: VATTransaction = {
        ...original,
        id: uid(),
        vatAmount: round2(-original.vatAmount),
        taxableAmount: round2(-original.taxableAmount),
        totalAmount: round2(-original.totalAmount),
        isReversed: false,
        reversalId: original.id,
        reversalReason: action.payload.reason,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === original.id ? { ...t, isReversed: true, reversalId: reversal.id, reversalReason: action.payload.reason } : t
        ).concat(reversal),
      };
    }
    case "GENERATE_VAT_RETURN": {
      const start = +new Date(action.payload.periodStart);
      const end = +new Date(action.payload.periodEnd);
      const inPeriod = state.transactions.filter((tx) => {
        const dt = +new Date(tx.transactionDate);
        return dt >= start && dt <= end && !tx.isReversed;
      });
      const outputVAT = round2(inPeriod.filter((t) => t.type === "OUTPUT").reduce((s, t) => s + t.vatAmount, 0));
      const inputVAT = round2(inPeriod.filter((t) => t.type === "INPUT").reduce((s, t) => s + t.vatAmount, 0));
      const netVAT = round2(outputVAT - inputVAT);
      const id = uid();
      const now = new Date().toISOString();
      const vatReturn: VATReturn = {
        id,
        periodStart: action.payload.periodStart,
        periodEnd: action.payload.periodEnd,
        status: "CALCULATED",
        outputVAT,
        inputVAT,
        netVAT,
        adjustments: 0,
        finalAmount: netVAT,
        lines: [
          { box: 1, description: "VAT due on sales", amount: outputVAT },
          { box: 4, description: "VAT reclaimed on purchases", amount: inputVAT },
          { box: 5, description: "Net VAT", amount: netVAT },
        ],
        transactionCount: inPeriod.length,
        filedDate: null,
        paidDate: null,
        reference: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, returns: { ...state.returns, [id]: vatReturn } };
    }
    case "FILE_VAT_RETURN": {
      const found = state.returns[action.payload.returnId];
      if (!found) throw new Error("VAT return not found");
      return {
        ...state,
        returns: {
          ...state.returns,
          [found.id]: {
            ...found,
            status: "FILED",
            reference: action.payload.reference,
            filedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }
    case "MARK_VAT_RETURN_PAID": {
      const found = state.returns[action.payload.returnId];
      if (!found) throw new Error("VAT return not found");
      return {
        ...state,
        returns: {
          ...state.returns,
          [found.id]: {
            ...found,
            status: "PAID",
            paidDate: action.payload.paidDate,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }
    default:
      return state;
  }
}

export const selectVATConfig = (state: VATState) => state.config;
export const selectActiveVATRates = (state: VATState) => Object.values(state.rates).filter((r) => r.isActive);
export const selectVATTransactionsByPeriod = (state: VATState, start: string, end: string) => {
  const s = +new Date(start);
  const e = +new Date(end);
  return state.transactions.filter((t) => {
    const d = +new Date(t.transactionDate);
    return d >= s && d <= e;
  });
};
export const selectVATReturn = (state: VATState, id: string) => state.returns[id] ?? null;
export const selectPendingVATReturns = (state: VATState) =>
  Object.values(state.returns).filter((r) => r.status === "DRAFT" || r.status === "CALCULATED");
