# Tahir ERP v2.0

![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

Tahir ERP is a React + TypeScript ERP workflow application for laptop refurbishment operations (receiving, WIP, parts, sales, finance, reporting, backup/restore).

## Features

- Inventory and parts management
- WIP/refurbishment pipeline management
- Sales and receipt workflows
- Finance ledgers and VAT support
- Backup/restore and audit-focused tooling
- Keyboard shortcuts + command palette

## Tech Stack

- React 19, TypeScript, Vite
- Vitest + Testing Library
- Playwright (E2E, visual, a11y)
- GitHub Actions CI/CD

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Java JDK 21+ (`java` + `javac`) for the local Java API server
- Python 3.10+ (for launcher/helper scripts)
- Docker Engine + Docker Compose plugin (recommended for full-stack LAN deployment)
- LAN/firewall access for ports `4173`, `8085`, and optionally `8080`

### Installation

```bash
npm install
```

### One-click bootstrap (installs software + project deps)

**Windows 11 (PowerShell, recommended):**

```powershell
powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1
```

Useful PowerShell options:

- `-SkipSystem` (install only project dependencies)
- `-WithDocker` (install Docker Desktop via winget)
- `-DryRun` (preview commands)

**Linux/macOS (bash):**

```bash
bash tools/bootstrap.sh
```

Useful bash options:

- `--skip-system` (install only project dependencies)
- `--with-docker` (attempt Docker installation where supported)
- `--dry-run` (preview commands)

### Development

```bash
npm run dev
```

### Building

```bash
npm run build
```

## LAN Access (Same Wi‑Fi)

Run the dev server bound to all interfaces:

```bash
npm run dev:lan
```

Then open from another device using your computer IP, for example:

- `http://192.168.1.10:5173`

## Android App Install (PWA)

- Open the app in Chrome on Android.
- Use the in-app **Install App** banner (or browser install prompt).
- After install, launch **Tahir ERP** from home screen for app-like usage.

## Docker

Build and run the full stack (frontend + Java auth API + Postgres + Adminer):

```bash
docker compose up --build
```

Services:

- Web app: `http://<host-ip>:4173`
- Java API: `http://<host-ip>:8085`
- Adminer: `http://<host-ip>:8080`
- PostgreSQL: `<host-ip>:5432` (compose defaults to localhost bind for DB safety)

### Compose health checks

`web` now waits for `java-api` health before startup to reduce first-run race conditions.

## Real-time Shared Data Sync

- Local persistence uses browser storage for offline-first behavior.
- Cross-browser / multi-user live sharing now uses the Java API snapshot endpoint: `GET/PUT /api/state/snapshot`.
- Configure `VITE_JAVA_API_BASE` if needed (recommended default: `/api`). With Docker/Vite proxy enabled, frontend and API run through same-origin routing for easier LAN access and fewer CORS issues.
- The app pushes state updates continuously (debounced) and polls for remote updates every few seconds, so users in different browsers/devices see near real-time changes.

## Project Structure

- `src/` application source
- `tests/` unit/integration tests
- `e2e/` Playwright fixtures, page objects, and E2E tests
- `.github/workflows/` CI workflows
- `docs/` architecture, deployment, and contribution docs

## Testing

- Unit/integration: `npm run test:run`
- Coverage: `npm run test:coverage`
- E2E: `npm run test:e2e`
- A11y: `npm run test:a11y`
- Visual: `npm run test:visual`
- Release smoke gate: `npm run check:release-readiness`

## Keyboard Shortcuts

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Ctrl+K`       | Open command palette |
| `Ctrl+S`       | New sale             |
| `Ctrl+Shift+L` | Inventory laptops    |
| `Ctrl+Shift+P` | Inventory parts      |
| `Ctrl+Shift+W` | WIP jobs             |
| `Ctrl+Shift+R` | Reports              |
| `Ctrl+B`       | Backup               |
| `Ctrl+Shift+B` | Restore backup       |

## Stack Selection Guidance

See `docs/STACK_RECOMMENDATIONS.md` for recommended choices from your tool list.

## API Documentation

See `docs/API.md`.

## Contributing

See `docs/CONTRIBUTING.md`.

## License

Proprietary/Internal.

## Mobile rollout checklist

- Start with `npm run dev:lan` on operations PC.
- Confirm Android device can open LAN URL.
- Install app from in-app banner.
- Verify scanner, WIP parts replacement, and backup/restore on mobile.
- Validate offline queue banner by toggling airplane mode during WIP updates.
- Replay queued items after reconnect and resolve conflict-marked entries first.
- Export replay audit CSV for supervisor handoff at shift close.
- Verify labor timer start/stop and supervisor approval for timed entries.
- If LAN fails, verify firewall allows TCP 5173.

## Session progress tracker

- Completed: 84%
- Pending: 16%
- Next focus: production hardening (security defaults, release observability, API+DB authority cutover).
