# DEPLOYMENT.md

## Overview
Single-page React app built with Vite. Two themes (Cyber / Pro) with action key system. Build output: `dist/`.

## Prerequisites
- Node 18+
- npm
- Optional: Docker + docker-compose

## Build
```bash
npm install
npm run build
```
Artifacts in `dist/` (single-file build via vite-plugin-singlefile).

## Serve (static)
Any static server can host `dist/index.html` and assets. Example:
```bash
npm install -g serve
serve dist
```

## Environment
- Themes: stored in localStorage key `alm_theme` (cyber/pro)
- Frontend can connect to Java LAN auth server via `VITE_JAVA_API_BASE` (default `http://localhost:8085`).

## Docker (basic)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Release & Rollback
1) Tag build (e.g., v2.0.0) after green tests and build.
2) Deploy static assets to target hosting.
3) Keep previous release artifacts to allow instant rollback by swapping asset set.

## Backups & Restore
- Frontend assets are immutable; backups apply to backend DB/services.
- If integrating backend, schedule DB backups and test restore; document RPO/RTO.

## Monitoring & Errors
- For production API wiring, add Sentry/Rollbar hook in `api.ts` interceptor.
- Enable CSP/HTTPS at hosting tier.

## Print Styles
- Already included in `src/index.css` for invoices/reports/labels.


## PostgreSQL Foundation (Phase 13)
A baseline production schema and tenancy-RLS policy set has been added:

- `db/migrations/0001_init.sql` — core ERP schema (auth, inventory, WIP, sales, purchases, finance, logs, idempotency, sequences)
- `db/migrations/0002_rls.sql` — RLS enablement + tenant policies using `app.current_company_id`

### Run locally with Docker Compose
1. Copy environment values:
   ```bash
   cp .env.example .env
   ```
2. Start services:
   ```bash
   docker compose up -d
   ```
3. Open Adminer at `http://localhost:8080` and connect to:
   - Server: `postgres`
   - Username/Password/DB from `.env`

The initial schema is automatically applied by PostgreSQL via `/docker-entrypoint-initdb.d` on first boot.

### Integrity helpers included in migrations
`db/migrations/0003_integrity_functions.sql` adds:
- `next_sequence_value(...)` for atomic sequence increments under concurrency
- `reserve_part_stock(...)`, `consume_reserved_part_stock(...)`, and `release_part_stock(...)` with row-level locking (`FOR UPDATE`)
- `claim_idempotency_key(...)` and `cleanup_expired_idempotency_keys()` for server-side idempotency lifecycle
- `touch_updated_at()` + triggers to keep mutable records synchronized



## Local GUI Launcher (One-Click)
A desktop launcher is available for user-friendly setup and local run:

```bash
npm run launcher
```

This opens `tools/local_launcher_gui.py` (Tkinter GUI) where users can:
- install dependencies,
- run tests,
- build and launch preview on LAN,
- optionally start/stop Docker DB stack,
- use one-click setup + launch.


## Java Local API (LAN)
A lightweight Java API service is included for local network multi-user access:

```bash
npm run java:server
```

- Binds to `0.0.0.0:8085`
- Includes auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Health endpoint: `/api/health`
- Uses local file persistence for demo users at `java_server/data/users.csv`

See `docs/JAVA_LOCAL_SERVER.md` for endpoint examples.
