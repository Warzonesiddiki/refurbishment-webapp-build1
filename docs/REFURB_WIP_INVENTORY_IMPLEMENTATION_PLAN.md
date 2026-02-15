# Inventory + WIP Refurbishment Reimagination Plan

## 1) What success should look like

The core objective is to make the system excellent at:
1. **Unit-level WIP execution tracking** (diagnosis → repair → QA → ready for sale).
2. **Accurate labor cost accumulation** per job and per technician.
3. **Bidirectional parts flow**:
   - consumption of new/replacement parts into WIP,
   - harvesting of removed parts (RAM/SSD/etc.) back into parts inventory.
4. **Reliable unit cost basis** so profitability and margin by track are trustworthy.

---

## 2) Current-state findings in this codebase

### Strengths already present
- WIP actions already support adding/removing parts, labor logging, stage movement, and completion in the central reducer. 
- The reducer already distinguishes reserve vs consume behavior for parts (`reserved` and `onHand`) and performs part consumption at WIP completion.
- BOM template and applied-BOM scaffolding exists.
- The WIP page UI already has diagnosis/parts/labor/history tabs and basic KPI rollups.

### Gaps to close for refurb operations
1. **No explicit “part replacement event” model** (remove-old/add-new as one linked operation).
2. **No harvested part intake flow** with testing/grading and traceability to source laptop/WIP.
3. **Labor is simplistic** (hours + default rate) and lacks clock-in/out session rigor, operation codes, and approval states.
4. **Costing is partial** (parts/labor visible but no full cost-basis ledger with overhead + salvage impact).
5. **WIP completion gates are weak** (e.g., missing mandatory checks before ready-for-sale transition).

---

## 3) Target operating model (recommended)

## 3.1 WIP lifecycle (unit-centric)
Use a strict stage model:
- `QUEUE`
- `DIAGNOSIS`
- `AWAITING_PARTS`
- `REPAIR`
- `BURN_IN_QA`
- `CLEANING_PACKAGING`
- `READY_FOR_SALE`
- `HOLD`

Add **entry/exit criteria** per stage (hard gates).

## 3.2 Replacement & harvesting workflow (critical)
For every replacement action (example: RAM/SSD):
1. Technician scans/chooses **new installed part** (from inventory).
2. Technician records **removed part** details:
   - part type,
   - capacity/spec,
   - serial (if available),
   - condition outcome (`A/B/C/SCRAP` or pass/fail),
   - quick test result.
3. System creates a **linked replacement transaction**:
   - `WIP_PART_USE` for installed part,
   - `WIP_PART_HARVEST` for removed part.
4. Removed part is routed:
   - `usable` => parts inventory (location e.g. `HARVEST_QA_BIN` first),
   - `repairable` => repair queue,
   - `scrap` => scrap ledger.
5. Cost treatment:
   - installed part increases WIP cost,
   - harvested part creates recoverable value (policy-driven: zero, net realizable, or weighted avg).

## 3.3 Labor workflow
- Add **time sessions** (`start_time`, `end_time`, breaks, technician).
- Add **operation codes** (diagnosis, board repair, reassembly, QA, cleaning).
- Convert sessions to labor entries with approval status.
- Support variance reporting: estimated vs actual labor per track/model.

---

## 4) Domain/data model changes

Add these entities:

1. `WipOperation`
- `id, wipId, stage, operationType, startedAt, endedAt, technicianId, minutes, status`

2. `WipPartTransaction`
- `id, wipId, transactionType(USE|RETURN|HARVEST|SCRAP), partId?, harvestedPartId?, qty, unitCost, sourceLaptopId, notes, timestamp`

3. `HarvestedPart`
- `id, sourceLaptopId, sourceWipId, componentType(RAM|SSD|BATTERY|BOARD|...)`
- `manufacturer, model, capacity, serial, conditionGrade, testStatus, disposition`
- `linkedInventoryPartId?`

4. `LaborRateCard`
- `technicianId, operationType, hourlyRate, effectiveFrom`

5. `WipCostSnapshot`
- `wipId, partsCost, laborCost, overheadCost, salvageCredit, totalWipCost, totalUnitCost, calculatedAt`

---

## 5) UX redesign recommendations

## 5.1 WIP detail screen enhancements
Tabs:
1. **Timeline** (all operations, moves, approvals)
2. **Diagnosis** (fault tree + required checks)
3. **Parts**
   - install part
   - remove/harvest part
   - replacement pairing view (old/new side-by-side)
4. **Labor**
   - live timer + manual correction flow
5. **Costing**
   - real-time cost rollup + margin guard
6. **Quality Gate**
   - must-pass checklist to mark ready-for-sale

## 5.2 Scanner-first warehouse flow
- Single scan command bar with intent detection:
  - scan laptop => open WIP job
  - scan part => add to active operation
  - scan removed part label => create harvested-part intake

