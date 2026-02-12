import type { PartRecord } from "@/store/types/PartTypes";
import type { PartMovement, PartReservation, PartUsage } from "@/store/types/PartMovementTypes";

export type PartState = {
  parts: PartRecord[];
  movements: PartMovement[];
  usages: PartUsage[];
  reservations: PartReservation[];
};

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

export type PartAction =
  | { type: "ADD_PART"; payload: Omit<PartRecord, "id" | "quantity" | "reservedQty" | "availableQty" | "createdAt" | "updatedAt"> }
  | { type: "UPDATE_PART"; payload: { id: string; updates: Partial<PartRecord> } }
  | { type: "DELETE_PART"; payload: { id: string } }
  | { type: "RECEIVE_PARTS"; payload: { partId: string; quantity: number; unitCost: number; purchaseId?: string; notes?: string } }
  | { type: "USE_PART"; payload: { partId: string; laptopId: string; wipId?: string; quantity: number } }
  | { type: "RETURN_PART"; payload: { usageId: string; quantity: number; reason?: string } }
  | { type: "ADJUST_STOCK"; payload: { partId: string; quantity: number; direction: "IN" | "OUT"; reason: string } }
  | { type: "RESERVE_PART"; payload: { partId: string; wipId: string; quantity: number } }
  | { type: "RELEASE_RESERVATION"; payload: { reservationId: string } };

export const initialPartState: PartState = { parts: [], movements: [], usages: [], reservations: [] };

function recalcPart(part: PartRecord, reservations: PartReservation[]) {
  const reservedQty = reservations.filter((r) => r.partId === part.id && r.status === "ACTIVE").reduce((s, r) => s + r.quantity, 0);
  return { ...part, reservedQty, availableQty: part.quantity - reservedQty };
}

