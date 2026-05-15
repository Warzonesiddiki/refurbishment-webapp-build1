export type MovementType =
  | "RECEIVE"
  | "USE"
  | "ADJUST_IN"
  | "ADJUST_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RETURN"
  | "SCRAP"
  | "STOCK_TAKE";

export type ValuationMethod = "FIFO" | "WEIGHTED_AVG";

export type PartRecord = {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  minStock: number;
  maxStock?: number;
  reorderQty?: number;
  unitCost: number;
  unitPrice?: number;
  location?: string;
  supplier?: string;
  leadTimeDays?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartCategory = {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  sortOrder: number;
};