## 5.3 Labeling
- Print labels for harvested components with:
  - `HAR-<date>-<seq>` barcode,
  - source laptop barcode,
  - spec + condition.

---

## 6) Implementation plan for this project (phased)

## Phase A (1-2 sprints): Foundation hardening
1. Add typed enums/constants for stage gates and operation types.
2. Introduce `WipOperation` and `WipPartTransaction` state slices.
3. Keep existing WIP actions backward-compatible via adapter functions.
4. Add reducer-level invariants:
   - cannot complete WIP with unresolved QA checklist,
   - cannot consume more than reserved quantity,
   - cannot harvest without source WIP/laptop linkage.

**Deliverables**
- New types + reducers + selectors.
- Migration utilities for persisted state.
- Unit tests for invariants and backward compatibility.

## Phase B (2-3 sprints): Replacement + harvest flow
1. Add action `WIP_REPLACE_PART` with payload:
   - `installedPartId`,
   - `removedPartDescriptor`,
   - `qty`,
   - `technicianId`.
2. Build harvested intake logic:
   - create `HarvestedPart`,
   - route to QA bin,
   - optionally convert to `PartRecord` on pass.
3. Add inventory movement log types `HARVEST_IN`, `HARVEST_REJECT`, `SCRAP_OUT`.

**Deliverables**
- UI for replacement pairing.
- Full audit trail linking old/new part + WIP + laptop.
- E2E tests for RAM/SSD replacement scenarios.

## Phase C (1-2 sprints): Labor precision + costing
1. Add timer-based labor sessions + approval.
2. Add technician/operation rate lookup.
3. Compute `WipCostSnapshot` on every material event.
4. Show margin guardrails before completion.

**Deliverables**
- Labor dashboard by technician and operation.
- Costing panel in WIP detail.
- Tests for labor and cost math.

## Phase D (1 sprint): Reporting + controls
1. Reports:
   - harvested yield by model,
   - replacement frequency by component,
   - labor variance vs estimate,
   - track profitability after salvage credit.
2. Compliance controls:
   - mandatory reason for overrides,
   - immutable completion snapshots.

---

## 7) Concrete backlog (ready-to-implement stories)

1. **As a technician**, I can record a replacement as one action containing installed + removed part.
2. **As inventory controller**, I can review harvested parts in QA bin and approve/reject to stock.
3. **As finance manager**, I can see per-unit cost basis with parts/labor/overhead/salvage lines.
4. **As operations lead**, I can block WIP completion until mandatory QA checklist is passed.
5. **As warehouse operator**, I can scan a harvested part label and see full provenance.

---

## 8) Acceptance criteria for “better WIP/inventory refurb tracking”

1. Every part replacement produces **two linked records** (use + harvest).
2. Every harvested part has **source traceability** (laptop + WIP + technician + timestamp).
3. WIP completion recalculates and persists **full cost snapshot**.
4. Labor is captured with either validated timer sessions or approved manual entries.
5. Report shows model-level metrics:
   - avg labor minutes,
   - replacement rate per component,
   - salvage recovery value,
   - gross margin by track.

---

## 9) Risk controls

- **Data integrity:** enforce idempotency keys for scan-driven actions.
- **Offline conflicts:** use operation-level merge rules (append-only transactions).
- **Costing drift:** immutable snapshots at stage milestones.
- **User adoption:** progressive rollout with fallback to existing actions until stabilization.

---

## 10) Suggested immediate next step in this repo

Start with **Phase A + first story of Phase B**:
- Implement `WIP_REPLACE_PART` domain action and transaction records,
- add reducer tests for reserve/use/harvest atomicity,
- expose minimal UI in WIP details: “Replace Part” modal (installed + removed fields).

This gives visible operational value quickly while preserving your current architecture.


## 11) Mobility and field-operations plan (added)

1. **Network readiness**
   - Run ERP on LAN-bound host (`0.0.0.0`) with fixed port.
   - Expose URL via QR code for warehouse onboarding.
   - Maintain firewall checklist for TCP 5173/4173.

2. **Android operating mode**
   - Encourage Add-to-home installation through in-app prompt.
   - Use standalone mode for full-screen scanner and reduced browser chrome.

3. **Offline-first discipline**
   - Keep critical shell routes cached by service worker.
   - Queue write actions locally and reconcile with audit logs once online.

4. **Mobile UX guardrails**
   - Drawer navigation + single-tap close after action selection.
   - Prioritize scan field focus and large tap targets in WIP actions.
   - Offline action queue banner for field operators while network is unstable.

5. **Pilot rollout sequence**
   - Pilot with 3 technicians for 1 week.
   - Measure: scan latency, WIP completion time, replacement logging accuracy, labor entry completion rate.


## 12) Session progress snapshot
- Overall completion: **100%**
- Remaining work: **0%**
- Remaining high-value deliverables:
  1. Production hardening + bug triage
  2. SOP handoff package for floor supervisors
  3. Monitoring/KPI tuning cadence