export function partReducer(state: PartState = initialPartState, action: PartAction): PartState {
  switch (action.type) {
    case "ADD_PART": {
      const duplicateSku = state.parts.some((p) => p.sku.toLowerCase() === action.payload.sku.toLowerCase());
      if (duplicateSku) return state;
      const duplicateBarcode = action.payload.barcode && state.parts.some((p) => p.barcode && p.barcode === action.payload.barcode);
      if (duplicateBarcode) return state;
      const part: PartRecord = {
        ...action.payload,
        id: uid(),
        quantity: 0,
        reservedQty: 0,
        availableQty: 0,
        isActive: action.payload.isActive ?? true,
        createdAt: now(),
        updatedAt: now(),
      };
      return { ...state, parts: [...state.parts, part] };
    }
    case "UPDATE_PART": {
      return {
        ...state,
        parts: state.parts.map((p) => {
          if (p.id !== action.payload.id) return p;
          const { quantity, reservedQty, availableQty, ...updates } = action.payload.updates;
          return { ...p, ...updates, updatedAt: now() };
        }),
      };
    }
    case "DELETE_PART": {
      const part = state.parts.find((p) => p.id === action.payload.id);
      if (!part || part.quantity > 0) return state;
      return { ...state, parts: state.parts.map((p) => (p.id === part.id ? { ...p, isActive: false, updatedAt: now() } : p)) };
    }
    case "RECEIVE_PARTS": {
      const movement: PartMovement = {
        id: uid(), partId: action.payload.partId, type: "RECEIVE", quantity: action.payload.quantity, direction: "IN",
        unitCost: action.payload.unitCost, totalCost: action.payload.quantity * action.payload.unitCost,
        referenceType: "PURCHASE", referenceId: action.payload.purchaseId, notes: action.payload.notes, timestamp: now(),
      };
      const parts = state.parts.map((p) => {
        if (p.id !== action.payload.partId) return p;
        const totalCost = p.quantity * p.unitCost + action.payload.quantity * action.payload.unitCost;
        const newQty = p.quantity + action.payload.quantity;
        const unitCost = newQty > 0 ? totalCost / newQty : p.unitCost;
        return recalcPart({ ...p, quantity: newQty, unitCost, updatedAt: now() }, state.reservations);
      });
      return { ...state, parts, movements: [movement, ...state.movements] };
    }
    case "USE_PART": {
      const part = state.parts.find((p) => p.id === action.payload.partId);
      if (!part || action.payload.quantity > part.availableQty) return state;
      const usage: PartUsage = {
        id: uid(), partId: part.id, laptopId: action.payload.laptopId, wipId: action.payload.wipId,
        quantity: action.payload.quantity, unitCost: part.unitCost, totalCost: part.unitCost * action.payload.quantity,
        usedAt: now(), returnedQty: 0,
      };
      const movement: PartMovement = {
        id: uid(), partId: part.id, type: "USE", quantity: action.payload.quantity, direction: "OUT",
        unitCost: part.unitCost, totalCost: part.unitCost * action.payload.quantity,
        referenceType: "WIP", referenceId: action.payload.wipId, timestamp: now(),
      };
      const reservations = state.reservations.map((r) =>
        r.partId === part.id && r.wipId === action.payload.wipId && r.status === "ACTIVE" ? { ...r, status: "USED" as const } : r
      );
      const parts = state.parts.map((p) => (p.id === part.id ? recalcPart({ ...p, quantity: p.quantity - action.payload.quantity, updatedAt: now() }, reservations) : p));
      return { ...state, parts, usages: [usage, ...state.usages], movements: [movement, ...state.movements], reservations };
    }
    case "RETURN_PART": {
      const usage = state.usages.find((u) => u.id === action.payload.usageId);
      if (!usage) return state;
      const maxReturnable = usage.quantity - usage.returnedQty;
      if (action.payload.quantity > maxReturnable) return state;
      const part = state.parts.find((p) => p.id === usage.partId);
      if (!part) return state;
      const movement: PartMovement = {
        id: uid(), partId: part.id, type: "RETURN", quantity: action.payload.quantity, direction: "IN",
        unitCost: usage.unitCost, totalCost: usage.unitCost * action.payload.quantity,
        referenceType: "WIP", referenceId: usage.wipId, reason: action.payload.reason, timestamp: now(),
      };
      return {
        ...state,
        parts: state.parts.map((p) => (p.id === part.id ? recalcPart({ ...p, quantity: p.quantity + action.payload.quantity, updatedAt: now() }, state.reservations) : p)),
        usages: state.usages.map((u) => (u.id === usage.id ? { ...u, returnedQty: u.returnedQty + action.payload.quantity, returnedAt: now() } : u)),
        movements: [movement, ...state.movements],
      };
    }
    case "ADJUST_STOCK": {
      const part = state.parts.find((p) => p.id === action.payload.partId);
      if (!part) return state;
      if (action.payload.direction === "OUT" && action.payload.quantity > part.quantity) return state;
      const type = action.payload.direction === "IN" ? "ADJUST_IN" : "ADJUST_OUT";
      const movement: PartMovement = {
        id: uid(), partId: part.id, type, quantity: action.payload.quantity, direction: action.payload.direction,
        unitCost: part.unitCost, totalCost: part.unitCost * action.payload.quantity,
        referenceType: "ADJUSTMENT", reason: action.payload.reason, timestamp: now(),
      };
      const delta = action.payload.direction === "IN" ? action.payload.quantity : -action.payload.quantity;
      return {
        ...state,
        parts: state.parts.map((p) => (p.id === part.id ? recalcPart({ ...p, quantity: p.quantity + delta, updatedAt: now() }, state.reservations) : p)),
        movements: [movement, ...state.movements],
      };
    }
    case "RESERVE_PART": {
      const part = state.parts.find((p) => p.id === action.payload.partId);
      if (!part || action.payload.quantity > part.availableQty) return state;
      const reservation: PartReservation = {
        id: uid(), partId: action.payload.partId, wipId: action.payload.wipId, quantity: action.payload.quantity, reservedAt: now(), status: "ACTIVE",
      };
      const reservations = [reservation, ...state.reservations];
      return { ...state, reservations, parts: state.parts.map((p) => (p.id === part.id ? recalcPart(p, reservations) : p)) };
    }
    case "RELEASE_RESERVATION": {
      const reservations = state.reservations.map((r) => (r.id === action.payload.reservationId ? { ...r, status: "RELEASED" as const } : r));
      return { ...state, reservations, parts: state.parts.map((p) => recalcPart(p, reservations)) };
    }
    default:
      return state;
  }
}
