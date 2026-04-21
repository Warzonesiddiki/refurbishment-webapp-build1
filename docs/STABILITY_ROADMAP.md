# Stability Brainstorm & Execution Plan

## Objective
Ship a predictable, non-fragile app where core workflows (receiving, WIP, purchase, sales, reports, backup/restore) are safe under normal and failure conditions.

---

## 0) Stability Principles (must hold at all times)
1. **No silent failure**: every failed action shows explicit UI feedback.
2. **No false success**: success messages appear only after state mutation is confirmed.
3. **No unsafe restore/import**: schema + version checks before mutation.
4. **No drift in calculations**: one source of truth for VAT, totals, and profit math.
5. **No unguarded critical transitions**: status transitions validated centrally.
6. **No release without gates**: test + typecheck + build must pass together.

---

## 1) Current Risk Map (brainstormed hotspots)

### Data Integrity
- Restore/import payload shape drift can reappear as state evolves.
- Critical transitions are currently distributed across components/reducer actions.
- Potential duplicate business logic for totals/profit/VAT in UI and store paths.

### Runtime Resilience
- Some user flows still rely on local assumptions (e.g., required fields not enforced consistently).
- Missing coarse-grained error boundary around top-level app shell.

### Test Reliability
- Integration coverage exists but lacks chaos/negative-path tests for corruption and replay.
- Critical-flow assertions may still be shallow in places (presence checks vs outcome checks).

### Operational Readiness
- No single “release gate” script combining all checks in one command.
- No explicit SLO-style stability metrics tracked in docs.

---

## 2) Phased Stability Plan

## Phase A (Now → 2 days): Guardrails and hard gates
**Goal:** Prevent preventable regressions before they ship.

- Add a release gate script: `npm run verify` => test + typecheck + build.
- Add CI workflow to run `npm run verify` on every PR.
- Add reducer-level invariant assertions for critical entity links (lot/laptop/wip consistency).
- Add centralized transition validator for high-risk status changes.

**Exit criteria**
- Every PR blocked unless verify passes.
- Transition validator used by all high-risk mutation paths.

## Phase B (2 → 5 days): Corruption and recovery reliability
**Goal:** Make backup/restore/import resilient to malformed/stale data.

- Add schema version migration map (`v1 -> current`) with explicit migration tests.
- Add max-file-size and payload sanity checks on restore/import.
- Add idempotency/replay tests for repeated critical actions.
- Add round-trip tests (export -> restore -> compare key invariants).

**Exit criteria**
- Corrupt/stale payloads fail safely.
- Round-trip restore preserves core invariants.

## Phase C (5 → 8 days): Critical flow correctness
**Goal:** Ensure end-to-end business behavior is correct, not just render success.

- Strengthen integration tests for:
  - receive/import -> verify -> grade -> WIP -> sale
  - purchase -> payment -> payable status
  - report totals vs source-of-truth state
- Replace shallow DOM assertions with outcome assertions (state/log/result checks).
- Add finance reconciliation tests (subtotal + VAT = total, profit consistency).

**Exit criteria**
- Critical path tests validate business outcomes and pass reliably.

## Phase D (8 → 12 days): UX resilience + accessibility
**Goal:** Fail safely and clearly for users.

- Add app-level error boundary and fallback actions.
- Audit all destructive actions for confirm/cancel affordances.
- Accessibility pass for keyboard focus, labels, and screen-reader flow on core pages.
- Standardize toast language to avoid ambiguity (“Saved locally”, “Restored successfully”, etc.).

**Exit criteria**
- Core pages recover gracefully from UI/runtime failures.
- Accessibility smoke checks pass.

---

## 3) Test Backlog for Stability (high priority)
1. Restore rejects oversized payloads.
2. Restore rejects wrong version envelope.
3. Migration test from previous versions.
4. Replay-safe behavior for repeated “commit/import” actions.
5. Inventory invariants after each flow step.
6. Financial reconciliation cross-check across reports and sales/purchases.
7. Notification/error contract tests for all critical failures.

---

## 4) Suggested Release Gate
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- (future) `npm run test:critical` for only high-risk E2E/integration flows

Single command target:
```bash
npm run verify
```

---

## 5) Stability KPIs (track weekly)
- Crash-free critical-flow sessions (%).
- Restore/import failure rate with user-visible actionable messages (%).
- Regression count escaping to main branch (#).
- Time-to-detect and time-to-fix for stability bugs.
- Flaky test rate in CI.

---

## 6) Ownership Split
- **State/Data**: reducer invariants, migrations, round-trip checks.
- **UI/UX**: error boundary, feedback consistency, accessibility.
- **QA**: critical-flow tests, negative-path coverage, flake triage.
- **Release/DevEx**: verify script, CI gate, branch protection.

---

## 7) Implemented in this push
- Added a single release gate command: `npm run verify` (test + typecheck + build).
- Added CI workflow: `.github/workflows/ci-verify.yml` to execute `npm run verify` on push/PR.
- Added explicit `typecheck` script (`tsc --noEmit`) to make static correctness a first-class gate.
