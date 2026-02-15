# Tahir ERP — Next Generation (v3) Architecture Plan

## 1) Major Version Definition: **v3 Autonomous ERP Platform**

### Purpose
Version 3 transforms the current single-process, state-centric ERP UI into an **event-driven, multi-tenant, offline-first operations platform**. The goal is to evolve from "feature-complete application" into a **scalable operating system for refurbishment businesses** that supports governance, auditability, AI-assisted workflows, and enterprise-grade integrations.

### Strategic outcome
- Move from local app state as primary source-of-truth to **durable domain event streams**.
- Support **real operational scale** (multi-branch, concurrent users, controlled period close, compliance artifacts).
- Enable **intelligent orchestration** (rules + automation + AI copilots) while preserving strict finance controls.

---

## 2) High-Impact Features and System-Level Improvements

## A. Domain Event Backbone (core breakthrough)
1. **Event Sourcing + CQRS-lite**
   - Every critical business mutation emits immutable events (`InventoryAdjusted`, `WipStageChanged`, `InvoiceIssued`, `VatReturnLocked`).
   - Read models are materialized for dashboards/reports.
2. **Replay and time-travel state reconstruction**
   - Exact historical point-in-time rebuild for forensic audits.
3. **Deterministic idempotency guarantees**
   - Global idempotency keys and command dedup for all write operations.

## B. Finance Governance Engine
1. **Pluggable posting policy engine**
   - Business events map to journal templates with validation contracts.
2. **Trial-balance sentinel jobs**
   - Continuous balancing checks; hard-stop on close if imbalance exists.
3. **Period lifecycle orchestration**
   - Open → soft-close → hard-close with approval workflow and immutable evidence package.

## C. Operations Automation Layer
1. **Rules runtime** for inventory/WIP/finance actions
   - Example: auto-escalate stalled WIP > N days; auto-provision part replenishment tasks.
2. **Workflow orchestration**
   - Durable job runners for long-running tasks (reconciliation, restore rehearsal, tax prep).
3. **Remediation playbooks**
   - One-click guided repair routines linked to diagnostics events.

## D. Multi-Tenant + Multi-Branch Capability
1. Tenant-level isolation with branch and role scopes.
2. Shared platform controls with per-tenant configuration overlays.
3. Cross-branch transfer ledgers and consolidated reporting.

## E. Data Platform and Analytics Upgrade
1. **Operational store + analytical warehouse feed**.
2. **Near real-time KPI projections** with anomaly detection.
3. **Versioned report definitions** to preserve reproducibility of exported financials.

## F. Integration and Extensibility
1. **Public API v1** with versioned contracts and webhook subscriptions.
2. Outbound integration adapters (marketplaces, accounting packages, BI tools).
3. Signed export bundles and ingestion receipts for compliance workflows.

## G. Experience Modernization
1. **Task-centric workspace** (role-specific home surfaces).
2. **Global command bus** for keyboard/operator workflows.
3. Explainable AI assistant for recommendations (with audit trace references).

---

## 3) Required Architectural Changes

## A. Module decomposition
Introduce bounded contexts with explicit contracts:
- `inventory-core`
- `receiving-core`
- `wip-core`
- `sales-core`
- `purchasing-core`
- `finance-ledger-core`
- `reporting-readmodels`
- `governance-compliance`
- `automation-rules`

Each context owns:
- command handlers
- domain events
- projection handlers
- policy validations

## B. Data flow evolution
### Current
UI → reducer/state mutation → derived selectors.

### v3 target
UI/API → Command API → Domain validation → Event store append → Projection updates → Query API/read models.

This decouples write correctness from read performance.

## C. Service/API topology
1. **Gateway API**
   - AuthN/AuthZ, throttling, tenant routing.
2. **Command service**
   - Handles intent, enforces invariants, emits events.
3. **Projection service**
   - Builds query-optimized read models.
4. **Reporting service**
   - Deterministic report generation from versioned projections.
5. **Automation worker**
   - Async rule execution and scheduled jobs.

## D. Storage strategy
- Event store (append-only) for domain facts.
- Relational read store for transactional querying.
- Analytical store for BI and long-horizon metrics.
- Object storage for signed export/evidence artifacts.

