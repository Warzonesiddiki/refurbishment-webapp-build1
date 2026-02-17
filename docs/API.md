# API Outline v1.0

## Contract-first spec (started)

- OpenAPI starter contract: `docs/openapi.yaml`
- This file now acts as the baseline for endpoint naming, auth expectations,
  tenant scoping headers, and idempotency requirements.
- Next iterations should expand schemas/response errors and keep the frontend
  API client generated from this contract.

## Local Java Auth API (implemented)
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `GET /api/state/snapshot`
- `PUT /api/state/snapshot`

Behavior notes:
- `X-Request-Id` is accepted and echoed (or generated if missing).
- Login lockout returns `429 too_many_attempts` after repeated failed attempts and includes `Retry-After` seconds.
- Request bodies beyond the configured size limit return `413 payload_too_large`.
- JSON endpoints require `Content-Type: application/json`; otherwise they return `415 unsupported_media_type`.
- `GET /api/health` returns `version`, `uptimeSec`, `activeSessions`, `registeredUsers`, `loginRateLimitedPrincipals`, plus `metrics`, `housekeeping`, and a `config` object for runtime telemetry (including `snapshotMaxBodyBytes`).
- Snapshot sync endpoint requires bearer auth and uses optimistic timestamp ordering: stale `PUT` writes are rejected with `409 stale_snapshot`.
- Snapshot `GET` returns `204` when no shared state is available yet.
- Auth handlers are wrapped in a server-side safety boundary: unexpected runtime exceptions emit structured error events and return `500 internal_server_error` without crashing the process.

## Inventory
- GET/POST /api/laptops
- GET/PUT/DELETE /api/laptops/:id
- GET/POST /api/parts
- GET/PUT/DELETE /api/parts/:id

## Receiving
- POST /api/lots/import/upload
- POST /api/lots/import/map
- POST /api/lots/import/preview
- POST /api/lots/import/commit
- POST /api/lots/verify/scan
- POST /api/laptops/grade

## Processing/WIP
- POST /api/wip
- POST /api/wip/:id/parts/add
- POST /api/wip/:id/parts/remove
- POST /api/wip/:id/labor
- POST /api/wip/:id/stage

## Sales
- POST /api/sales
- POST /api/sales/:id/receipts
- GET /api/sales

## Purchases
- POST /api/purchases
- POST /api/purchases/:id/payments
- GET /api/purchases

## Finance
- GET /api/cash
- POST /api/cash/entries
- GET /api/owner-ledger
- POST /api/owner-ledger
- GET /api/vat

All create endpoints require Idempotency-Key and log movement+audit entries.
