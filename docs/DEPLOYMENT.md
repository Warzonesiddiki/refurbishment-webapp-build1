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
Use a Node build stage and static server (nginx) runtime as needed.

## Backup/Restore Migration
Use app backup (`Ctrl+B`) and restore (`Ctrl+Shift+B`) to move data between deployments.

## Monitoring
Integrate error/analytics tooling (e.g., Sentry) in production deployments.
