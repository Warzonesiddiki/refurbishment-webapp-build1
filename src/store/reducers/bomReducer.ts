import type { AppliedBOM, AppliedBOMItem, BOMTemplate } from "@/store/types/BOMTypes";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export type BomState = { templates: BOMTemplate[]; applied: AppliedBOM[]; validPartIds?: Set<string> };

export type BomAction =
  | { type: "ADD_BOM_TEMPLATE"; payload: Omit<BOMTemplate, "id" | "createdAt" | "updatedAt"> }
  | { type: "UPDATE_BOM_TEMPLATE"; payload: { id: string; updates: Partial<BOMTemplate> } }
  | { type: "DELETE_BOM_TEMPLATE"; payload: { id: string } }
  | { type: "APPLY_BOM_TO_WIP"; payload: { wipId: string; templateId: string } }
  | { type: "UPDATE_APPLIED_BOM_ITEM"; payload: { wipId: string; partId: string; usedQty: number } };

export function bomReducer(state: BomState = { templates: [], applied: [] }, action: BomAction): BomState {
  switch (action.type) {
    case "ADD_BOM_TEMPLATE": {
      const hasMissing = state.validPartIds
        ? action.payload.items.some((i) => !state.validPartIds?.has(i.partId))
        : false;
      if (hasMissing) return state;
      const next: BOMTemplate = { ...action.payload, id: uid(), createdAt: now(), updatedAt: now() };
      return { ...state, templates: [...state.templates, next] };
    }
    case "UPDATE_BOM_TEMPLATE":
      return { ...state, templates: state.templates.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload.updates, updatedAt: now() } : t)) };
    case "DELETE_BOM_TEMPLATE":
      return { ...state, templates: state.templates.map((t) => (t.id === action.payload.id ? { ...t, isActive: false, updatedAt: now() } : t)) };
    case "APPLY_BOM_TO_WIP": {
      const template = state.templates.find((t) => t.id === action.payload.templateId);
      if (!template) return state;
      const items: AppliedBOMItem[] = template.items.map((i) => ({ partId: i.partId, requiredQty: i.quantity, usedQty: 0, status: "PENDING" }));
      const record: AppliedBOM = { wipId: action.payload.wipId, templateId: template.id, appliedAt: now(), items };
      return { ...state, applied: [record, ...state.applied.filter((a) => a.wipId !== action.payload.wipId)] };
    }
    case "UPDATE_APPLIED_BOM_ITEM": {
      return {
        ...state,
        applied: state.applied.map((a) => {
          if (a.wipId !== action.payload.wipId) return a;
          return {
            ...a,
            items: a.items.map((i) => {
              if (i.partId !== action.payload.partId) return i;
              const status = action.payload.usedQty <= 0 ? "PENDING" : action.payload.usedQty >= i.requiredQty ? "COMPLETE" : "PARTIAL";
              return { ...i, usedQty: action.payload.usedQty, status };
            }),
          };
        }),
      };
    }
    default:
      return state;
  }
}
