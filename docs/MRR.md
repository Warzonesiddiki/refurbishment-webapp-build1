# Master Requirements Register (MRR) v1.5

Scope: Inventory, WIP, Accounting Essentials, Receiving pipeline, Finance, Master Data, Reports, Settings.

## Inventory Management
MRR-001: Laptops inventory list supports filters (search, status, track, brand, lot), bulk actions, export/import, pagination, and empty state.
MRR-002: Parts inventory list supports KPI summary, filters (search, category, condition, stock status), export/import, pagination, and empty state.
MRR-003: Parts stock invariants enforce quantityOnHand>=0, quantityReserved>=0, quantityReserved<=quantityOnHand, quantityAvailable=quantityOnHand-quantityReserved.
MRR-004: Low stock flag when quantityOnHand<=reorderLevel.

## Receiving Pipeline
MRR-010: Import Lot wizard steps (details, upload, map, preview & import) with duplicate detection and row error report export.
MRR-011: Verification page supports scan-first workflow with progress tracking and discrepancy notes.
MRR-012: Grading page supports checklist, grade A/B/C, track assignment, estimated sell price, queue list.

## Processing & WIP
MRR-020: Track A–E Kanban with stage transitions validated by state machine and movement logs.
MRR-021: WIP jobs list supports KPIs, filters, detail modal with Diagnosis, Parts Used, Labor, History, and totals.
MRR-022: One active WIP per laptop by default.
MRR-023: Parts added/removed to WIP update stock safely and log movements.

## Sales
MRR-030: New Sale supports scan/search cart, customer info, VAT/profit summary, payment handling, invoice/receipt creation, and status changes.
MRR-031: All Sales list supports filters, export/print, VAT/profit columns.
MRR-032: Receipts list supports export and audit delete.

## Purchases
MRR-040: New Purchase supports supplier/date/ref, VAT calculation, payment status, link to lot, and cash register entry if cash.
MRR-041: All Purchases list supports filters, export, and detail modal.
MRR-042: Payments list supports export and audit delete with balance updates.

## Finance
MRR-050: Cash Register supports daily open/close, KPIs, transaction list with running balance, export/print.
MRR-051: Owner Ledger supports restricted access, KPIs, ledger table with running balance, export/audit.
MRR-052: VAT Report supports period selection, output/input VAT, net VAT payable, detailed tables, export/print.

## Master Data & Reports
MRR-060: Suppliers CRUD with TRN and export.
MRR-061: Lots list with detail, manifest print, delete constraints.
MRR-062: Reports include inventory valuation, low stock, aging, track status, WIP cost, profit, payables, receivables with export/print.

## Settings & Shell
MRR-070: Settings includes company info, currency, VAT rate, labor rate, technician rates, low stock, sequences, backup/restore, diagnostics, danger zone, and date format.
MRR-071: App shell includes loading/error screens, global search, quick scan, alerts, backup, print styles, accessibility (skip link).

## Reports
MRR-072: Reports page provides export options (Excel/CSV/JSON) and print actions for each report.

## Data Integrity & Logging
MRR-080: Concurrency-safe sequences for all barcodes/numbers.
MRR-081: Idempotency keys for create operations.
MRR-082: Movement_log and audit_log entries for critical operations.
MRR-083: VAT calculations consistent across invoices/purchases/VAT report.
