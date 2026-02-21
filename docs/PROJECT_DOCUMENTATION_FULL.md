# Tahir ERP — Full Project Documentation

> Audience: developers, operators, QA, deployment engineers, and stakeholders who need a single deep-reference manual.

## 1) Project Summary

Tahir ERP is a browser-first operations platform for refurbishment workflows (inventory, receiving, WIP, sales, purchases, finance, audit/reporting) with:

- React + TypeScript frontend (Vite build system)
- Local Java API server for authentication and shared-state endpoints
- Optional Docker-backed services (Postgres + Adminer, plus containerized web/java in compose workflows)
- Extensive automated test suites (Vitest + Playwright)

The default development workflow now prioritizes backend readiness by starting Java API with frontend together.

---

## 2) Repository Structure

Top-level important folders/files:

- `src/` — frontend source code
- `java_server/` — Java API source and runtime data
- `tests/` — unit/integration test suites
- `e2e/` — Playwright end-to-end tests
- `tools/` — launchers, bootstrap scripts, automation helpers
- `docs/` — documentation library
- `Dockerfile` / `Dockerfile.java` / `docker-compose.yml` — containerization stack
- `.npmrc` / `package.json` — Node tooling and workflow scripts

---

## 3) Runtime Architecture

### Frontend

- Built with React + TypeScript.
- Vite dev and preview servers provide local + LAN dev serving.
- Frontend communicates with Java API using `VITE_JAVA_API_BASE`.
- In dev/preview, `/api` requests can be proxied to local Java API target.

### Java API

- HTTP server implemented in `java_server/src/com/tahir/server/Main.java`.
- Provides auth endpoints (`/api/auth/*`) and shared state endpoint (`/api/state/snapshot`).
- Includes safety wrappers around handlers, CORS handling, and operational health endpoint (`/api/health`).

### Persistence Model

- Frontend local persistence: localStorage adapter with migration support and graceful fallback behavior.
- Shared-state sync: optional remote sync to Java API endpoint.

### Optional DB Services

- Launcher DB actions are scoped to `postgres` and `adminer` services to avoid clashes with local frontend/java runs.

---

## 4) Local Setup (Recommended)

### Prerequisites

- Node.js and npm
- Python (`python` or `python3`)
- Java JDK (`java` + `javac`)
- Git and curl
- Docker Compose (optional, needed only for DB/container workflows)

### Install dependencies

```bash
npm run deps:install
```

### Validate environment

```bash
npm run check:prerequisites
```

### Start application (default)

```bash
npm run dev
```

This starts:

1. Java API (health-gated startup)
2. Frontend dev server (after Java is healthy)

### LAN mode

```bash
npm run dev:lan
```

### Frontend-only alternatives

```bash
npm run dev:web
npm run dev:lan:web
```

Use these when Java API is already running elsewhere or intentionally omitted.

---

## 5) NPM Scripts Reference

### Core run scripts

- `dev` — Java + frontend (local)
- `dev:lan` — Java + frontend (LAN)
- `dev:web` — frontend only (local)
- `dev:lan:web` — frontend only (LAN)
- `preview` / `preview:lan` — preview built app
- `java:server` — run Java API manually

### Build & quality

- `build` — TypeScript compile + Vite production build
- `typecheck` — TypeScript no-emit validation
- `test:run` — full Vitest suite
- `test:e2e` — Playwright suite

### Ops checks

- `check:prerequisites`
- `check:core-areas`
- `check:ops`, `check:mobile`, `check:offline-queue`, etc.

### Dependency scripts

- `deps:install` — resilient local install flags
- `deps:ci` — resilient CI-style install flags

---

## 6) Java API Details

### Key endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `GET /api/auth/users`
- `POST /api/auth/reset-seeded-passwords`
- `GET/PUT /api/state/snapshot`

### Auth/session behavior

- Token-based session map in-memory.
- Login rate-limit principal normalized to `email|client-ip` for stable lockout semantics.
- Session cleanup and housekeeping run on schedule.

### Seeded users

- Local helpers default `TAHIR_ENABLE_SEEDED_USERS=true` for easier first login in dev.
- Skyline seeded range includes multiple `id.skylineN@erp.com` users with `userNskylinein` pattern.

---

## 7) Environment Variables

### Frontend/dev variables

- `VITE_JAVA_API_BASE` — Java API base path or URL
- `VITE_LOCAL_API_PROXY_TARGET` — proxy target for `/api`

