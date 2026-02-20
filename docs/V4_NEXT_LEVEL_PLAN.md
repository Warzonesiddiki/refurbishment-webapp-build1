# V4 Focus Plan — Inventory Processing & WIP Excellence

## 1) Scope Lock (What V4 Includes)

V4 is strictly focused on two domains:

1. **Inventory Processing**
2. **WIP (Work-in-Progress) Control**

Everything else (sales, HR, broad analytics platform, marketplace, etc.) is out-of-scope for this V4 cycle unless it is directly required to improve inventory/WIP outcomes.

---

## 2) North-Star Goals for V4

### Business Outcomes

- Reduce end-to-end inventory processing lead time by **40%**.
- Increase WIP flow efficiency by **35%**.
- Reduce inventory reconciliation mismatches by **80%**.
- Cut inventory aging in WIP buffers by **30%**.

### Operational Outcomes

- 99.95% availability for inventory + WIP core workflows.
- 100% traceability from intake → WIP stage → completion/disposition.
- p95 inventory lookup latency < 200ms.
- p95 WIP state transition write latency < 300ms.

---

## 3) Domain Model (V4-Only)

## 3.1 Inventory Processing Domain

### Core Subsections

1. **Inbound Intake**
   - Receiving batches
   - Barcode/serial capture
   - Source/vendor attribution

2. **Validation & Grading**
   - Condition grading (A/B/C/Reject)
   - Missing components detection
   - Quality gate outcomes

3. **Inventory Classification**
   - SKU normalization
   - Category mapping
   - Refurbishment path assignment

4. **Location & Bin Management**
   - Warehouse/zone/bin precision
   - Movement tracking
   - Lost/misplaced item detection

5. **Availability & Reservation Engine**
   - Real-time available vs reserved quantities
   - WIP hold logic
   - Conflict-safe reservation updates

6. **Inventory Reconciliation**
   - Cycle count workflows
   - Variance tracking
   - Auto-generated discrepancy tasks

## 3.2 WIP Domain

### Core Subsections

1. **WIP Queue Orchestration**
   - Intake queue
   - Diagnosis queue
   - Repair queue
   - QA queue
   - Ready-for-disposition queue

2. **Stage Transition Governance**
   - Mandatory checks per stage
   - Digital sign-off for critical transitions
   - Rework loops with reason codes

3. **Technician Workload Balancing**
   - Skill-based assignment
   - Throughput-aware queue distribution
   - SLA-risk prioritization

4. **Parts Dependency Tracking**
   - Parts needed vs available state
   - Shortage blockers
   - ETA-aware WIP prioritization

5. **WIP Aging & Bottleneck Detection**
   - Stage aging thresholds
   - Queue congestion alerts
   - Bottleneck root-cause tagging

6. **Completion, Scrap, and Return Paths**
   - Completion readiness checks
   - Scrap authorization flow
   - Return-to-vendor/rework routing

---

## 4) V4 Architecture (Constrained to Inventory + WIP)

### Services

- **inventory-service**
- **wip-service**
- **inventory-events-worker**
- **wip-optimization-worker**

### Data Stores

- PostgreSQL for source-of-truth inventory/WIP transactions.
- Redis for short-lived reservations, queue priority cache, and lock coordination.

### Event Backbone

- Domain events only for inventory and WIP transitions:
  - `inventory.received`
  - `inventory.validated`
  - `inventory.classified`
  - `inventory.moved`
  - `inventory.reconciled`
  - `wip.stage.entered`
  - `wip.stage.exited`
  - `wip.blocked.parts`
  - `wip.rework.started`
  - `wip.completed`

### UI Surfaces

- Inventory command center (receiving, movement, reconciliation).
- WIP command center (queues, blockers, aging, technician load).

---

## 5) Inventory Processing Workstreams

## 5.1 Inbound Digitization

- Mandatory scan-first intake.
- Batch integrity validation.
- Duplicate serial/asset detection.

## 5.2 Quality & Classification Automation

- Rule engine for grading consistency.
- Required evidence attachment (images/checklist).
- Auto-routing to WIP path by grade + category.

## 5.3 Inventory Accuracy Program

- Cycle count scheduler by risk profile.
- Reconciliation variance heatmaps.
- Zero-touch reconciliation for low-risk matches.

## 5.4 Location Integrity

- Bin-level movement enforcement.
- Ghost inventory detection jobs.
- Aisle/bin audit trails.

