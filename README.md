# ALMASFUFA Laptop Refurbishment ERP (MES + ERP Hybrid)

A production-oriented refurbishment workflow app for LAN usage:

- **Frontend**: React + Vite + TypeScript
- **Backend (local demo)**: Java LAN auth server
- **Database**: PostgreSQL schema + RLS/integrity SQL migrations
- **Operations UI**: Python Tkinter launcher for setup/start/test/logs

---

## Current Scope Implemented

- Multi-page ERP frontend with workflow-oriented modules (receiving, WIP, inventory, finance, sales, reports).
- Domain utility layer for sequences, VAT/stock validation, and track state transitions.
- Extensive Vitest suite (unit + integration flow coverage).
- PostgreSQL migration pack:
  - `0001_init.sql` foundational schema,
  - `0002_rls.sql` tenant-scoped row-level policies,
  - `0003_integrity_functions.sql` stock/idempotency/sequence helpers.
- Java local auth/API service for LAN usage (`tools/run_java_server.sh` + `java_server/`).
- Desktop launcher (`tools/local_launcher_gui.py`) with:
  - preflight checks,
  - one-click install/test/build/launch,
  - DB/Java controls,
  - frontend dev + preview controls,
  - live status indicators,
  - in-app `.env` editor.

---

## Quick Start (Recommended)

### 1) Install prerequisites
- Node 18+
- npm
- Python 3
- Optional: Docker + Docker Compose plugin
- Optional: JDK (for local Java API)

### 2) Configure environment
```bash
cp .env.example .env
```
Adjust values as needed.

### 3) Launch GUI setup tool
```bash
npm run launcher
```
Then in GUI:
1. Run **Preflight Check**
2. Run **One-click Setup + Launch**
3. Share LAN URL shown in logs/status

---


## Keyboard Shortcuts (Global)

- `Ctrl+/` → Scanner
- `Ctrl+S` → New Sale
- `Ctrl+L` → Import Lot
- `Ctrl+G` → Receiving Grading
- `Ctrl+Shift+L` → Inventory Laptops
- `Ctrl+Shift+P` → Inventory Parts
- `Ctrl+Shift+W` → WIP Jobs
- `Ctrl+Shift+R` → Reports
- `Ctrl+B` → Backup (downloads full app state JSON)
- `Ctrl+Shift+B` → Restore backup (loads app-state JSON file)

---

## Manual CLI Fallback

Install + test + build:
```bash
npm install
npm test
npm run build
```

Run preview (LAN):
```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

Run frontend dev (LAN):
```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Run Java local API:
```bash
npm run java:server
```

Run Docker DB stack:
```bash
docker compose up -d
```

---

## Testing

Primary test command:
```bash
npm test
```

Compatibility shim config test run:
```bash
npm run test:legacy-config
```

---

## Documentation Map

- `docs/PROJECT_AUDIT_AND_COMPLETION_PLAN.md` — completion audit, pending gaps, and best-practice recommendations
- `docs/ONE_TIME_SETUP_AND_APP_TOUR.md` — one-time setup and full module tour with visual flow
- `docs/LOCAL_GUI_LAUNCHER.md` — launcher usage and operations
- `docs/DEPLOYMENT.md` — deployment and migration notes
- `docs/TESTING.md` — test execution guide
- `docs/JAVA_LOCAL_SERVER.md` — Java LAN API endpoints and usage
- `docs/API.md` — API/domain notes

---

## Known Status

This repository is in active completion mode toward full production-grade MES/ERP parity. Current delivery emphasizes robust local operations, workflow correctness, and deployment-ready foundations.
