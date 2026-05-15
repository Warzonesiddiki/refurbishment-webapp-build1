import { ActionKey } from "@/data/actionKeys";

export const ACTION_ROUTE_MAP: Partial<Record<ActionKey, string>> = {
  scan: "scanner",
  "new-sale": "sales-new",
  "import-lot": "receiving-import",
  "import-lot-commit": "receiving-import",
  "verification-complete": "receiving-verification",
  "grading-save": "receiving-grading",
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
  "open-day": "finance-cash",
  "close-day": "finance-cash",
  "add-cash-entry": "finance-cash",
  "add-receipt": "sales-receipts",
  "add-payment": "purchases-payments",
  "add-supplier": "master-suppliers",
  "add-lot": "master-lots",
};

export function resolveActionRoute(action: ActionKey): string | null {
  return ACTION_ROUTE_MAP[action] ?? null;
}
