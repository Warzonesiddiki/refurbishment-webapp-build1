# Laptop Refurbishment ERP — Full Solution on Microsoft Power Platform

## Platform Selection
This implementation is adapted to **Microsoft Power Platform**:
- **Dataverse** for data layer
- **Model-driven app** + targeted **Canvas pages** for UI
- **Power Automate cloud flows** for automation and notifications
- **Dataverse security roles + business units + column security** for RBAC/RLS

---

## 1) High-Level Architecture Overview

## Data Layer (Dataverse)
- Dataverse table per entity from Batches 1–5.
- Choice columns for all enums.
- Lookups for all FK relationships.
- Formula/calculated/rollup columns where appropriate.
- Soft delete strategy via `IsDeleted` boolean columns.

## Logic Layer (Power Automate + Dataverse Business Rules)
- Event-driven flows for create/update transitions.
- Scheduled flows for SLA monitoring and escalation.
- Business rules for immediate UI/form validation.
- Optional plugin/custom API only for heavy transaction/atomic edge cases.

## UI Layer (Model-driven + Canvas)
- Model-driven app for operational back-office.
- Canvas app pages for mobile-heavy flows (scanner, GRN, QC1).
- Role-specific navigation and views.
- Embedded Power BI for heavy analytics dashboards.

## Security Layer
- Dataverse security roles for CRUD privileges.
- Team ownership + business units for department scoping.
- Column security profiles for cost/finance field visibility.
- App-level audience targeting to hide disallowed modules.

---

## 2) Implementation Details by Phase

## Phase 1 — Foundation (Week 1-2)
1. Create tables in exact order specified.
2. Define global choices (all enum sets).
3. Add lookups and relationship behavior (restrict/cascade as required).
4. Add computed fields:
   - Rollups: counts/totals
   - Calculated fields: SLA deadline, totals, warranty formulas
5. Seed data using Dataflows/Excel import:
   - Departments, Roles, Settings, ChecklistTemplates
6. Create test users in Microsoft Entra ID and map to Dataverse Users.
7. Configure authentication (AAD native) and user-to-role/team mapping.

## Phase 2 — Core Operational Screens (Week 3-4)
- Build Login/Home (model-driven landing + role-aware nav).
- Build Search/Scanner as Canvas page with camera barcode control.
- Build Lot Management + Manifest Import (Dataverse + import flow).
- Build GRN mobile scan screen (Canvas).
- Build QC1 mobile checklist screen (Canvas).
- Build Unit Detail form with tabs/subgrids.

## Phase 3 — Ticketing & Track Workflow (Week 5-6)
- Build Ticket Detail with tabs:
  Details, Checklist, Parts, History, Cost.
- Build Track A–E views using model-driven filtered views.
- Build Kanban using custom PCF component or Board control.
- Implement lifecycle flows (status handlers, routing, rework, approvals).
- Implement parts stock movement and UCL updates.

## Phase 4 — Sales, Finance & RMA (Week 7-8)
- Build Customer/Supplier CRUD forms.
- Build Sales Order allocation and dispatch flow.
- Build RMA lifecycle flows and forms.
- Build Purchases/Payments screens and validation checks.
- Implement warranty and allocation constraints.

## Phase 5 — Dashboards, Reports & Notifications (Week 9-10)
- Build KPI dashboards in model-driven dashboards + Power BI.
- Build department dashboard with per-team filters.
- Build reports (Lot, Throughput, SLA, QC, parts, customer).
- Configure scheduled SLA flow every 15–30 min.
- Add CSV/Excel exports from views and paginated reports.
- Add barcode label print (Power Apps + Word template or Zebra integration).

## Phase 6 — Security, Polish & Launch (Week 11-12)
- Finalize role permissions and table privileges.
- Add row-level filtering via ownership/team/business unit.
- Add column security profiles for cost/privacy partitions.
- Build Admin Settings/UAM screens.
- Execute RBAC/UAT/performance tests; run go-live checklist.

---

## 3) Automations (1–14) on Power Platform

| # | Tool | Trigger | Core Actions | Error Handling |
|---|---|---|---|---|
| 1 Manifest Import | Power Automate | File uploaded to Lot | Parse rows → validate barcode → create Unit + UCL | Per-row try/catch scope; log failed rows |
| 2 GRN Scan | Canvas + Flow | Barcode submit | Match unit in lot → create GRNLine → set Unit Received | If unmatched, mark Unexpected and notify |
| 3 GRN Completion | Power Automate | GRN status=Completed | Generate Shortage/Excess discrepancies, update lot counts/status | Transaction scopes + compensating updates |
| 4 QC1 Completion | Power Automate | QC1 ticket/result saved | Create QCResult, update Unit, grade mismatch check, create track ticket(s), SLA/checklist seed | Reject partial checklist with business rule |
| 5 Ticket Status Handler | Power Automate | Ticket status changed | Set timestamps, log TicketHistory, create notifications, invoke route/rework helpers | Guard invalid transitions and write AuditLog |
| 6 Next Ticket Routing | Child Flow | Called on completion | Create next ticket by routing tree (A/B/C/D/E logic) | Validate prerequisite checks before create |
| 7 Rework Handling | Child Flow | Test L1/L2 failed | Increment ReworkCount, create repair or quarantine | If threshold reached, block ticket and escalate |
| 8 Cost Approval Gate | Power Automate | Est cost updated | If > threshold, status→PendingApproval, notify approvers | Prevent InProgress until Approved |
| 9 Parts Stock Mgmt | Power Automate | TicketPart create/update | Reserved/Used/Returned/RemovedFromUnit stock math + UCL | Reject negative/over-reserve with rollback |
|10 SLA Monitoring | Scheduled Flow | Every 15-30 min | AtRisk/Breached/Escalated notifications and flags | Deduplicate notifications by ticket+stage |
|11 Sales Allocation Validation | Power Automate | SOLine Unit set | Validate RFS + not allocated + qty ceiling; set unit allocated | Reject with explicit reason |
|12 Dispatch Processing | Power Automate | Record Dispatch action | Set units Sold + warranty dates, update SO status | Partial shipment branch + audit entry |
|13 Audit Logging | Dataverse Audit + Flow | On key entity change | Write normalized AuditLog entries | Fallback to built-in Dataverse auditing |
|14 Low Stock Alert | Power Automate | Part qty change | If available <= reorder create notifications | Suppress repeat alerts with cooldown |