### Java variables (selected)

- `PORT`
- `TAHIR_ALLOWED_ORIGIN`
- `TAHIR_TRUST_PRIVATE_NETWORK_ORIGINS`
- `TAHIR_ENABLE_SEEDED_USERS`
- `TAHIR_ENABLE_DEFAULT_ADMIN`
- `TAHIR_ADMIN_EMAIL`, `TAHIR_ADMIN_PASSWORD`

### Compose-related

- `WEB_BIND_HOST`, `WEB_PORT`
- `JAVA_BIND_HOST`, `JAVA_API_PORT`
- `DB_BIND_HOST`, `DB_PORT`
- `ADMINER_BIND_HOST`, `ADMINER_PORT`

---

## 8) Docker / Compose Workflows

### Full stack build/start

```bash
docker compose up --build
```

### DB-focused launcher workflow

Launcher DB actions use service-scoped commands:

- pull: `docker compose pull postgres adminer`
- up: `docker compose up -d postgres adminer`
- stop: `docker compose stop postgres adminer`

This reduces port conflicts with local Java/frontend runs.

---

## 9) Stability Hardening Implemented

This codebase includes multiple resilience guardrails:

- Health-gated Java startup before frontend in integrated launcher
- Safer Windows spawn behavior and quoting in dev launcher
- Python command fallback handling in scripts (`python || python3`)
- Local storage read/write try/catch guards to avoid browser policy crashes
- Structured proxy 502 JSON responses when backend is unavailable
- Improved auth error body parsing for clearer user messages
- Husky hook modernization to avoid deprecated shim failures

---

## 10) Common Failure Modes + Fixes

### A) Login/network error after frontend starts

**Symptom:** API calls fail, login cannot complete.

**Fix:** use integrated startup (`npm run dev` or `npm run dev:lan`) so Java starts automatically and health check passes before frontend starts.

### B) Windows spawn errors in launcher

**Symptom:** `spawn EINVAL` or immediate launcher exit.

**Fix:** ensure latest launcher is used (`tools/dev_with_java.mjs`), verify Node, Python, npm available in PATH.

### C) Local storage crashes / blank page

**Symptom:** UI fails where storage is blocked/restricted.

**Fix:** persistence layer now catches storage exceptions; ensure latest code and clear stale browser data.

### D) Docker conflicts with local runs

**Symptom:** port collisions or services unexpectedly replaced.

**Fix:** use launcher DB-only service controls; avoid full `compose up` when running local Java/frontend unless intentional.

### E) NPM dependency resolution loops

**Symptom:** repeated `ERESOLVE` failures.

**Fix:** use provided install scripts (`npm run deps:install` / `npm run deps:ci`) and avoid repeated `npm audit fix --force` churn.

---

## 11) Testing Strategy

### Fast local checks

```bash
npm run check:prerequisites
npm run typecheck
npx vitest run tests/loginPage.test.tsx
```

### Full unit/integration pass

```bash
npm run test:run
```

### E2E

```bash
npm run test:e2e
```

### Java compile smoke check

```bash
javac java_server/src/com/tahir/server/Main.java
```

---

## 12) Security / Operational Notes

- Do not enable seeded/default credentials in production.
- Restrict allowed origins via env configuration.
- Review audit output regularly even with relaxed local install flags.
- Treat local dev defaults (seeded users, permissive paths) as non-production behavior.

---

## 13) Recommended Team Workflow

1. Pull latest branch.
2. `npm run deps:install`
3. `npm run check:prerequisites`
4. `npm run dev` (or `npm run dev:lan`)
5. Validate login against Java API health.
6. Run tests before PR (`npm run typecheck`, `npm run test:run` or targeted suites).

---

## 14) Documentation Index (for deeper dives)

- `README.md` — quick start
- `docs/API.md` — API reference
- `docs/DEPLOYMENT.md` — deployment/env model
- `docs/JAVA_LOCAL_SERVER.md` — Java server details
- `docs/LOCAL_GUI_LAUNCHER.md` — launcher guide
- `docs/CONTRIBUTING.md` — contributor workflow

---

## 15) Change Management Notes

When changing startup/tooling/server behavior:

- Update scripts in `package.json`
- Update launcher docs + README in same PR
- Validate Java health/start flow
- Re-run prerequisite + type + targeted tests
- Include rollback notes if script defaults are changed
