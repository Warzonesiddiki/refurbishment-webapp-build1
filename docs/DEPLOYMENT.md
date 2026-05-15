# Deployment Guide

## Build Process
```bash
npm run build
```
Output is generated in `dist/`.

## Environment Variables
- `VITE_JAVA_API_BASE`: Java auth/API base URL.

## Static Hosting
Deploy `dist/` to Netlify, Vercel, GitHub Pages, or S3+CloudFront.


## Docker Deployment

### Full stack with Docker Compose
```bash
docker compose up --build
```

### Services
- Frontend web: `http://localhost:4173`
- Java auth API: `http://localhost:8085`
- PostgreSQL: `localhost:5432`
- Adminer: `http://localhost:8080`

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
