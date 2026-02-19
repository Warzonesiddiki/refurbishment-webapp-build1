# Project Status & Pending Worklog

Last updated: 2026-02-13 (UTC)

## Purpose

This document is the handoff/source-of-truth for current implementation status, verified capabilities, and pending work so any developer or AI agent can continue delivery without re-discovery.

---

## 0) Overall Completion Snapshot (Estimated)

- **Estimated overall project completion: 84%**
- **Estimated finance/accounting readiness: 80%**
- **Estimated platform/runtime hardening: 78%**
- **Estimated UX/workflow completeness: 88%**

### Estimation basis

- Completed implemented modules, tests, and deployment/tooling readiness are scored against the pending roadmap in this document.
- Remaining gap is concentrated in production hardening, security posture, and backend/data cutover depth (finance parity controls, period-close governance, deeper reporting packs, and tax filing evidence exports).
- A weighted project completion calculator and finance readiness scorer are now available under `src/utils/projectCompletion.ts` and `src/utils/financeReadiness.ts` to keep percentages repeatable.
- A completion roadmap builder (`src/utils/completionRoadmap.ts`) now prioritizes high-impact remaining work using readiness signals.
- Forecasting support is included to estimate sprints remaining to a **95% target completion** based on configurable delivery velocity.
- A project completion readiness panel is now surfaced in Reports for in-app visibility of overall %, finance %, forecast-to-target, and top roadmap actions.
- Aged receivables/payables banding (0-30/31-60/61-90/90+) is now generated and surfaced in Reports to accelerate collections/payables follow-up.
- Cash flow statement reporting now includes both direct and indirect method views inside Reports for operational finance monitoring.
- Restore rehearsal utility checks are now available (`runRestoreRehearsal`) to verify scoped-module restore safety before applying changes.
- V3 SLO monitor snapshots now expose projection lag and health alert levels (healthy/warning/critical) for faster runtime triage.
- Trial balance snapshot utility (`buildTrialBalanceSnapshot`) now provides explicit debit/credit totals, tolerance, and difference for readiness checks.
- Financial period close now enforces a blocking trial-balance guard against unbalanced closing balances.
- Financial period close/reopen now applies role gates (manager/admin close, admin-only reopen).
- Audit export now includes immutable integrity-seal signature metadata (checksum + signer + signature algorithm) with verification support.

---

## 1) Current Status (Implemented)

### Platform & Tooling

- React + TypeScript + Vite application structure is in place.
- Unit/integration testing is established with Vitest and Testing Library.
- E2E/a11y/visual scaffolding is present via Playwright (`e2e/` + `playwright.config.ts`).
- CI scaffolding exists under `.github/workflows/`.
- Code quality tooling exists (ESLint, Prettier, Husky, commitlint, lint-staged).

### Runtime & Deployment

- Dockerized stack assets exist (`Dockerfile`, `Dockerfile.java`, `docker-compose.yml`, `docker/nginx.conf`).
- Compose includes Java API health dependency flow for web startup ordering.

### Core Product Areas

- Inventory, receiving, WIP, sales, purchases, finance, and reporting modules are implemented at baseline.
- Backup/restore and persistence subsystems are present:
  - storage adapters (`LocalStorageAdapter`, `IndexedDBAdapter`),
  - migrations/hydration,
  - autosave + tab sync,
  - backup validation/restore utilities.
- Audit/integrity foundations exist:
  - audit middleware/reducers/selectors,
  - audit UI components,
  - integrity and data masking utilities.

### UX Improvements Already Added

- Layout/header refresh, command palette, quick actions, and recent-page behavior have been introduced.
- Reporting page now includes extended accounting, management-accounting, and taxation sections.

### Windows 11 Onboarding

- Native one-click PowerShell bootstrap exists at `tools/bootstrap.ps1`.
- Cross-platform bash bootstrap exists at `tools/bootstrap.sh`.

---

## 2) Verified Recently (Quick Confidence)

- TypeScript typecheck path is actively maintained (`npm run typecheck`).
- Targeted report-generation tests cover management/taxation summary logic.
- Bootstrap help and dry-run flows are in place for bash; PowerShell script is provided for Windows 11 execution.

---

## 3) High-Priority Pending Areas

### Phase tracker (single view)

| Phase                                     | Status          | Focus                                                                                                                                        | Exit Criteria                                                                                                         |
| ----------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Security + safety baseline       | **In progress** | Remove risky defaults (seed/default credentials by default), tighten CORS, enforce destructive-action confirmations, stabilize coverage gate | No wildcard CORS in prod, no default/seeded credentials enabled in prod, destructive reset guarded, CI coverage green |
| Phase 1: Runtime reliability + governance | **Pending**     | Role gates for sensitive actions, release observability, restore rehearsal automation                                                        | Restore rehearsal in CI, structured release telemetry, role checks on high-impact actions                             |
| Phase 2: Data/backend cutover             | **Pending**     | Move critical workflows from browser-first state to API+DB authoritative writes                                                              | Core ERP entities persisted via API+DB transactions, audit/replay from server-side source of truth                    |

### A. Financial Depth Extensions (Post-Completion Enhancements)

