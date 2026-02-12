import type { LaborRate, OverheadConfig, UnitCostBreakdown } from "@/store/types/CostTypes";

export type CostState = {
  unitCosts: Record<string, UnitCostBreakdown>;
  laborRates: Record<string, LaborRate>;
  overheadConfig: OverheadConfig;
};

export type CostAction =
  | { type: "INIT_UNIT_COST"; payload: { laptopId: string; purchaseCost: number; lotId?: string } }
  | { type: "ADD_PART_COST"; payload: { laptopId: string; partId: string; partName: string; quantity: number; unitCost: number } }
  | { type: "ADD_LABOR_COST"; payload: { laptopId: string; wipId: string; hours: number; rateId?: string } }
  | { type: "APPLY_OVERHEAD"; payload: { laptopId: string } }
  | { type: "FREEZE_COST"; payload: { laptopId: string } }
  | { type: "ADD_COST_ADJUSTMENT"; payload: { laptopId: string; description: string; amount: number } };

const uid = () => crypto.randomUUID();
const round2 = (n: number) => Number(n.toFixed(2));

const recalc = (cost: UnitCostBreakdown): UnitCostBreakdown => ({
  ...cost,
  partsCost: round2(cost.components.filter((c) => c.type === "PART").reduce((s, c) => s + c.amount, 0)),
  laborCost: round2(cost.components.filter((c) => c.type === "LABOR").reduce((s, c) => s + c.amount, 0)),
  overheadAllocation: round2(cost.components.filter((c) => c.type === "OVERHEAD").reduce((s, c) => s + c.amount, 0)),
  totalCost: round2(cost.components.reduce((s, c) => s + c.amount, 0)),
});

const ensureOpen = (cost?: UnitCostBreakdown) => {
  if (!cost) throw new Error("Unit cost not initialized");
  if (cost.costFrozenAt) throw new Error("Cost is frozen");
};

export const createInitialCostState = (): CostState => ({
  unitCosts: {},
  laborRates: {
    default: { id: "default", name: "Default Labor", ratePerHour: 50, isDefault: true },
  },
  overheadConfig: { method: "NONE", fixedAmount: 0, percentage: 0 },
});

export function costReducer(state: CostState, action: CostAction): CostState {
  switch (action.type) {
    case "INIT_UNIT_COST": {
      const cost: UnitCostBreakdown = {
        laptopId: action.payload.laptopId,
        purchaseCost: action.payload.purchaseCost,
        lotId: action.payload.lotId ?? null,
        partsCost: 0,
        laborCost: 0,
        overheadAllocation: 0,
        totalCost: action.payload.purchaseCost,
        costFrozenAt: null,
        components: [
          {
            id: uid(),
            type: "PURCHASE",
            description: "Initial purchase cost",
            amount: round2(action.payload.purchaseCost),
            sourceId: action.payload.lotId ?? null,
            addedAt: new Date().toISOString(),
          },
        ],
      };
      return { ...state, unitCosts: { ...state.unitCosts, [cost.laptopId]: cost } };
    }
    case "ADD_PART_COST": {
      const cost = state.unitCosts[action.payload.laptopId];
      ensureOpen(cost);
      const amount = round2(action.payload.quantity * action.payload.unitCost);
      const next = recalc({
        ...cost!,
        components: cost!.components.concat({
          id: uid(),
          type: "PART",
          description: `${action.payload.partName} x${action.payload.quantity}`,
          amount,
          sourceId: action.payload.partId,
          addedAt: new Date().toISOString(),
        }),
      });
      return { ...state, unitCosts: { ...state.unitCosts, [next.laptopId]: next } };
    }
    case "ADD_LABOR_COST": {
      const cost = state.unitCosts[action.payload.laptopId];
      ensureOpen(cost);
      const rate = action.payload.rateId ? state.laborRates[action.payload.rateId] : Object.values(state.laborRates).find((r) => r.isDefault);
      const amount = round2((rate?.ratePerHour ?? 0) * action.payload.hours);
      const next = recalc({
        ...cost!,
        components: cost!.components.concat({
          id: uid(),
          type: "LABOR",
          description: `Labor ${action.payload.hours}h`,
          amount,
          sourceId: action.payload.wipId,
          addedAt: new Date().toISOString(),
        }),
      });
      return { ...state, unitCosts: { ...state.unitCosts, [next.laptopId]: next } };
    }
    case "APPLY_OVERHEAD": {
      const cost = state.unitCosts[action.payload.laptopId];
      ensureOpen(cost);
      const base = cost!.components.reduce((s, c) => s + c.amount, 0);
      const overhead =
        state.overheadConfig.method === "FIXED_PER_UNIT"
          ? state.overheadConfig.fixedAmount
          : state.overheadConfig.method === "PERCENTAGE_OF_COST"
            ? (base * state.overheadConfig.percentage) / 100
            : 0;
      const next = recalc({
        ...cost!,
        components: cost!.components.concat({
          id: uid(),
          type: "OVERHEAD",
          description: `Overhead (${state.overheadConfig.method})`,
          amount: round2(overhead),
          sourceId: null,
          addedAt: new Date().toISOString(),
        }),
      });
      return { ...state, unitCosts: { ...state.unitCosts, [next.laptopId]: next } };
    }
    case "FREEZE_COST": {
      const cost = state.unitCosts[action.payload.laptopId];
      if (!cost) throw new Error("Unit cost not initialized");
      return { ...state, unitCosts: { ...state.unitCosts, [cost.laptopId]: { ...cost, costFrozenAt: new Date().toISOString() } } };
    }
    case "ADD_COST_ADJUSTMENT": {
      const cost = state.unitCosts[action.payload.laptopId];
      ensureOpen(cost);
      const next = recalc({
        ...cost!,
        components: cost!.components.concat({
          id: uid(),
          type: "ADJUSTMENT",
          description: action.payload.description,
          amount: round2(action.payload.amount),
          sourceId: null,
          addedAt: new Date().toISOString(),
        }),
      });
      return { ...state, unitCosts: { ...state.unitCosts, [next.laptopId]: next } };
    }
    default:
      return state;
  }
}

export const selectUnitCost = (state: CostState, laptopId: string) => state.unitCosts[laptopId] ?? null;
export const selectTotalPartsCost = (state: CostState, laptopId: string) => state.unitCosts[laptopId]?.partsCost ?? 0;
export const selectTotalLaborCost = (state: CostState, laptopId: string) => state.unitCosts[laptopId]?.laborCost ?? 0;
export const selectCostBreakdownForSale = (state: CostState, saleId: string) => state.unitCosts[saleId] ?? null;
