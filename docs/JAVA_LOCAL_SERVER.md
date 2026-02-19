# Java Local Network API Server

This project now includes a lightweight Java API service for LAN usage with per-user login.

## What is included

- Source: `java_server/src/com/tahir/server/Main.java`
- Run script: `tools/run_java_server.sh`
- NPM shortcut: `npm run java:server`
- Data store: `java_server/data/users.csv`

## API endpoints

- `GET /api/health` — health check
- `POST /api/auth/register` — create user
- `POST /api/auth/login` — login with email/password
- `GET /api/auth/me` — current user from `Authorization: Bearer <token>` (includes `role`)
- `POST /api/auth/logout` — invalidate current bearer session
- `POST /api/auth/change-password` — rotate password for authenticated user
- `GET /api/auth/users` — list registered users (for assignment dropdowns, includes `role`)
- `POST /api/auth/reset-seeded-passwords` — reset seeded Skyline user passwords
- `GET /api/state/snapshot` — fetch latest shared app-state snapshot (`204` if empty)
- `PUT /api/state/snapshot` — publish latest shared app-state snapshot with `{ timestamp, state }`

## Auth hardening included

- Strong password policy enforced on registration and password-change.
- Login throttle: 5 failed attempts per principal in 10 minutes, then 15-minute lockout.
- Session TTL cleanup and stale throttle cleanup are applied during request lifecycle and by a periodic housekeeping scheduler.
- Endpoint handlers are wrapped with a safety guard that catches unexpected runtime failures and returns `500 internal_server_error` with structured stderr events.
- Process-level uncaught exception logging is enabled, and shutdown now stops housekeeping + request executors for graceful teardown.

## Environment configuration

- `PORT` — server port (default `8085`)
- `TAHIR_ALLOWED_ORIGIN` — explicit CORS allow origin (`*` or comma-separated origins; default allows localhost + private LAN origins)
- `TAHIR_ADMIN_EMAIL` — override seeded admin email
- `TAHIR_TRUST_PRIVATE_NETWORK_ORIGINS` — when `true/1/yes`, private-network browser origins (10.x/172.16-31.x/192.168.x/localhost) are auto-allowed when not explicitly listed
- `TAHIR_ADMIN_PASSWORD` — override seeded admin password
- `TAHIR_DISABLE_DEFAULT_ADMIN` — set `true/1/yes` to skip default admin auto-seed
- `TAHIR_ENABLE_DEFAULT_ADMIN` — set `true/1/yes` to allow default-admin seeding (disabled by default)
- `TAHIR_ENABLE_SEEDED_USERS` — set `true/1/yes` to seed/reset Skyline users (disabled by default)
- `TAHIR_SESSION_TTL_SECONDS` — override bearer session time-to-live in seconds (default `28800`)
- `TAHIR_MAX_REQUEST_BODY_BYTES` — override maximum accepted JSON body size in bytes (default `8192`)
- `TAHIR_STATE_SNAPSHOT_MAX_BODY_BYTES` — optional cap for snapshot payloads (default `5242880`)
- `TAHIR_RELEASE_VERSION` — value returned by `/api/health` as `version` (default `dev`)
- `TAHIR_LOGIN_MAX_ATTEMPTS` — failed login attempts before lockout (default `5`)
- `TAHIR_LOGIN_ATTEMPT_WINDOW_SECONDS` — rolling attempt window in seconds (default `600`)
- `TAHIR_LOGIN_LOCKOUT_SECONDS` — lockout duration in seconds (default `900`)

## Run locally

```bash
npm run java:server
```

Server listens on `0.0.0.0:8085` by default so it is reachable by devices in the same local network.

Frontend clients should prefer `VITE_JAVA_API_BASE=/api` with reverse proxy (Docker Nginx / Vite proxy) for same-origin access. If no proxy is used, set `VITE_JAVA_API_BASE` to your reachable Java host (e.g., `http://192.168.1.10:8085`).

Health endpoint sample fields:

- `service`: `tahir-erp-java-server`
- `version`: release tag (from `TAHIR_RELEASE_VERSION`)
- `uptimeSec`: process uptime in seconds
- `activeSessions`: currently tracked non-expired sessions
- `registeredUsers`: loaded users from `users.csv`
- `loginRateLimitedPrincipals`: principals currently in lockout/tracking window
- `metrics`: cumulative request counters (`totalRequests`, `responses4xx`, `responses5xx`, `avgResponseBytes`)
- `housekeeping`: scheduler telemetry (`runs`, `lastRunEpochMs`)
- `config`: active runtime guardrails (`sessionTtlSec`, `maxRequestBodyBytes`, `snapshotMaxBodyBytes`, login throttle limits)

## Example usage

Register:

```bash
curl -X POST http://localhost:8085/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tech1@local","fullName":"Tech One","password":"secret123"}'
```

Login:

```bash
curl -X POST http://localhost:8085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tech1@local.com","password":"StrongPass@123"}'
```

Change password:

```bash
curl -X POST http://localhost:8085/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"currentPassword":"StrongPass@123","newPassword":"StrongerPass@456"}'
```

## Seeded operator accounts

When `TAHIR_ENABLE_SEEDED_USERS=true`, the server ensures seeded users exist:

- `id.skyline2@erp.com` ... `id.skyline31@erp.com`
- password pattern: `userNskylinein` (example: skyline2 -> `user2skylinein`)

To reset all seeded Skyline user passwords back to defaults, call:

```bash
curl -X POST http://localhost:8085/api/auth/reset-seeded-passwords \
  -H "Authorization: Bearer <token>"
```

Notes:

- Password reset endpoint now requires an authenticated admin session determined by session role (`ADMIN`).
- Auth responses (`/api/auth/login`, `/api/auth/me`, `/api/auth/users`) include a `role` field (`ADMIN`/`USER`) for UI governance checks.
- Legacy `users.csv` rows without `role` are auto-migrated in-memory (`TAHIR_ADMIN_EMAIL` -> `ADMIN`, others -> `USER`) and persisted on rewrite.
- For production, keep both `TAHIR_ENABLE_DEFAULT_ADMIN` and `TAHIR_ENABLE_SEEDED_USERS` unset/false.