---

## 4) Screen-by-Screen Build Plan (1–18)

| Screen | Component Type | Data Source | Key UI | Actions |
|---|---|---|---|---|
| 1 Login/Home | Model-driven home | Users/Tickets | Role cards + quick stats | Role nav routing |
| 2 Global Dashboard | Dashboard + Power BI | Units/Tickets/Lots/Parts | KPI cards + charts + escalations list | Drill to ticket/lot/unit |
| 3 Dept Dashboard | Dashboard | Tickets by dept | Team workload + SLA | Bulk assign |
| 4 Search/Scanner | Canvas [Mobile] | Units/Tickets/Lots | Barcode scan + summary tabs | Create ticket, print label |
| 5 Lot Mgmt | Model-driven forms | Lots/Units/GRNs | Lot header + tabs | Import manifest, create GRN |
| 6 GRN Receiving | Canvas [Mobile] | GRNs/GRNLines/Units | Rapid scan queue + counters | Complete GRN |
| 7 QC1 Inspection | Canvas [Mobile] | Units/QC/Tickets | Full checklist sections | Save QC1 + auto route |
| 8 Track Views A-E | Model-driven views | Tickets/Units | Filtered queue tables/cards | Assign/status/bulk priority |
| 9 Ticket Kanban | PCF board/custom page | Tickets | Status columns | Drag/drop with transition checks |
|10 Ticket Detail | Model-driven form | Tickets + child tables | Tabs: details/checklist/parts/history/cost | Start/Complete/Fail/Approve |
|11 Unit Detail | Model-driven form | Units + related | Specs + lifecycle timeline | Print label, allocate |
|12 Parts Inventory | Model-driven + Canvas mobile | Parts/TicketParts | Stock grids + low-stock panel | Issue/return/harvest |
|13 Sales Orders | Model-driven forms | SO/SOLines/Units | Allocation table + dispatch section | Allocate/deallocate/dispatch |
|14 Customer/Supplier | Model-driven forms | Customers/Suppliers | Standard CRUD + history tabs | Link orders/lots/payments |
|15 RMA Mgmt | Model-driven forms | RMAs/Units/Tickets | RMA timeline + warranty flags | Receive/repair/ship/close |
|16 Finance & Payments | Model-driven + BI | Purchases/Payments/UCL | Payables/receivables/profit | Export reports |
|17 Admin/Settings | Model-driven admin app | Users/Roles/Settings/Templates | UAM + checklist manager + audit viewer | Role map + settings updates |
|18 Reports | Power BI + paginated | Warehouse model | Prebuilt operational/financial reports | Date filters + CSV/XLSX |

---

## 5) RBAC and Row-Level Security on Power Platform

- **Security Roles**: Create 9 roles matching AccessLevel matrix.
- **Business Units/Teams**:
  - Department-owned records for department scoping.
  - Team membership drives DeptHead/SeniorTech visibility.
- **Record ownership model**:
  - Tickets owned by department team or assigned user.
  - Units scoped by current department/team where required.
- **Column security profiles**:
  - Hide cost/repair/financial columns from technician roles.
- **App modules**:
  - Separate apps (Ops, Sales, Finance, Admin) for navigation hardening.

---

## 6) Platform Limitations & Workarounds

1. **High-concurrency stock updates** in pure flows can race.
   - Workaround: Dataverse custom action/plugin for atomic stock mutation.
2. **Complex Kanban drag-drop constraints** are limited in out-of-box controls.
   - Workaround: PCF board control with transition validation.
3. **Very large analytics** can slow direct Dataverse dashboards.
   - Workaround: Power BI dataset with incremental refresh.
4. **Advanced barcode label printing** may require external connector.
   - Workaround: use Word template/PDF first, then Zebra API integration.
5. **Large manifest imports (500+)** via UI can be slow.
   - Workaround: async import flow with job status table + retry support.

---

## 7) Assumptions

- `[REPLACE_WITH_PLATFORM_NAME]` is interpreted as **Microsoft Power Platform**.
- Single legal entity / warehouse in initial rollout, multi-site future-ready.
- AAD identities exist for all users before go-live.
- Email/Teams notifications are acceptable operational channels.

---

## 8) Clarifying Questions

1. Should we enforce strict department ownership on `Units`, or allow cross-department read for all operational heads?
2. Do you want **Teams** notifications, **Email**, or both as default for escalations?
3. For barcode labels, do you need **Zebra/ZPL** native output now, or PDF label sheets first?
4. Should financial margin fields be visible to OpsManager only, or also to DeptHeads?
5. For Track B full disassembly approval, do you require dual approval (DeptHead + Ops) or single approver is enough?
