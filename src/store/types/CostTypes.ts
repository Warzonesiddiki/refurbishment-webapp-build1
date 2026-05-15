export type CostComponentType = "PURCHASE" | "PART" | "LABOR" | "OVERHEAD" | "ADJUSTMENT";

export type CostComponent = {
  id: string;
  type: CostComponentType;
  description: string;
  amount: number;
  sourceId: string | null;
  addedAt: string;
};

export type UnitCostBreakdown = {
  laptopId: string;
  purchaseCost: number;
  lotId: string | null;
  partsCost: number;
  laborCost: number;
  overheadAllocation: number;
  totalCost: number;
  costFrozenAt: string | null;
  components: CostComponent[];
};

export type LaborRate = {
  id: string;
  name: string;
  ratePerHour: number;
  isDefault: boolean;
};

export type OverheadConfig = {
  method: "NONE" | "FIXED_PER_UNIT" | "PERCENTAGE_OF_COST";
  fixedAmount: number;
  percentage: number;
};