---

## 6) WIP Workstreams

## 6.1 Flow Control

- Explicit WIP stage model with finite allowed transitions.
- Hard validation before stage exit.
- No silent stage skipping.

## 6.2 Bottleneck Intelligence

- Real-time queue depth and wait-time metrics.
- Stage capacity forecasting (next 24h / 7d).
- Alerting on SLA breach probability.

## 6.3 Parts-Constrained Scheduling

- WIP blocker reasons standardized.
- Priority boost when all dependencies become available.
- Dynamic resequencing to maximize throughput.

## 6.4 Rework Reduction

- Capture first-pass failure codes.
- Link failures to technician/process/parts cohorts.
- Weekly rework reduction actions and owner tracking.

---

## 7) KPI System (Inventory + WIP Only)

### Inventory KPIs

- Intake-to-available lead time.
- Inventory record accuracy.
- Reconciliation variance rate.
- Bin/location mismatch incidents.

### WIP KPIs

- Stage cycle time by queue.
- WIP aging distribution (p50/p90/p99).
- Bottleneck recurrence rate.
- First-pass completion rate.
- Rework rate.

### Joint KPIs

- Throughput per day/week.
- Blocked-item percentage.
- Dependency wait-time share of total cycle time.

---

## 8) Execution Roadmap (Focused)

## Phase A (Weeks 0–4): Baseline and Control

- Lock data model for inventory + WIP entities.
- Define stage machine and allowed transitions.
- Instrument baseline metrics and dashboards.

### Exit Criteria

- Baseline KPIs visible in shared dashboard.
- WIP stage transitions validated by policy checks.

## Phase B (Weeks 5–10): Inventory Processing Hardening

- Deploy intake digitization and validation gates.
- Ship location/bin movement tracking.
- Launch reconciliation workflows and variance queue.

### Exit Criteria

- > 95% scan-first intake compliance.
- Reconciliation variance triage workflow active.

## Phase C (Weeks 11–16): WIP Flow Optimization

- Roll out queue orchestration and blocker taxonomy.
- Deploy bottleneck alerts and workload balancing.
- Enable parts-constrained dynamic resequencing.

### Exit Criteria

- WIP aging reduced by measurable baseline delta.
- Stage bottleneck alerts integrated into daily ops.

## Phase D (Weeks 17–24): Stabilization and Scale

- Fine-tune SLA thresholds and priority rules.
- Execute process hardening for first-pass completion.
- Close major variance/rework root causes.

### Exit Criteria

- Target cycle-time and rework improvements reached.
- Operational review certifies process repeatability.

---

## 9) Governance Model for This V4

- **Inventory Lead:** accountable for intake, classification, reconciliation.
- **WIP Lead:** accountable for flow, blockers, stage policy.
- **Platform Lead:** accountable for reliability, instrumentation, deployment safety.
- **Daily Ops Review:** queue health, blockers, SLA risk.
- **Weekly Improvement Review:** root causes, action completion, KPI drift.

Decision rule: If a feature does not improve inventory processing or WIP control metrics, it is deferred.

---

## 10) Top 20 Priority Backlog (Inventory/WIP)

1. Canonical inventory entity and lifecycle schema.
2. Canonical WIP stage-state machine.
3. Scan-first intake API + UI enforcement.
4. Duplicate serial detection service.
5. Grade/routing rule engine.
6. Bin movement event capture.
7. Inventory reservation conflict guard.
8. Reconciliation variance workflow.
9. Cycle count scheduler.
10. WIP blocker taxonomy and reason codes.
11. Queue depth + wait-time observability.
12. Stage transition policy checks.
13. Technician assignment balancing logic.
14. Parts dependency visibility panel.
15. SLA breach probability alerting.
16. Rework tracking and cohort analytics.
17. Completion readiness checklist automation.
18. Scrap/rework authorization workflow.
19. Daily command-center dashboard.
20. Weekly KPI drift and corrective-action report.

---

## 11) Definition of Done (V4)

V4 is complete when:

- Inventory processing and WIP are fully traceable end-to-end.
- KPI targets for lead time, accuracy, WIP aging, and rework show sustained improvement.
- Queue and stage controls prevent uncontrolled state drift.
- Operations can detect and resolve bottlenecks with data-backed actions.

This V4 plan intentionally excludes unrelated expansion and concentrates all investment on inventory processing and WIP outcomes.
