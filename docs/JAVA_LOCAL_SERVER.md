# Java Local Network API Server

This project now includes a lightweight Java API service for LAN usage with per-user login.

## What is included
- Source: `java_server/src/com/almasfufa/server/Main.java`
- Run script: `tools/run_java_server.sh`
- NPM shortcut: `npm run java:server`
- Data store: `java_server/data/users.csv`

## API endpoints
- `GET /api/health` — health check
- `POST /api/auth/register` — create user
- `POST /api/auth/login` — login with email/password
- `GET /api/auth/me` — current user from `Authorization: Bearer <token>`

## Run locally
```bash
npm run java:server
```
Server listens on `0.0.0.0:8085` by default so it is reachable by devices in the same local network.

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
  -d '{"email":"tech1@local","password":"secret123"}'
```
