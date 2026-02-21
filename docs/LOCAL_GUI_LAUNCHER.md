# Local GUI Launcher (One-Click Setup & Run)

This project includes a **desktop GUI launcher** for non-technical operators to bootstrap and run the stack with minimal manual steps.

## What it does

- Run a **preflight tool check** (Python, Node, npm, optional Java/JDK, optional Docker)
- Run a strict prerequisites validation based on selected one-click options (Java/DB)
- Validate launch port input before each setup/start action (must be `1-65535`)
- Install frontend dependencies automatically (`npm run deps:install`)
- Run full non-watch test suite (`npm run test:run`) with the same preflight validation used for install
- Run focused operations core tests for inventory/parts + WIP pipelines
- Build the app (`npm run build`)
- Launch preview server on LAN (`npm run preview -- --host 0.0.0.0 --port <port>`)
- Start/stop frontend dev server on LAN (`npm run dev -- --host 0.0.0.0 --port <port>`)
- Start/stop Java API server (local multi-user auth service)
- Check Java API health endpoint directly from launcher (`/api/health`)
- Optionally start/stop PostgreSQL stack via Docker Compose (`docker compose pull postgres adminer`, `up -d postgres adminer`, `stop postgres adminer`)
- Configure one-click options with checkboxes:
  - **Start Java API in one-click**
  - **Start DB in one-click**
- Show live logs in one window
- Show live service status indicators (Dev/Preview/Java API/DB)
- Load/edit/save `.env` directly from launcher UI (adds `VITE_JAVA_API_BASE=/api` if missing on save)
- Provide a **One-click Setup + Launch** pipeline with install → full tests → inventory/WIP core checks → build → launch order

## Run the launcher

From project root:

```bash
npm run launcher
```

Or directly:

```bash
python3 tools/local_launcher_gui.py
```

## Recommended operator workflow

1. Select one-click options:
   - keep **Start Java API in one-click** enabled for login/auth flow,
   - enable **Start DB in one-click** only when Docker is installed.
2. Click **0) Preflight Check**.
3. Click **Check Prerequisites** for full prerequisite validation.
4. Click **Run Ops Core Tests** to validate Inventory/Parts and WIP flows before rollout.
5. Click **One-click Setup + Launch**.
6. Share displayed URL with employees, e.g. `http://192.168.1.20:4173`.

## LAN usage

1. Run the launcher on your office server machine.
2. Click **One-click Setup + Launch**.
3. Share displayed URL with employees.
4. Employees can access from browsers on same local network.

## Notes

- The one-click pipeline stops automatically if install/tests/build fail, including process start failures; preview launch is blocked when build did not start successfully.
- One-click preflight treats Java and Docker as required only if their one-click checkboxes are enabled.
- One-click now prevents duplicate pipeline runs while an existing run is still in progress and disables the one-click button during active pipeline execution.
- When DB is enabled, preflight verifies Docker Compose plugin usability (`docker compose version`) and required project files. The launcher DB action manages only `postgres` + `adminer` so it does not conflict with local frontend/Java ports.
- DB start/stop now require Docker Compose availability and `docker-compose.yml`; launcher logs explicit errors when either is missing, and compose-up is blocked if pull fails or cannot start.
- DB status indicator is refreshed automatically using `docker compose ps` when Docker Compose is available.
- Frontend dev and preview modes are mutually guarded to avoid port conflicts.
- If Java/JDK is unavailable, Java API start will be skipped with a clear log message.
- Java API health default: `http://<server-ip>:8085/api/health`

- Ops core button executes `npm run check:core-areas` for critical Inventory/Parts + WIP regression coverage.


## Java build-tool override

- By default, launcher/server scripts prefer **Maven** when `mvn` is available and fallback to `javac/java`.
- To force legacy compilation/run path, set environment variable:

```bash
export TAHIR_JAVA_BUILD_TOOL=maven
# PowerShell: $env:TAHIR_JAVA_BUILD_TOOL="maven"
# CMD: set TAHIR_JAVA_BUILD_TOOL=maven
```

- Supported values: `auto` (default), `javac`, `maven`.
- CLI flag `python tools/run_java_server.py <port> --build-tool=...` overrides env var when both are present.

- Dev launcher accepts `--build-tool=<auto|javac|maven>` and can continue without Java when `DEV_ALLOW_WEB_WITHOUT_JAVA=true`.

- Dev launcher flags: `--build-tool=<auto|javac|maven>`, `--java-port=<port>`, `--no-java`, `--help`.
