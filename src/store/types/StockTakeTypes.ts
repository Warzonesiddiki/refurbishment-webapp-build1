export type StockTakeItem = {
  id: string;
  stockTakeId: string;
  partId: string;
  expectedQty: number;
  countedQty?: number;
  variance: number;
  varianceValue: number;
  status: "PENDING" | "COUNTED" | "RECOUNTED" | "VERIFIED";
  countedBy?: string;
  countedAt?: string;
  notes?: string;
};

export type StockTake = {
  id: string;
  name: string;
  status: "DRAFT" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
  categoryFilter?: string[];
  locationFilter?: string[];
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  items: StockTakeItem[];
  notes?: string;
};

export type StockTakeAdjustment = {
  stockTakeId: string;
  items: Array<{ partId: string; adjustmentQty: number; reason: string }>;
  approvedBy: string;
  approvedAt: string;
};