1. **General Ledger posting engine hardening**
   - Enforce strict double-entry posting map per business event.
   - Add trial-balance validation job and imbalance blocker.
2. **Chart of Accounts maturity**
   - Extend account taxonomy (assets/liabilities/equity/revenue/expense + sub-accounts).
   - Add account configuration UI and account locking policies.
3. **Period close controls**
   - Formal close checklist (accruals, reclass, VAT lock, retained earnings roll-forward).
   - Close/reopen audit trail with role-based gates.
4. **Costing improvements**
   - Add valuation methods (weighted average/FIFO strategy toggle).
   - WIP-to-COGS transfer traceability and landed-cost allocation.

### B. Reporting Extensions (Accounting + Management + Tax)

1. Add drill-down report interactions from KPI -> transaction journal.
2. Expand aged receivables/payables from bucketed summaries into full customer/supplier statement exports and follow-up workflows.
3. Add management packs:
   - budget vs actual,
   - variance analysis,
   - contribution margin by channel/model/grade,
   - rolling forecast.
4. Continue tax filing automation depth:
   - authority acknowledgement ingestion APIs and scheduled workflow wiring (manual reconciliation helpers and batch processing summary are now implemented).

### F. Recently Closed Items (No Longer Pending)

1. Cash flow statement reporting now ships with both direct and indirect method views in Reports.
2. Aged receivables/payables banding (0-30/31-60/61-90/90+) is implemented for collection/payables prioritization.
3. Restore rehearsal checks are integrated in Settings restore flow and can block unsafe restores when policy enforcement is enabled.
4. Immutable audit export packages now include checksum + signature metadata and verification (`src/utils/auditExport.ts`).
5. VAT exception anomaly reporting (missing/invalid/mismatched VAT) is now generated in Reports tax section for period diagnostics.
6. VAT filing evidence export package now ships with signed integrity metadata for compliance submission support.
7. VAT box mapping detail is now surfaced in Reports tax diagnostics for filing preparation review.
8. VAT period-lock evidence templates can now be exported from Reports tax diagnostics.
9. VAT submission payload export now includes authority adapter envelopes (`uae-fzta`, `generic-json`) with integrity + pending acknowledgement metadata.
10. VAT submission acknowledgement apply/reconcile helpers now support matched/mismatch checks against reported authority/net VAT.
11. VAT acknowledgement batch processing summary (`matched`/`mismatched`/`errors`) is now available for ingestion-job rollups.
12. VAT acknowledgement ingestion parsing helpers now split accepted/rejected records for safer reconciliation-job intake.
13. VAT reconciliation job snapshots now include ingestion diagnostics (`accepted`, `rejected`, and rejected record reasons).
14. Settings destructive reset now requires explicit typed confirmation before state reset.
15. Java API seeded/default credentials are now opt-in via env flags and seeded reset requires admin session.
16. Release readiness smoke script now exists (`tools/release_readiness.sh`) with a single command gate (`npm run check:release-readiness`).
17. Backup restore roundtrip integration coverage now includes scoped restore rehearsal invariants (`tests/integration/restoreRoundtripFlow.test.ts`).
18. Completion roadmap now includes pending-area telemetry (`pendingAreaCount`, `pendingAreaKeys`), coordinated burn-down recommendation generation, and Session Progress Tracker-based adaptive forecast velocity.

### C. Stability & Reliability Extensions

1. Expand restore rehearsal coverage from integration-level roundtrip checks into browser-driven end-to-end flows.
2. Add stress tests for persistence fallback and large state snapshots.
3. Extend release smoke script with optional clean-machine bootstrap dry-run assertions (especially Windows 11).
4. Add runtime observability:
   - structured error events,
   - release/build metadata,
   - optional telemetry hooks.

### D. Security & Governance Extensions

1. Encrypt sensitive backup payload fields by policy profile.
2. Add role/permission checks to high-impact actions (close period, restore, bulk delete).

### E. Product UX Extensions

1. Finish cross-module command palette actions coverage (all major workflows).
2. Add guided onboarding/checklists for first-time setup and go-live prep.
3. Improve empty states and failure recovery messaging in finance/report screens.

---

## 4) Suggested Next Sprint Plan (Execution Order)

1. **Ledger correctness first**: trial-balance + posting guardrails.
2. **Period close + costing controls**: lock mechanics + valuation strategies.
3. **Accounting reporting depth**: cash flow + drill-downs + aged statements.
4. **Tax pack hardening**: VAT mapping, exceptions, filing exports.
5. **Resilience and observability**: restore rehearsal and runtime diagnostics.

---

## 5) Definition of Done for “Production-Ready Finance”

- Trial balance always balances (automated check + blocking rules).
- Month-end close process is repeatable, audited, and role-protected.
- Reports reconcile to ledger (P&L, BS, VAT, cashflow) with drill-down traceability.
- Backup/restore validated end-to-end on realistic data volumes.
- Windows 11 onboarding tested on clean machine with one-click bootstrap.

---

## 6) Quick Start Commands for Next Contributor

```bash
# install project deps
npm ci

# typecheck
npm run typecheck

# unit/integration suite
npm run test:run

# run app
npm run dev
```

Windows 11 bootstrap:

```powershell
powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1
```
