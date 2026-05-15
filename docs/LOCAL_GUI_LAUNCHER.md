# Local GUI Launcher (One-Click Setup & Run)

This project now includes a **desktop GUI launcher** to make local setup and usage easier for non-technical users.

## What it does
- Install dependencies (`npm install`)
- Run tests (`npx vitest run --config tests/vitest.config.ts`)
- Build the app (`npm run build`)
- Launch preview server on LAN (`npm run preview -- --host 0.0.0.0 --port <port>`)
- Start/stop Java API server (local multi-user auth service)
- Optionally start/stop PostgreSQL stack via Docker Compose (`docker compose up -d` / `down`)
- Show live logs in one window
- Provide a **One-click Setup + Launch** button

## Run the launcher
From project root:

```bash
npm run launcher
```

Or directly:

```bash
python3 tools/local_launcher_gui.py
```

## LAN usage
1. Run the launcher on your office server machine.
2. Click **One-click Setup + Launch**.
3. Share displayed URL with employees, e.g. `http://192.168.1.20:4173`.
4. Employees can access from browsers on same local network.

## Notes
- If Docker CLI is unavailable, DB start/stop buttons will log errors but app launch still works.
- This launcher is intended as a user-friendly operations wrapper for local deployment.
- Java API health default: `http://<server-ip>:8085/api/health`
