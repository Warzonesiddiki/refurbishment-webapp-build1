# ALMASFUFA Manager v2.0

![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

ALMASFUFA Manager is a React + TypeScript ERP workflow application for laptop refurbishment operations (receiving, WIP, parts, sales, finance, reporting, backup/restore).

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
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

## Docker
Build and run the full stack (frontend + Java auth API + Postgres + Adminer):
```bash
docker compose up --build
```

Services:
- Web app: `http://localhost:4173`
- Java API: `http://localhost:8085`
- Adminer: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

### Compose health checks
`web` now waits for `java-api` health before startup to reduce first-run race conditions.


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

## Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open command palette |
| `Ctrl+S` | New sale |
| `Ctrl+Shift+L` | Inventory laptops |
| `Ctrl+Shift+P` | Inventory parts |
| `Ctrl+Shift+W` | WIP jobs |
| `Ctrl+Shift+R` | Reports |
| `Ctrl+B` | Backup |
| `Ctrl+Shift+B` | Restore backup |

## Stack Selection Guidance
See `docs/STACK_RECOMMENDATIONS.md` for recommended choices from your tool list.

## API Documentation
See `docs/API.md`.

## Contributing
See `docs/CONTRIBUTING.md`.

## License
Proprietary/Internal.
