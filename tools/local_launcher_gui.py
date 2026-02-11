#!/usr/bin/env python3
"""
Local GUI launcher for ALMASFUFA ERP demo stack.
- One-click setup (npm install) and launch (build + preview on 0.0.0.0)
- Optional Docker Postgres/Adminer start
- Live log console in a simple Tkinter GUI
"""

from __future__ import annotations

import os
import queue
import shlex
import signal
import socket
import subprocess
import threading
import tkinter as tk
from pathlib import Path
from tkinter import ttk, messagebox


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 4173


class LauncherApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("ALMASFUFA ERP — Local Setup & Launch")
        self.root.geometry("980x680")

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.running: dict[str, subprocess.Popen] = {}

        self._build_ui()
        self._pump_logs()
        self._write_header()

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
            wraplength=920,
        )
        desc.pack(anchor=tk.W, pady=(4, 10))

        controls = ttk.Frame(self.root, padding=(12, 0, 12, 8))
        controls.pack(fill=tk.X)

        self.host_var = tk.StringVar(value=self._detect_host_ip())
        self.port_var = tk.StringVar(value=str(DEFAULT_PORT))

        ttk.Label(controls, text="Host IP:").grid(row=0, column=0, sticky="w", padx=(0, 6))
        ttk.Entry(controls, textvariable=self.host_var, width=18).grid(row=0, column=1, sticky="w")

        ttk.Label(controls, text="Port:").grid(row=0, column=2, sticky="w", padx=(18, 6))
        ttk.Entry(controls, textvariable=self.port_var, width=8).grid(row=0, column=3, sticky="w")

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(controls, textvariable=self.status_var).grid(row=0, column=4, sticky="w", padx=(20, 0))

        buttons = ttk.Frame(self.root, padding=(12, 0, 12, 8))
        buttons.pack(fill=tk.X)

        ttk.Button(buttons, text="1) Install Dependencies", command=self.install_dependencies).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="2) Run Tests", command=self.run_tests).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="3) Start App (Build + Preview)", command=self.start_app).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Start Java API", command=self.start_java_api).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="Start DB (Docker)", command=self.start_db).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons, text="One-click Setup + Launch", command=self.one_click).pack(side=tk.LEFT)

        buttons2 = ttk.Frame(self.root, padding=(12, 0, 12, 12))
        buttons2.pack(fill=tk.X)
        ttk.Button(buttons2, text="Stop App", command=self.stop_app).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Stop Java API", command=self.stop_java_api).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Stop DB", command=self.stop_db).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(buttons2, text="Clear Logs", command=self.clear_logs).pack(side=tk.LEFT)

        log_frame = ttk.Frame(self.root, padding=(12, 0, 12, 12))
        log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(log_frame, wrap="word", height=30)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scroll = ttk.Scrollbar(log_frame, command=self.log_text.yview)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.configure(yscrollcommand=scroll.set)

    def _detect_host_ip(self) -> str:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except OSError:
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

    def _run_background(self, name: str, cmd: str, keep_running: bool = False):
        if name in self.running and self.running[name].poll() is None:
            self._log(f"[{name}] already running")
            return

        def worker():
            self.status_var.set(f"Running: {name}")
            self._log(f"[{name}] $ {cmd}")
            try:
                proc = subprocess.Popen(
                    shlex.split(cmd),
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

        threading.Thread(target=worker, daemon=True).start()

    def install_dependencies(self):
        self._run_background("install", "npm install")

    def run_tests(self):
        self._run_background("tests", "npx vitest run --config tests/vitest.config.ts")

    def start_app(self):
        port = self.port_var.get().strip() or str(DEFAULT_PORT)
        self._run_background("build", "npm run build")

        def delayed_preview():
            build_proc = self.running.get("build")
            if build_proc and build_proc.poll() is None:
                self.root.after(300, delayed_preview)
                return
            if build_proc and build_proc.returncode != 0:
                self._log("[preview] skipped because build failed")
                return
            self._run_background("preview", f"npm run preview -- --host 0.0.0.0 --port {port}", keep_running=True)
            self._log(f"[preview] LAN URL: {self.current_url()}")

        self.root.after(300, delayed_preview)

    def stop_app(self):
        proc = self.running.get("preview")
        if not proc or proc.poll() is not None:
            self._log("[preview] not running")
            return
        self._terminate_process("preview", proc)


    def start_java_api(self):
        self._run_background("java-api", "bash tools/run_java_server.sh 8085", keep_running=True)

    def stop_java_api(self):
        proc = self.running.get("java-api")
        if not proc or proc.poll() is not None:
            self._log("[java-api] not running")
            return
        self._terminate_process("java-api", proc)

    def start_db(self):
        self._run_background("db", "docker compose up -d")

    def stop_db(self):
        self._run_background("db-stop", "docker compose down")

    def one_click(self):
        self._log("[one-click] starting install → java api → build → preview")
        self._run_background("install", "npm install")

        def after_install():
            p = self.running.get("install")
            if p and p.poll() is None:
                self.root.after(400, after_install)
                return
            if p and p.returncode != 0:
                self._log("[one-click] stopped: npm install failed")
                return
            self.start_java_api()
            self.start_app()

        self.root.after(400, after_install)

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