## E. Front-end architecture shift
1. Introduce **query/mutation data layer** (cache + sync policy).
2. Replace monolithic app-state dependency with domain query hooks.
3. Add resilient offline command queue with deterministic replay against server acknowledgments.

## F. Infrastructure modernization
1. Containerized microservices with internal event bus.
2. Blue/green deployment strategy for zero-downtime upgrades.
3. OpenTelemetry tracing + structured logs + SLO dashboards.

---

## 4) Migration and Backward-Compatibility Strategy

## A. Strangler migration pattern
- Keep existing app behavior operational while routing selected capabilities to new v3 services incrementally.
- Start with read-only modules (reports projections), then controlled write domains.

## B. Compatibility layers
1. **Legacy state adapter**
   - Converts existing reducer actions into v3 commands.
2. **Dual-write phase**
   - For selected domains, write to old store and new event backbone, reconcile drift.
3. **Read model parity tests**
   - Snapshot comparisons between legacy selectors and v3 projections.

## C. Data migration
1. Historical backfill pipeline:
   - Convert existing records into canonical bootstrapped events.
2. Migration ledger:
   - Every migrated batch gets checksums, row counts, and validation signatures.

## D. Backward compatibility guardrails
- API versioning (`/api/v1`, `/api/v2`).
- Report schema version tags.
- Feature flags for tenant/branch phased enablement.
- Rollback plan: projection rebuild from event snapshots and feature-flag revert.

---

## 5) Risks, Trade-offs, and Rationale

1. **Complexity increase (trade-off)**
   - Event-driven architecture is harder to reason about than local reducer mutations.
   - **Rationale:** necessary for audit-grade traceability and multi-tenant scale.

2. **Higher infrastructure footprint (trade-off)**
   - More services, observability stack, queueing systems.
   - **Rationale:** enables isolation, independent scaling, reliability SLOs.

3. **Migration risk (critical)**
   - Dual-write drift and semantic mismatches.
   - **Mitigation:** contract tests, parity snapshots, migration ledgers, staged rollout.

4. **Team capability gap (risk)**
   - Requires domain modeling, distributed systems discipline.
   - **Mitigation:** architecture guild, ADR process, domain ownership map.

5. **Latency and consistency trade-offs**
   - Eventual consistency between command completion and read model visibility.
   - **Rationale:** acceptable with UX hints + optimistic updates + read-your-writes scopes where needed.

6. **Governance overhead**
   - More formal release and compliance gates.
   - **Rationale:** aligns with finance-critical ERP requirements and reduces operational incidents.

---

## 6) Phased Implementation Roadmap

## Phase 0 — Foundations (2–4 weeks)
- Define canonical domain events and command contracts.
- Add ADR templates, release gates, observability baseline.
- Build compatibility test harness and migration ledger scaffolding.

## Phase 1 — Reporting & Read Model Pilot (4–6 weeks)
- Stand up event store + projection service.
- Implement reporting read model for receivables/payables/cashflow.
- Run parity tests against legacy report selectors.

## Phase 2 — Finance Correctness Core (6–8 weeks)
- Introduce posting policy engine + trial balance sentinel.
- Implement period lifecycle workflow (soft-close/hard-close).
- Ship immutable evidence bundle generator.

## Phase 3 — WIP/Inventory Command Migration (8–10 weeks)
- Route inventory and WIP actions through command service.
- Enable automation rules for bottleneck detection and replenishment triggers.
- Launch operator command bus and workflow queue.

## Phase 4 — Multi-Tenant and Integrations (8–12 weeks)
- Tenant/branch isolation model and role matrix.
- API v1 + webhook engine + integration adapters.
- Introduce signed export/import protocol.

## Phase 5 — Cutover and Optimization (4–6 weeks)
- Gradually disable legacy mutation paths behind flags.
- Performance tuning (projection lag, queue throughput, cache hit rates).
- SLO hardening and production readiness certification.

---

## Success Metrics for v3
- 99.9% command processing reliability.
- < 2s p95 read-model freshness for operational dashboards.
- Zero unresolved trial-balance mismatches at period close.
- < 30 min tenant recovery RTO using event replay + snapshot restore.
- > 80% of high-volume workflows automated through rule engine/playbooks.
