import type { PartRecord } from "@/store/types/PartTypes";

export type StockAlert = {
  id: string;
  partId: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK";
  severity: "info" | "warning" | "critical";
  message: string;
  currentQty: number;
  threshold: number;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
};

export function calculateStockAlerts(parts: PartRecord[]): StockAlert[] {
  const alerts: StockAlert[] = [];
  const now = new Date().toISOString();
  parts.forEach((part) => {
    if (!part.isActive) return;
    if (part.quantity === 0) {
      alerts.push({ id: `${part.id}-out`, partId: part.id, type: "OUT_OF_STOCK", severity: "critical", message: `${part.name} is out of stock`, currentQty: 0, threshold: 0, createdAt: now });
      return;
    }
    if (part.quantity <= part.minStock) {
      alerts.push({ id: `${part.id}-low`, partId: part.id, type: "LOW_STOCK", severity: part.quantity <= part.minStock * 0.5 ? "critical" : "warning", message: `${part.name} is low stock`, currentQty: part.quantity, threshold: part.minStock, createdAt: now });
    }
    if (part.maxStock && part.quantity > part.maxStock) {
      alerts.push({ id: `${part.id}-over`, partId: part.id, type: "OVERSTOCK", severity: "info", message: `${part.name} is overstocked`, currentQty: part.quantity, threshold: part.maxStock, createdAt: now });
    }
  });
  return alerts;
}
