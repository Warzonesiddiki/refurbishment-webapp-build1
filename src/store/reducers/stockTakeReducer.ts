import type { PartMovement } from "@/store/types/PartMovementTypes";
import type { PartRecord } from "@/store/types/PartTypes";
import type { StockTake } from "@/store/types/StockTakeTypes";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export type StockTakeState = {
  stockTakes: StockTake[];
  parts: PartRecord[];
  movements: PartMovement[];
};

export type StockTakeAction =
  | { type: "CREATE_STOCK_TAKE"; payload: { name: string; categoryFilter?: string[]; locationFilter?: string[]; createdBy: string } }
  | { type: "START_STOCK_TAKE"; payload: { id: string } }
  | { type: "RECORD_COUNT"; payload: { stockTakeId: string; partId: string; countedQty: number; countedBy: string } }
  | { type: "SUBMIT_FOR_REVIEW"; payload: { stockTakeId: string } }
  | { type: "COMPLETE_STOCK_TAKE"; payload: { stockTakeId: string; approvedBy: string } }
  | { type: "CANCEL_STOCK_TAKE"; payload: { stockTakeId: string } };

export function stockTakeReducer(state: StockTakeState, action: StockTakeAction): StockTakeState {
  switch (action.type) {
    case "CREATE_STOCK_TAKE": {
      const items = state.parts.map((part) => ({
        id: uid(), stockTakeId: "", partId: part.id, expectedQty: part.quantity, countedQty: undefined,
        variance: 0, varianceValue: 0, status: "PENDING" as const,
      }));
      const id = uid();
      return {
        ...state,
        stockTakes: [{ id, name: action.payload.name, status: "DRAFT", createdBy: action.payload.createdBy, items: items.map((i) => ({ ...i, stockTakeId: id })) }, ...state.stockTakes],
      };
    }
    case "START_STOCK_TAKE":
      return { ...state, stockTakes: state.stockTakes.map((s) => (s.id === action.payload.id && s.status === "DRAFT" ? { ...s, status: "IN_PROGRESS", startedAt: now() } : s)) };
    case "RECORD_COUNT":
      return {
        ...state,
        stockTakes: state.stockTakes.map((s) => {
          if (s.id !== action.payload.stockTakeId || s.status !== "IN_PROGRESS") return s;
          return {
            ...s,
            items: s.items.map((item) => {
              if (item.partId !== action.payload.partId) return item;
              const part = state.parts.find((p) => p.id === item.partId);
              const variance = action.payload.countedQty - item.expectedQty;
              return {
                ...item,
                countedQty: action.payload.countedQty,
                variance,
                varianceValue: variance * (part?.unitCost ?? 0),
                status: "COUNTED",
                countedBy: action.payload.countedBy,
                countedAt: now(),
              };
            }),
          };
        }),
      };
    case "SUBMIT_FOR_REVIEW":
      return {
        ...state,
        stockTakes: state.stockTakes.map((s) => {
          if (s.id !== action.payload.stockTakeId) return s;
          const allCounted = s.items.every((i) => i.status === "COUNTED" || i.status === "VERIFIED");
          return allCounted ? { ...s, status: "REVIEW" } : s;
        }),
      };
    case "COMPLETE_STOCK_TAKE": {
      const target = state.stockTakes.find((s) => s.id === action.payload.stockTakeId);
      if (!target || target.status !== "REVIEW") return state;
      const adjustments = target.items.filter((i) => i.variance !== 0);
      const movementAdds: PartMovement[] = adjustments.map((item) => {
        const part = state.parts.find((p) => p.id === item.partId);
        return {
          id: uid(), partId: item.partId, type: "STOCK_TAKE", quantity: Math.abs(item.variance), direction: item.variance > 0 ? "IN" : "OUT",
          unitCost: part?.unitCost ?? 0, totalCost: Math.abs(item.variance) * (part?.unitCost ?? 0),
          referenceType: "STOCK_TAKE", referenceId: target.id, performedBy: action.payload.approvedBy, timestamp: now(),
        };
      });

      const parts = state.parts.map((p) => {
        const item = adjustments.find((a) => a.partId === p.id);
        return item ? { ...p, quantity: p.quantity + item.variance, availableQty: p.availableQty + item.variance } : p;
      });

      return {
        ...state,
        parts,
        movements: [...movementAdds, ...state.movements],
        stockTakes: state.stockTakes.map((s) => (s.id === target.id ? { ...s, status: "COMPLETED", completedAt: now() } : s)),
      };
    }
    case "CANCEL_STOCK_TAKE":
      return { ...state, stockTakes: state.stockTakes.map((s) => (s.id === action.payload.stockTakeId && s.status !== "COMPLETED" ? { ...s, status: "CANCELLED" } : s)) };
    default:
      return state;
  }
}
