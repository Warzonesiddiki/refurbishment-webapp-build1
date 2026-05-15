# Change Log (CL) v2.0

## Phase 10 — Final Polish & State Management
- Added centralized app state store (`src/store/appState.ts`) with:
  - Full data model for all entities (laptops, parts, WIP, sales, purchases, finance, suppliers, lots)
  - Reducer with 20+ action types for CRUD operations
  - Selectors for KPIs, VAT summary, and global search
  - Sequence generators for all barcode/number patterns
  - Initial state seeded from mock data
- Added `StoreProvider` context (`src/context/StoreContext.tsx`) wired into App
- Added `GlobalSearch` component (`src/components/ui/GlobalSearch.tsx`) with:
  - Live search across laptops, parts, suppliers, WIP jobs, lots
  - Debounced search with results dropdown
  - Theme-aware styling (cyber/pro)
  - Navigation to relevant page on result click
- Added `NotificationPanel` component (`src/components/ui/NotificationPanel.tsx`) with:
  - Dropdown panel from header bell icon
  - Alert list with tone-colored indicators
  - Clear individual / clear all functionality
  - Real-time alert count from store
- Added `Modal` component (`src/components/ui/Modal.tsx`) for:
  - Reusable dialog with backdrop, escape key, scroll lock
  - Header with title/badge, scrollable body, footer slot
  - Theme-aware styling
- Updated `Layout.tsx` to use GlobalSearch and NotificationPanel from store
- Updated `Dashboard.tsx` to use KPIs and activity from store state
- Updated `App.tsx` to wrap with StoreProvider
- Build: ✅ SUCCESS (501.51 kB / gzip: 116.31 kB)

## Phase 11 — Independent Audit Baseline (Documentation)
- Added `docs/AUDIT_2026-02-07.md` capturing a comprehensive production-readiness assessment.
- Documented critical gaps across database, backend APIs, auth/RBAC, concurrency controls, and deployment infrastructure.
- Added risk and remediation timeline to help prioritize delivery from prototype to production architecture.

## Phase 12 — Persistence + Test Infrastructure Stabilization
- Added local persistence utilities in `src/store/persistence.ts` for state save/load/clear using `localStorage`.
- Updated `StoreProvider` to hydrate state from persisted storage and auto-persist reducer updates.
- Fixed Vitest configuration by wiring the correct setup file path and `@` alias resolution.
- Repaired UI action test harness (`tests/uiActions.test.tsx`) by:
  - migrating to TSX,
  - rendering pages inside `StoreProvider`,
  - updating outdated WIP interaction expectations to current UI behavior.
- Added `tests/storePersistence.test.ts` to validate persistence happy-path and invalid JSON fallback.

## Phase 13 — Database & Multi-Tenant Security Foundation
- Added `db/migrations/0001_init.sql` with production-oriented PostgreSQL schema for auth, ERP entities, financial records, logs, idempotency, and sequences.
- Added strict data integrity constraints (uniques, checks, foreign keys) plus performance indexes for core query paths.
- Added `db/migrations/0002_rls.sql` to enable row-level security and tenant policies based on `app.current_company_id`.
- Added `docker-compose.yml` and `.env.example` to run PostgreSQL + Adminer locally with automatic migration bootstrap.
- Updated `docs/DEPLOYMENT.md` with local database bootstrap instructions.

## Phase 14 — Concurrency & Idempotency DB Functions
- Added `db/migrations/0003_integrity_functions.sql` with atomic backend helpers for sequence generation, stock reservation/consumption/release, and idempotency claims.
- Added `touch_updated_at` trigger automation for mutable core tables.
- Added cleanup helper for expired idempotency keys to support scheduled maintenance jobs.
- Updated `docs/DEPLOYMENT.md` with migration coverage notes for these integrity helpers.

## Phase 15 — Power Platform Solution Blueprint (Batches 1–5)
- Added `docs/POWER_PLATFORM_BATCH5_SOLUTION.md` with a complete Microsoft Power Platform implementation plan covering architecture, phased delivery, automations (1–14), screen architecture (1–18), RBAC/RLS, platform limitations, assumptions, and clarifying questions.
- Adapted the full 5-batch specification into Dataverse + Model-driven/Canvas + Power Automate concepts as the project single-source solution blueprint.

## Phase 16 — Migration Contract Test Coverage
- Added `tests/migrationsContract.test.ts` to assert migration contract integrity for:
  - required core tables in `0001_init.sql`,
  - tenant RLS enablement/policies in `0002_rls.sql`,
  - concurrency/idempotency helper functions in `0003_integrity_functions.sql`.
- This adds fast CI validation to catch schema drift before runtime deployment.

## Phase 17 — Local GUI Setup & Launch Experience
- Added `tools/local_launcher_gui.py` (Tkinter desktop launcher) for one-click local setup and run.
- Added `npm run launcher` script in `package.json` for easy startup.
- Added `docs/LOCAL_GUI_LAUNCHER.md` with usage and LAN operation instructions.
- Updated `docs/DEPLOYMENT.md` to include the GUI-based local launcher workflow.

## Phase 18 — Java LAN API Starter + Launcher Integration
- Added `java_server/src/com/almasfufa/server/Main.java` implementing a local-network Java API starter with user registration/login and token-based `/api/auth/me` endpoint.
- Added `tools/run_java_server.sh` and `npm run java:server` for simple compile-and-run workflow.
- Updated `tools/local_launcher_gui.py` to support Java API start/stop and one-click flow now boots Java API + web app.
- Added `docs/JAVA_LOCAL_SERVER.md` and updated deployment/launcher docs for LAN multi-user setup guidance.

## Phase 19 — Frontend Auth Gateway for Java LAN Server
- Added `src/utils/javaAuth.ts` for Java API auth integration (`register`, `login`, `me`) with token storage.
- Added `src/components/pages/LoginPage.tsx` as the new employee login/register gateway UI.
- Updated `src/App.tsx` to require authentication before loading ERP modules and added logout support.
- Updated `src/components/Layout.tsx` to expose a header logout action.
- Updated deployment docs to include `VITE_JAVA_API_BASE` behavior for local network auth routing.

## Previous Changes
- v1.7: QuickActions/ActionKeyLegend components, duplicate import fix
- v1.6: Global action feedback provider, integration tests
- v1.5: Reusable UI components, Pro theme CSS
- v1.4: Logging/idempotency hooks wired to critical UI actions
- v1.3: Dual-theme system (cyberpunk + professional)
- v1.2: Core domain models, validation, sequence generators, state machines
- v1.1: Gap analysis, MRR/TM/PCC/RR updates
- v1.0: Initial project setup, all pages, cyberpunk UI
