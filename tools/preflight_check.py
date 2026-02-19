#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def check_cmd(name: str, required: bool = True) -> tuple[bool, str]:
    exists = command_exists(name)
    level = "OK" if exists else ("MISSING" if required else "OPTIONAL-MISSING")
    return exists or not required, f"[{level}] {name}"


def main() -> int:
    checks = [
        ("node", True),
        ("npm", True),
        ("python3", False),
        ("python", False),
        ("java", True),
        ("javac", True),
        ("git", True),
        ("curl", True),
    ]

    ok = True
    print("[preflight] verifying project prerequisites")
    for cmd, required in checks:
        passed, line = check_cmd(cmd, required)
        print(line)
        ok = ok and passed

    compose_available = False
    if command_exists("docker"):
        proc = subprocess.run(["docker", "compose", "version"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        compose_available = proc.returncode == 0
    print(f"[{'OK' if compose_available else 'OPTIONAL-MISSING'}] docker compose")

    if not (ROOT / "docker-compose.yml").exists():
        print("[MISSING] docker-compose.yml")
        ok = False

    env_example = ROOT / ".env.example"
    if not env_example.exists():
        print("[MISSING] .env.example")
        ok = False
    else:
        content = env_example.read_text(encoding="utf-8")
        required_envs = ["VITE_JAVA_API_BASE", "JAVA_API_PORT", "WEB_PORT"]
        for key in required_envs:
            if key in content:
                print(f"[OK] {key} present in .env.example")
            else:
                print(f"[MISSING] {key} missing in .env.example")
                ok = False

    if not ok:
        print("[preflight] prerequisite check failed")
        return 1

    print("[preflight] prerequisite check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
