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
- No runtime env vars required for frontend-only build. Backend endpoints are stubbed; when wiring real APIs, expose `VITE_API_BASE` and use in api.ts.

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
