import { ActionKey } from "@/data/actionKeys";

export const ACTION_ROUTE_MAP: Partial<Record<ActionKey, string>> = {
  scan: "scanner",
  "new-sale": "sales-new",
  "import-lot": "receiving-import",
  grade: "receiving-grading",
  "add-laptop": "inventory-laptops",
  "add-part": "inventory-parts",
  "add-wip-job": "processing-wip",
  "wip-move-stage": "processing-wip",
  "export-reports": "reports",
  "export-sales": "sales-all",
  "export-purchases": "purchases-all",
  "export-payments": "purchases-payments",
  "export-receipts": "sales-receipts",
  "export-cash": "finance-cash",
  "export-vat": "finance-vat",
  "export-owner": "finance-owner",
  "export-suppliers": "master-suppliers",
  "export-lots": "master-lots",
  "save-purchase": "purchases-new",
  "save-purchase-draft": "purchases-new",
  "add-sale-item": "sales-new",
  "complete-sale": "sales-new",
};

export function resolveActionRoute(action: ActionKey): string | null {
  return ACTION_ROUTE_MAP[action] ?? null;
}
