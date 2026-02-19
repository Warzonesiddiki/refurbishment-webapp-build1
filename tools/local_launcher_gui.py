#!/usr/bin/env python3
"""
Local GUI launcher for TAHIR ERP demo stack.
- One-click setup (install + test + build + launch)
- Optional Docker Postgres/Adminer start
- Live log console in a simple Tkinter GUI
"""

from __future__ import annotations

import ipaddress
import os
import queue
import shlex
import shutil
import signal
import socket
import subprocess
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 4173
ENV_PATH = ROOT / ".env"
ENV_EXAMPLE_PATH = ROOT / ".env.example"


class LauncherApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("TAHIR ERP — Local Setup & Launch")
        self.root.geometry("1080x760")

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.running: dict[str, subprocess.Popen] = {}
        self.pending: set[str] = set()
        self.pipeline_active = False

        self.status_vars = {
            "frontend-dev": tk.StringVar(value="DEV: STOPPED"),
            "preview": tk.StringVar(value="PREVIEW: STOPPED"),
            "java-api": tk.StringVar(value="JAVA API: STOPPED"),
            "db": tk.StringVar(value="DB: UNKNOWN"),
        }

        self._build_ui()
        self._pump_logs()
        self._write_header()
        self._load_env_into_editor()
        self._refresh_service_statuses()

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def _build_ui(self):
        top = ttk.Frame(self.root, padding=12)
        top.pack(fill=tk.X)

        title = ttk.Label(top, text="One-click local setup and launch", font=("Segoe UI", 14, "bold"))
        title.pack(anchor=tk.W)

        desc = ttk.Label(
            top,
            text=(
                "Use this GUI to install dependencies, run tests, launch the ERP web app on your local network, "
                "and optionally start Java API + PostgreSQL via Docker Compose."
            ),
            wraplength=1020,
        )
        desc.pack(anchor=tk.W, pady=(4, 10))

        controls = ttk.Frame(self.root, padding=(12, 0, 12, 8))
        controls.pack(fill=tk.X)

        self.host_var = tk.StringVar(value=self._detect_host_ip())
        self.port_var = tk.StringVar(value=str(DEFAULT_PORT))
        self.start_java_var = tk.BooleanVar(value=True)
        self.start_db_var = tk.BooleanVar(value=False)

        ttk.Label(controls, text="Host IP:").grid(row=0, column=0, sticky="w", padx=(0, 6))
        ttk.Entry(controls, textvariable=self.host_var, width=18).grid(row=0, column=1, sticky="w")

        ttk.Label(controls, text="Port:").grid(row=0, column=2, sticky="w", padx=(18, 6))
        ttk.Entry(controls, textvariable=self.port_var, width=8).grid(row=0, column=3, sticky="w")

        ttk.Checkbutton(controls, text="Start Java API in one-click", variable=self.start_java_var).grid(
            row=0, column=4, sticky="w", padx=(20, 10)
        )
        ttk.Checkbutton(controls, text="Start DB in one-click", variable=self.start_db_var).grid(row=0, column=5, sticky="w")

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(controls, textvariable=self.status_var).grid(row=1, column=0, columnspan=6, sticky="w", pady=(8, 0))

        badges = ttk.Frame(controls)
        badges.grid(row=2, column=0, columnspan=6, sticky="w", pady=(8, 0))
        ttk.Label(badges, textvariable=self.status_vars["frontend-dev"]).pack(side=tk.LEFT, padx=(0, 14))
        ttk.Label(badges, textvariable=self.status_vars["preview"]).pack(side=tk.LEFT, padx=(0, 14))
        ttk.Label(badges, textvariable=self.status_vars["java-api"]).pack(side=tk.LEFT, padx=(0, 14))
        ttk.Label(badges, textvariable=self.status_vars["db"]).pack(side=tk.LEFT)

        buttons = ttk.Frame(self.root, padding=(12, 0, 12, 8))
        buttons.pack(fill=tk.X)

        ttk.Button(buttons, text="0) Preflight Check", command=self.preflight_check).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Check Prerequisites", command=self.check_prerequisites).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="1) Install Dependencies", command=self.install_dependencies).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="2) Run Tests", command=self.run_tests).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Run Ops Core Tests", command=self.run_ops_core_tests).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="3) Start App (Build + Preview)", command=self.start_app).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Start Frontend Dev", command=self.start_frontend_dev).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Start Java API", command=self.start_java_api).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Start DB (Docker)", command=self.start_db).pack(side=tk.LEFT, padx=(0, 8))
        self.one_click_btn = ttk.Button(buttons, text="One-click Setup + Launch", command=self.one_click)
        self.one_click_btn.pack(side=tk.LEFT)

        buttons2 = ttk.Frame(self.root, padding=(12, 0, 12, 8))
        buttons2.pack(fill=tk.X)
        ttk.Button(buttons2, text="Stop App", command=self.stop_app).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Stop Frontend Dev", command=self.stop_frontend_dev).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Stop Java API", command=self.stop_java_api).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Stop DB", command=self.stop_db).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Check API Health", command=self.check_java_api_health).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Load Env", command=self._load_env_into_editor).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Save Env", command=self.save_env_file).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Clear Logs", command=self.clear_logs).pack(side=tk.LEFT)

        env_frame = ttk.LabelFrame(self.root, text="Environment Configuration (.env)", padding=(12, 8))
        env_frame.pack(fill=tk.X, padx=12, pady=(0, 8))
        self.env_text = tk.Text(env_frame, wrap="none", height=6)
        self.env_text.pack(fill=tk.X)

        log_frame = ttk.Frame(self.root, padding=(12, 0, 12, 12))
        log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(log_frame, wrap="word", height=30)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scroll = ttk.Scrollbar(log_frame, command=self.log_text.yview)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.configure(yscrollcommand=scroll.set)

    def _detect_host_ip(self) -> str:
        candidates: list[str] = []

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.connect(("8.8.8.8", 80))
                candidates.append(sock.getsockname()[0])
        except OSError:
            pass

        hostname = socket.gethostname()
        for value in [hostname, f"{hostname}.local"]:
            try:
                info = socket.getaddrinfo(value, None, socket.AF_INET, socket.SOCK_DGRAM)
            except socket.gaierror:
                continue
            for entry in info:
                candidates.append(entry[4][0])

        try:
            candidates.append(socket.gethostbyname(hostname))
        except socket.gaierror:
            pass

        for ip in candidates:
            try:
                parsed = ipaddress.ip_address(ip)
            except ValueError:
                continue
            if parsed.version != 4 or parsed.is_loopback or parsed.is_unspecified:
                continue
            return ip

        return "127.0.0.1"

    def _write_header(self):
        self._log(f"Project root: {ROOT}")
        self._log("Tip: Share this URL on LAN after launch:")
        self._log(self.current_url())
        self._log("Java API default: http://" + self.host_var.get().strip() + ":8085/api/health")

    def current_url(self) -> str:
        host = self.host_var.get().strip() or "127.0.0.1"
        port = self.port_var.get().strip() or str(DEFAULT_PORT)
        return f"http://{host}:{port}"

    def _pump_logs(self):
        try:
            while True:
                line = self.log_queue.get_nowait()
                self.log_text.insert(tk.END, line + "\n")
                self.log_text.see(tk.END)
        except queue.Empty:
            pass
        self.root.after(100, self._pump_logs)

    def _log(self, msg: str):
        self.log_queue.put(msg)

    def clear_logs(self):
        self.log_text.delete("1.0", tk.END)

    def _run_background(self, name: str, cmd: str | list[str], keep_running: bool = False):
        if name in self.running and self.running[name].poll() is None:
            self._log(f"[{name}] already running")
            return

        self.pending.add(name)

        def worker():
            self.status_var.set(f"Running: {name}")
            display_cmd = cmd if isinstance(cmd, str) else " ".join(cmd)
            self._log(f"[{name}] $ {display_cmd}")
            try:
                args = shlex.split(cmd, posix=os.name != "nt") if isinstance(cmd, str) else list(cmd)
                if args:
                    resolved = shutil.which(args[0])
                    if resolved:
                        args[0] = resolved
                proc = subprocess.Popen(
                    args,
                    cwd=ROOT,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    env=os.environ.copy(),
                )
                self.running[name] = proc

                assert proc.stdout is not None
                for line in proc.stdout:
                    self._log(f"[{name}] {line.rstrip()}")

                rc = proc.wait()
                if not keep_running:
                    self.running.pop(name, None)
                self._log(f"[{name}] exited with code {rc}")
                self.status_var.set("Ready" if rc == 0 else f"Failed: {name}")
            except Exception as exc:  # noqa: BLE001
                self.running.pop(name, None)
                self._log(f"[{name}] error: {exc}")
                self.status_var.set(f"Failed: {name}")
            finally:
                self.pending.discard(name)

        threading.Thread(target=worker, daemon=True).start()

    def _parse_port(self) -> int | None:
        raw_port = self.port_var.get().strip() or str(DEFAULT_PORT)
        try:
            port = int(raw_port)
        except ValueError:
            self._log(f"[validation] invalid port '{raw_port}'. Enter an integer between 1 and 65535")
            self.status_var.set("Failed: invalid port")
            return None

        if not 1 <= port <= 65535:
            self._log(f"[validation] invalid port '{raw_port}'. Enter an integer between 1 and 65535")
            self.status_var.set("Failed: invalid port")
            return None

        return port

    def _wait_for_process(self, name: str, callback):
        proc = self.running.get(name)
        if name in self.pending:
            self.root.after(350, lambda: self._wait_for_process(name, callback))
            return
        if proc and proc.poll() is None:
            self.root.after(350, lambda: self._wait_for_process(name, callback))
            return
        callback(proc)

    def _command_exists(self, command: str) -> bool:
        return shutil.which(command) is not None

    def _is_running(self, name: str) -> bool:
        proc = self.running.get(name)
        return proc is not None and proc.poll() is None

    def _is_any_running(self, names: list[str]) -> bool:
        return any(self._is_running(name) for name in names)

    def _set_pipeline_active(self, active: bool):
        self.pipeline_active = active
        if active:
            self.one_click_btn.state(["disabled"])
        else:
            self.one_click_btn.state(["!disabled"])

    def _docker_compose_available(self) -> bool:
        if not self._command_exists("docker"):
            return False

        try:
            result = subprocess.run(
                ["docker", "compose", "version"],
                cwd=ROOT,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
                text=True,
            )
            return result.returncode == 0
        except OSError:
            return False

    def _db_stack_running(self) -> bool:
        if not self._docker_compose_available() or not (ROOT / "docker-compose.yml").exists():
            return False
        try:
            result = subprocess.run(
                ["docker", "compose", "ps", "--services", "--filter", "status=running"],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                check=False,
                text=True,
            )
            return result.returncode == 0 and bool(result.stdout.strip())
        except OSError:
            return False

    def _refresh_service_statuses(self):
        self.status_vars["frontend-dev"].set("DEV: RUNNING" if self._is_running("frontend-dev") else "DEV: STOPPED")
        self.status_vars["preview"].set("PREVIEW: RUNNING" if self._is_running("preview") else "PREVIEW: STOPPED")
        self.status_vars["java-api"].set("JAVA API: RUNNING" if self._is_running("java-api") else "JAVA API: STOPPED")
        if self._docker_compose_available() and (ROOT / "docker-compose.yml").exists():
            self.status_vars["db"].set("DB: RUNNING" if self._db_stack_running() else "DB: STOPPED")
        else:
            self.status_vars["db"].set("DB: UNAVAILABLE")
        self.root.after(2000, self._refresh_service_statuses)

    def _load_env_into_editor(self):
        source = ENV_PATH if ENV_PATH.exists() else ENV_EXAMPLE_PATH
        if source.exists():
            content = source.read_text(encoding="utf-8")
            self.env_text.delete("1.0", tk.END)
            self.env_text.insert("1.0", content)
            self._log(f"[env] loaded {source.name}")
        else:
            self._log("[env] no .env or .env.example found")

    def save_env_file(self):
        content = self.env_text.get("1.0", tk.END).rstrip() + "\n"
        if "VITE_JAVA_API_BASE" not in content:
            content += "VITE_JAVA_API_BASE=/api\n"
            self._log("[env] added default VITE_JAVA_API_BASE=/api")
        ENV_PATH.write_text(content, encoding="utf-8")
        self._log("[env] saved .env")
        self.status_var.set("Ready")

    def _parse_env_content(self) -> dict[str, str]:
        content = self.env_text.get("1.0", tk.END)
        env_map: dict[str, str] = {}
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env_map[key.strip()] = value.strip()
        return env_map

    def _resolve_java_api_port(self) -> int:
        env_map = self._parse_env_content()
        raw = env_map.get("JAVA_API_PORT") or env_map.get("API_PORT") or "8085"
        try:
            value = int(raw)
            if 1 <= value <= 65535:
                return value
        except ValueError:
            pass
        return 8085

    def preflight_check(self, strict_optional: bool = False) -> bool:
        port = self._parse_port()
        if port is None:
            return False

        java_required = strict_optional and self.start_java_var.get()
        docker_required = strict_optional and self.start_db_var.get()
        checks = [
            ("python3", "required for launcher", True),
            ("node", "required for frontend runtime", True),
            ("npm", "required for dependency install", True),
            ("java", "required for Java API if enabled", java_required),
            ("javac", "required to compile Java API if enabled", java_required),
            ("docker", "required for DB if enabled", docker_required),
        ]

        self._log("[preflight] checking required tools")
        self._log(f"[preflight] target LAN URL: http://{self.host_var.get().strip() or '127.0.0.1'}:{port}")
        all_required_ok = True
        for cmd, desc, required in checks:
            available = self._command_exists(cmd)
            level = "OK" if available else ("MISSING" if required else "OPTIONAL-MISSING")
            self._log(f"[preflight] {cmd:7s} {level:16s} — {desc}")
            if required and not available:
                all_required_ok = False

        if docker_required:
            compose_ok = self._docker_compose_available()
            if compose_ok:
                self._log("[preflight] docker compose OK               — required for DB startup")
            else:
                self._log("[preflight] docker compose MISSING/UNUSABLE — install Docker Compose plugin")
                all_required_ok = False

        if java_required and not (ROOT / "tools" / "run_java_server.py").exists():
            self._log("[preflight] tools/run_java_server.py MISSING — required to launch Java API")
            all_required_ok = False

        if docker_required and not (ROOT / "docker-compose.yml").exists():
            self._log("[preflight] docker-compose.yml MISSING      — required to launch DB stack")
            all_required_ok = False

        if all_required_ok:
            self._log("[preflight] all required tooling is available")
            self.status_var.set("Ready")
        else:
            self._log("[preflight] missing required tooling for selected setup. Install missing tools and retry")
            self.status_var.set("Failed: preflight")
        return all_required_ok

    def check_prerequisites(self):
        python_cmd = shutil.which("python3") or shutil.which("python")
        if not python_cmd:
            self._log("[prerequisites] Python runtime missing. Install Python 3 and retry.")
            self.status_var.set("Failed: prerequisites")
            return

        flags = ["--strict-env"]
        if self.start_java_var.get():
            flags.append("--require-java")
        if self.start_db_var.get():
            flags.append("--require-docker")

        flag_text = " ".join(flags)
        prereq_cmd = [python_cmd, "tools/preflight_check.py"]
        if flag_text:
            prereq_cmd.extend(flag_text.split())
        self._run_background("prerequisites", prereq_cmd)

    def install_dependencies(self):
        if not self.preflight_check():
            return
        self._run_background("install", "npm install")

    def run_tests(self):
        if not self.preflight_check():
            return
        self._run_background("tests", "npm run test:run")

    def run_ops_core_tests(self):
        if not self.preflight_check():
            return
        cmd = (
            "npm run test:run -- "
            "tests/integration/inventoryFlow.test.ts "
            "tests/integration/wipFlow.test.ts "
            "tests/batch4/partReducer.test.ts "
            "tests/wipStageTransition.test.ts"
        )
        self._run_background("ops-core-tests", cmd)

    def start_frontend_dev(self):
        port = self._parse_port()
        if port is None:
            return
        if self._is_running("preview"):
            self._log("[frontend-dev] stop preview before starting dev server")
            return
        self._run_background("frontend-dev", f"npm run dev -- --host 0.0.0.0 --port {port}", keep_running=True)
        self._log(f"[frontend-dev] LAN URL: {self.current_url()}")

    def stop_frontend_dev(self):
        proc = self.running.get("frontend-dev")
        if not proc or proc.poll() is not None:
            self._log("[frontend-dev] not running")
            return
        self._terminate_process("frontend-dev", proc)

    def start_app(self):
        port = self._parse_port()
        if port is None:
            return
        if self._is_running("frontend-dev"):
            self._log("[preview] stop frontend dev server before preview")
            return
        self._run_background("build", "npm run build")

        def delayed_preview(proc: subprocess.Popen | None):
            if proc is None or proc.returncode != 0:
                self._log("[preview] skipped because build step failed to start or exited with error")
                return
            self._run_background("preview", f"npm run preview -- --host 0.0.0.0 --port {port}", keep_running=True)
            self._log(f"[preview] LAN URL: {self.current_url()}")

        self._wait_for_process("build", delayed_preview)

    def stop_app(self):
        proc = self.running.get("preview")
        if not proc or proc.poll() is not None:
            self._log("[preview] not running")
            return
        self._terminate_process("preview", proc)

    def start_java_api(self):
        if not self._command_exists("java") or not self._command_exists("javac"):
            self._log("[java-api] Java tooling missing. Install a JDK and retry.")
            self.status_var.set("Failed: java-api")
            return
        python_cmd = shutil.which("python3") or shutil.which("python")
        if not python_cmd:
            self._log("[java-api] Python runtime missing. Install Python 3 and retry.")
            self.status_var.set("Failed: java-api")
            return
        java_port = self._resolve_java_api_port()
        self._run_background("java-api", f"{shlex.quote(python_cmd)} tools/run_java_server.py {java_port}", keep_running=True)
        host = self.host_var.get().strip() or "127.0.0.1"
        self._log(f"[java-api] health URL: http://{host}:{java_port}/api/health")

    def check_java_api_health(self):
        python_cmd = shutil.which("python3") or shutil.which("python")
        if not python_cmd:
            self._log("[java-health] Python runtime missing. Install Python 3 and retry.")
            self.status_var.set("Failed: java-health")
            return
        java_port = self._resolve_java_api_port()
        script = f"import urllib.request;print(urllib.request.urlopen('http://localhost:{java_port}/api/health', timeout=5).read().decode())"
        command = f"{shlex.quote(python_cmd)} -c {shlex.quote(script)}"
        self._run_background("java-health", command)

    def stop_java_api(self):
        proc = self.running.get("java-api")
        if not proc or proc.poll() is not None:
            self._log("[java-api] not running")
            return
        self._terminate_process("java-api", proc)

    def start_db(self):
        if not self._docker_compose_available():
            self._log("[db] Docker Compose unavailable. Install/enable Docker Compose plugin and retry.")
            self.status_var.set("Failed: db")
            return

        if not (ROOT / "docker-compose.yml").exists():
            self._log("[db] docker-compose.yml missing. Cannot start DB stack.")
            self.status_var.set("Failed: db")
            return

        self._run_background("db-pull", "docker compose pull postgres adminer")

        def start_after_pull(proc: subprocess.Popen | None):
            if proc is None or proc.returncode != 0:
                self._log("[db] skipped compose up because docker compose pull failed or could not start")
                return
            self._run_background("db", "docker compose up -d postgres adminer")

        self._wait_for_process("db-pull", start_after_pull)

    def stop_db(self):
        if not self._docker_compose_available():
            self._log("[db-stop] Docker Compose unavailable. Cannot stop DB stack.")
            self.status_var.set("Failed: db-stop")
            return
        if not (ROOT / "docker-compose.yml").exists():
            self._log("[db-stop] docker-compose.yml missing. Nothing to stop.")
            return
        self._run_background("db-stop", "docker compose stop postgres adminer")

    def one_click(self):
        if self.pipeline_active:
            self._log("[one-click] setup pipeline already running")
            return

        if self._is_any_running(["install", "tests", "ops-core-tests", "build"]):
            self._log("[one-click] install/tests/build already running. Wait for current tasks to finish.")
            return

        self._set_pipeline_active(True)
        self._log("[one-click] starting full setup pipeline")
        self._log(f"[one-click] options: start_java={self.start_java_var.get()} start_db={self.start_db_var.get()}")

        if not self.preflight_check(strict_optional=True):
            self._set_pipeline_active(False)
            return

        self._log("[one-click] step 1/6 install dependencies")
        self._run_background("install", "npm install")

        def after_install(proc: subprocess.Popen | None):
            if proc is None or proc.returncode != 0:
                self._log("[one-click] stopped: npm install failed")
                self._set_pipeline_active(False)
                return

            self._log("[one-click] step 2/6 run tests")
            self._run_background("tests", "npm run test:run")

            def after_tests(test_proc: subprocess.Popen | None):
                if test_proc is None or test_proc.returncode != 0:
                    self._log("[one-click] stopped: tests failed")
                    self._set_pipeline_active(False)
                    return

                self._log("[one-click] step 3/6 run inventory+wip core checks")
                self._run_background("ops-core-tests", "npm run check:core-areas")

                def after_ops_core(ops_proc: subprocess.Popen | None):
                    if ops_proc is None or ops_proc.returncode != 0:
                        self._log("[one-click] stopped: inventory/wip core checks failed")
                        self._set_pipeline_active(False)
                        return

                    self._log("[one-click] step 4/6 build frontend")
                    self._run_background("build", "npm run build")

                    def after_build(build_proc: subprocess.Popen | None):
                        if build_proc is None or build_proc.returncode != 0:
                            self._log("[one-click] stopped: build failed")
                            self._set_pipeline_active(False)
                            return

                        self._log("[one-click] step 5/6 start optional backend services")
                        if self.start_db_var.get():
                            self.start_db()
                        if self.start_java_var.get():
                            self.start_java_api()

                        self._log("[one-click] step 6/6 start preview server")
                        port = self._parse_port()
                        if port is None:
                            self._set_pipeline_active(False)
                            return
                        self._run_background("preview", f"npm run preview -- --host 0.0.0.0 --port {port}", keep_running=True)
                        self._log(f"[one-click] ready: {self.current_url()}")
                        self._set_pipeline_active(False)

                    self._wait_for_process("build", after_build)

                self._wait_for_process("ops-core-tests", after_ops_core)

            self._wait_for_process("tests", after_tests)

        self._wait_for_process("install", after_install)

    def _terminate_process(self, name: str, proc: subprocess.Popen):
        try:
            if os.name == "nt":
                proc.terminate()
            else:
                os.kill(proc.pid, signal.SIGTERM)
            self._log(f"[{name}] termination requested")
        except Exception as exc:  # noqa: BLE001
            self._log(f"[{name}] termination error: {exc}")

    def on_close(self):
        active = [n for n, p in self.running.items() if p.poll() is None]
        if active:
            if not messagebox.askyesno("Exit", f"Processes still running: {', '.join(active)}. Stop and exit?"):
                return
            for name in list(active):
                proc = self.running.get(name)
                if proc and proc.poll() is None:
                    self._terminate_process(name, proc)
        self.root.destroy()


def main():
    root = tk.Tk()
    ttk.Style().theme_use("default")
    LauncherApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
