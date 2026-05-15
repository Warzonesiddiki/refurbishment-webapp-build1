export type BOMItem = {
  id: string;
  partId: string;
  quantity: number;
  isOptional: boolean;
  notes?: string;
  alternatePartIds: string[];
};

export type BOMTemplate = {
  id: string;
  name: string;
  laptopModel?: string;
  laptopMake?: string;
  description?: string;
  items: BOMItem[];
  laborMinutes?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppliedBOMItem = {
  partId: string;
  requiredQty: number;
  usedQty: number;
  status: "PENDING" | "PARTIAL" | "COMPLETE" | "SKIPPED";
};

export type AppliedBOM = {
  wipId: string;
  templateId: string;
  appliedAt: string;
  items: AppliedBOMItem[];
};
