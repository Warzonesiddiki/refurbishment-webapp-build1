# Traceability Matrix (TM) v1.4

| Req ID | UI | API | DB | Tests | UAT |
|---|---|---|---|---|---|
| MRR-001 | Inventory Laptops page | /api/laptops | laptops | unit+int+e2e | UAT-INV-1 |
| MRR-002 | Inventory Parts page | /api/parts | parts | unit+int+e2e | UAT-INV-2 |
| MRR-003 | n/a (logic) | /api/parts | parts | unit (stockInvariant) | UAT-INV-3 |
| MRR-004 | n/a (logic/UI badge) | /api/parts | parts | unit (stockInvariant) | UAT-INV-4 |
| MRR-010 | Import Lot wizard | /api/lots/import | lots, laptops | int+e2e | UAT-REC-1 |
| MRR-011 | Verification page | /api/lots/verify | lots, movement_log | int+e2e | UAT-REC-2 |
| MRR-012 | Grading page | /api/laptops/grade | laptops, movement_log | int+e2e | UAT-REC-3 |
| MRR-020 | Processing Tracks | /api/tracks/move | laptops, movement_log | unit+int | UAT-PROC-1 |
| MRR-021 | WIP Jobs | /api/wip | wip_jobs, wip_parts | unit+int+e2e | UAT-WIP-1 |
| MRR-022 | n/a (logic) | /api/wip | wip_jobs | unit | UAT-WIP-2 |
| MRR-023 | n/a (logic) | /api/wip/:id/parts | parts, wip_parts | unit+int | UAT-WIP-3 |
| MRR-030 | Sales New | /api/sales | sales, sale_items, receipts | unit+int+e2e | UAT-SALES-1 |
| MRR-031 | All Sales list | /api/sales | sales | int | UAT-SALES-2 |
| MRR-032 | Receipts list | /api/sales/:id/receipts | receipts | int | UAT-SALES-3 |
| MRR-040 | New Purchase | /api/purchases | purchases | unit+int | UAT-PUR-1 |
| MRR-041 | All Purchases | /api/purchases | purchases | int | UAT-PUR-2 |
| MRR-042 | Payments list | /api/purchases/:id/payments | payments | int | UAT-PUR-3 |
| MRR-050 | Cash Register | /api/cash | cash_register_entries | int | UAT-FIN-1 |
| MRR-051 | Owner Ledger | /api/owner-ledger | owner_ledger_entries | int | UAT-FIN-2 |
| MRR-052 | VAT Report | /api/vat | sales, purchases | unit+int+e2e | UAT-FIN-3 |
| MRR-070 | Settings | /api/settings | companies, users | unit+int | UAT-SET-1 |
| MRR-071 | App Shell | n/a | n/a | unit | UAT-SHELL-1 |
| MRR-072 | Reports | /api/reports | sales, purchases, laptops, parts | unit+int | UAT-REP-1 |
| MRR-080 | Sequences | /api/sequences | sequences | unit (domainSequences) | UAT-SEQ-1 |
| MRR-081 | Idempotency | /api/* (creates) | idempotency_keys | unit (idempotency) | UAT-IDEM-1 |
| MRR-082 | Movement/Audit logs | /api/* critical | movement_log, audit_log | unit (loggingHooks) | UAT-LOG-1 |
| MRR-083 | VAT math consistency | /api/vat, /api/sales, /api/purchases | sales, purchases | unit (vatMath) | UAT-VAT-1 |
