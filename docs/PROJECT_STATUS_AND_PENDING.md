# Project Status & Pending Worklog

Last updated: 2026-02-12 (UTC)

## Purpose
This document is the handoff/source-of-truth for current implementation status, verified capabilities, and pending work so any developer or AI agent can continue delivery without re-discovery.

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

### A. Financial Depth Gaps (Critical for ERP parity)
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

### B. Reporting Completeness (Accounting + Management + Tax)
1. Add drill-down report interactions from KPI -> transaction journal.
2. Add cash flow statement (direct + indirect views).
3. Add aged receivables/payables bands with customer/supplier statements.
4. Add management packs:
   - budget vs actual,
   - variance analysis,
   - contribution margin by channel/model/grade,
   - rolling forecast.
5. Add taxation packs:
   - VAT box mapping detail,
   - exception report (missing VAT/tax code anomalies),
   - filing/export templates and period lock evidence.

### C. Stability & Reliability
1. Add end-to-end restore rehearsal tests (backup -> reset -> restore -> invariant checks).
2. Add stress tests for persistence fallback and large state snapshots.
3. Add smoke-test script for fresh-machine bootstrapping (especially Windows 11).
4. Add runtime observability:
   - structured error events,
   - release/build metadata,
   - optional telemetry hooks.

### D. Security & Governance
1. Encrypt sensitive backup payload fields by policy profile.
2. Add role/permission checks to high-impact actions (close period, restore, bulk delete).
3. Add immutable audit export package with checksum/signature metadata.

### E. Product UX Completion
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

