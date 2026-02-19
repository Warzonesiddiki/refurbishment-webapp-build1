# Deployment Guide

## Build Process

```bash
npm run build
```

Output is generated in `dist/`.

## Environment Variables

- `VITE_JAVA_API_BASE`: Java auth/API base URL (recommended: `/api` for same-origin routing).
- `VITE_LOCAL_API_PROXY_TARGET`: optional local dev/preview proxy target for `/api` (default `http://localhost:8085`).
- `TAHIR_ALLOWED_ORIGIN`: CORS allow-list for Java API (`*` or comma-separated origins).
- `TAHIR_TRUST_PRIVATE_NETWORK_ORIGINS`: allow CORS for private LAN origins automatically (`true` by default in compose).
- `TAHIR_ENABLE_DEFAULT_ADMIN`: keep unset/false in production.
- `TAHIR_ENABLE_SEEDED_USERS`: keep unset/false in production.

## Static Hosting

Deploy `dist/` to Netlify, Vercel, GitHub Pages, or S3+CloudFront.

## Docker Deployment

### Full stack with Docker Compose

```bash
docker compose up --build
```

### Services

- Frontend web (+ proxied API): `http://<host-ip>:4173`
- Direct Java auth API (optional direct access): `http://<host-ip>:8085`
- PostgreSQL: `<host-ip>:5432` (default bind is localhost for safety)
- Adminer: `http://<host-ip>:8080`

### Host/network binding overrides

Set these in `.env` when needed:

- `WEB_BIND_HOST`, `WEB_PORT`
- `JAVA_BIND_HOST`, `JAVA_API_PORT`
- `ADMINER_BIND_HOST`, `ADMINER_PORT`
- `DB_BIND_HOST`, `DB_PORT`

### Startup reliability

Compose health checks are configured so `web` waits for a healthy `java-api` before booting.

### Build images only

```bash
docker build -t tahir-erp-web -f Dockerfile .
docker build -t tahir-erp-java-api -f Dockerfile.java .
```

## Backup/Restore Migration

Use app backup (`Ctrl+B`) and restore (`Ctrl+Shift+B`) to move data between deployments.

## Monitoring

Integrate error/analytics tooling (e.g., Sentry) in production deployments.

## Production hardening checklist

- Set explicit `TAHIR_ALLOWED_ORIGIN` for each environment (avoid wildcard in production).
- Do not enable seeded/default credentials in production.
- Rotate admin credentials and enforce password-change SOP for all operators.
- Run `npm run typecheck && npm run test:run && npm run build` before each release.

## Release smoke command

Run the consolidated release gate locally:

```bash
npm run check:release-readiness
```

This command runs typecheck, targeted ops tests, full coverage, production build, and Java server compilation.
