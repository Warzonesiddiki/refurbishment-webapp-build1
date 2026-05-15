import type { MovementType } from "@/store/types/PartTypes";

export type PartMovement = {
  id: string;
  partId: string;
  type: MovementType;
  quantity: number;
  direction: "IN" | "OUT";
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
  timestamp: string;
  notes?: string;
};

export type PartUsage = {
  id: string;
  partId: string;
  laptopId: string;
  wipId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  usedAt: string;
  returnedQty: number;
  returnedAt?: string;
};

export type PartReservation = {
  id: string;
  partId: string;
  wipId: string;
  quantity: number;
  reservedAt: string;
  expiresAt?: string;
  status: "ACTIVE" | "USED" | "RELEASED" | "EXPIRED";
};
