# Extreme Audit Report

Date: 2026-02-12  
Scope: Frontend TypeScript app, test tooling, CI definitions, runtime auth/backup handling.

## Executive summary

The codebase is in generally healthy shape for core quality gates (TypeScript strict mode, unit/integration tests, production build), but there are **critical tooling gaps** that currently break stated quality guarantees:

1. Coverage is configured and required in CI, but the required provider dependency is missing.
2. Playwright scripts are configured in package scripts/docs, but the local toolchain is currently not runnable in this environment.
3. Security scanning via `npm audit` is blocked due registry endpoint access (403), so vulnerability posture is currently unknown.

## Checks performed

- `npm run typecheck` ✅ pass
- `npm run test:run` ✅ pass (91 files / 186 tests)
- `npm run build` ✅ pass
- `npm run test:coverage` ❌ fail (`@vitest/coverage-v8` missing)
- `npm run test:e2e` ❌ fail (`playwright: not found`)
- `npm audit --audit-level=low` ⚠️ blocked by registry endpoint 403

## High-priority findings

### 1) Coverage pipeline is broken (CI reliability risk)

- `vitest.config.ts` explicitly requires V8 coverage provider and thresholds.
- CI workflow runs `npm run test:coverage` in required `unit-tests` job.
- `package.json`/lockfile do not include `@vitest/coverage-v8`, causing immediate failure.

**Impact:** main CI path is likely red for unit test job, invalidating advertised coverage contract.

### 2) E2E execution is not runnable in this environment as configured

- `playwright.config.ts` is fully configured (multi-browser matrix + web server).
- `package.json` defines `test:e2e` script as `playwright test`.
- Runtime command failed with `sh: 1: playwright: not found`.

**Impact:** E2E/visual/a11y quality claims cannot be validated in current local environment until toolchain consistency is fixed.

### 3) Dependency vulnerability visibility is currently unavailable

- `npm audit` failed with 403 against npm security advisories endpoint.

**Impact:** no current automated view of vulnerable transitive dependencies in this environment.

## Medium-priority findings

### 4) Type safety debt concentrated in UI pages

`as any` casts are present in workflow-heavy pages (`InventoryLaptops`, `InventoryParts`, `ScannerPage`, `ProcessingTracks`, `SettingsPage`). These likely bypass strict reducer payload contracts.

**Impact:** less reliable refactors and higher risk of runtime shape mismatches.

### 5) Auth token persistence model increases XSS blast radius

Auth token is stored and read directly from `localStorage` in `src/utils/javaAuth.ts`.

**Impact:** if script injection occurs, persistent bearer token exfiltration becomes possible.

### 6) Single-file bundle output is relatively large

Build output generated one inlined HTML artifact around 634 kB (152 kB gzip).

**Impact:** potentially slower first load on low-bandwidth/low-end devices.

## Positive controls confirmed

- TypeScript strict mode is enabled, with additional no-unused and switch fallthrough guards.
- Unit/integration test suite is broad and currently green.
- Coverage thresholds are defined (once coverage toolchain is fixed).
- Backup encryption uses PBKDF2 + AES-GCM via Web Crypto API.

## Prioritized next-step plan

## Phase 0 (same day)

1. Add missing coverage provider dependency (`@vitest/coverage-v8`) and verify `npm run test:coverage` locally + CI.
2. Reconcile Playwright binary availability (ensure `npm ci` fully installs dev deps; verify `node_modules/.bin/playwright` exists).
3. Capture and document environment requirement for security audit endpoint access; run `npm audit` in CI where access exists.

## Phase 1 (1-3 days)

4. Replace all `as any` reducer/action payload casts with explicit DTO/action types.
5. Add guardrail test that fails if any new `as any` appears in `src/components/pages` (or enforce via lint rule).
6. Confirm CI branch protection requires passing `unit-tests` and `e2e-tests` jobs.

## Phase 2 (3-7 days)

7. Move auth token strategy toward httpOnly secure cookies (or, if infeasible, reduce token lifetime + add rotation/refresh controls).
8. Add CSP + Trusted Types policy baseline for XSS defense-in-depth.
9. Evaluate bundle optimization opportunities (split heavy routes/modules while preserving singlefile constraints if required by product).

## Suggested ownership map

- Tooling/CI fixes: Frontend platform or DevEx owner
- Auth hardening: Frontend + Java API owner
- Type safety cleanup: Feature squads owning inventory/processing/settings flows
- Perf optimization: Frontend platform
