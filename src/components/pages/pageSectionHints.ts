import type { SectionHelpHintData } from "@/components/ui/SectionHelpHint";

export type GuidedPageKey =
  | "inventoryLaptops"
  | "inventoryParts"
  | "salesAll"
  | "purchasesAll"
  | "wipJobs"
  | "scanner"
  | "reports"
  | "financeCash"
  | "financeVat"
  | "salesNew"
  | "purchasesNew";

export const PAGE_SECTION_HINTS: Record<GuidedPageKey, SectionHelpHintData> = {
  inventoryLaptops: {
    title: "Laptop Inventory",
    summary: "Use filters and bulk actions to keep device status accurate across receiving, processing, and sales.",
    bullets: [
      "Filter by status/track before bulk updates to avoid accidental changes.",
      "Use label printing for bins and handoff checkpoints.",
    ],
  },
  inventoryParts: {
    title: "Parts Inventory",
    summary: "Track stock health and keep reorder thresholds realistic to prevent production stalls.",
    bullets: [
      "Import CSV in small batches and spot-check totals after upload.",
      "Investigate low/out-of-stock KPIs daily before opening WIP jobs.",
    ],
    tone: "yellow",
  },
  salesAll: {
    title: "Sales Ledger",
    summary: "Validate invoice totals and payment status before export or reconciliation.",
    bullets: [
      "Use status filter to quickly isolate unpaid and partial invoices.",
      "Re-export after edits so finance reports remain aligned.",
    ],
  },
  purchasesAll: {
    title: "Purchase Orders",
    summary: "Monitor supplier bills, lot links, and payment completion from one queue.",
    bullets: [
      "Record payments from this screen to keep payable data synchronized.",
      "Use search by supplier during monthly close and audit reviews.",
    ],
    tone: "purple",
  },
  wipJobs: {
    title: "WIP Orchestration",
    summary: "Advance jobs stage-by-stage with diagnostics, parts usage, and labor captured in-line.",
    bullets: [
      "Keep diagnosis notes up to date before changing stage.",
      "Review parts and labor costs before marking a job complete.",
    ],
    tone: "purple",
  },
  scanner: {
    title: "Scanner Workflow",
    summary: "Use scan-first operations for faster lookup, status updates, and reduced manual entry errors.",
    bullets: [
      "Scan once, verify record, then apply status updates with a short note.",
      "Clear history at shift boundaries to keep operator context clean.",
    ],
  },
  reports: {
    title: "Reporting Workspace",
    summary: "Select one report at a time, validate values, then export only what stakeholders need.",
    bullets: [
      "Use JSON exports for system integration and CSV for spreadsheets.",
      "Run accounting/management reports after large data imports.",
    ],
    tone: "purple",
  },
  financeCash: {
    title: "Cash Ledger",
    summary: "Record in/out adjustments with clear descriptions to maintain audit-friendly balances.",
    bullets: [
      "Always attach a reason when posting manual adjustments.",
      "Export the ledger before month-end reconciliation.",
    ],
    tone: "yellow",
  },
  financeVat: {
    title: "VAT Reconciliation",
    summary: "Review output/input VAT by period before filing or exporting reports.",
    bullets: [
      "Set the reporting month first, then validate sales vs purchase VAT totals.",
      "Use export for archive-ready monthly VAT snapshots.",
    ],
    tone: "yellow",
  },
  salesNew: {
    title: "New Sale Entry",
    summary: "Scan ready-for-sale devices, confirm totals, then complete and print customer documents.",
    bullets: [
      "Only items with Ready for Sale status should enter cart.",
      "Confirm payment amount and change before finalizing sale.",
    ],
  },
  purchasesNew: {
    title: "New Purchase Entry",
    summary: "Capture supplier purchase details with VAT and payment data for accurate payable tracking.",
    bullets: [
      "Link purchases to lots when applicable for better traceability.",
      "If payment is cash, verify cash register impact before save.",
    ],
    tone: "purple",
  },
};

export function getPageSectionHint(page: GuidedPageKey): SectionHelpHintData {
  return PAGE_SECTION_HINTS[page];
}
