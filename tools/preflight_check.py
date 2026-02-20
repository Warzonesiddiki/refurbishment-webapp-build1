#!/usr/bin/env python3
from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def check_cmd(name: str, required: bool = True) -> tuple[bool, str]:
    exists = command_exists(name)
    level = "OK" if exists else ("MISSING" if required else "OPTIONAL-MISSING")
    return exists or not required, f"[{level}] {name}"


def check_any(names: list[str], label: str, required: bool = True) -> tuple[bool, str]:
    for name in names:
        if command_exists(name):
            return True, f"[OK] {label} ({name})"

    level = "MISSING" if required else "OPTIONAL-MISSING"
    return (not required), f"[{level}] {label} ({'/'.join(names)})"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate local prerequisites for Tahir ERP")
    parser.add_argument("--require-java", action="store_true", help="Treat Java/Javac as required")
    parser.add_argument("--require-docker", action="store_true", help="Treat Docker Compose as required")
    parser.add_argument("--strict-env", action="store_true", help="Fail if expected env keys are missing")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    ok = True
    print("[preflight] verifying project prerequisites")

    base_checks = [
        ("node", True),
        ("npm", True),
        ("git", True),
        ("curl", True),
    ]

    for cmd, required in base_checks:
        passed, line = check_cmd(cmd, required)
        print(line)
        ok = ok and passed

    if args.require_java:
        has_maven = command_exists("mvn")
        has_java = command_exists("java")
        has_javac = command_exists("javac")
        has_jdk_toolchain = has_java and has_javac

        if has_maven:
            print("[OK] maven (mvn)")
        else:
            print("[OPTIONAL-MISSING] maven (mvn)")

        if has_jdk_toolchain:
            print("[OK] java toolchain (java+javac)")
        else:
            print("[MISSING] java toolchain (java+javac)")

        if not (has_maven or has_jdk_toolchain):
            print("[MISSING] Java server build path (need either mvn OR java+javac)")
            ok = False
    else:
        java_passed, java_line = check_cmd("java", required=False)
        print(java_line)
        javac_passed, javac_line = check_cmd("javac", required=False)
        print(javac_line)
        maven_passed, maven_line = check_cmd("mvn", required=False)
        print(maven_line)

    python_passed, python_line = check_any(["python3", "python"], "python", required=True)
    print(python_line)
    ok = ok and python_passed

    if platform.system().lower().startswith("win"):
        powershell_passed, powershell_line = check_any(["pwsh", "powershell"], "powershell", required=False)
        print(powershell_line)

    compose_available = False
    if command_exists("docker"):
        proc = subprocess.run(["docker", "compose", "version"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        compose_available = proc.returncode == 0

    compose_required = args.require_docker
    compose_level = "OK" if compose_available else ("MISSING" if compose_required else "OPTIONAL-MISSING")
    print(f"[{compose_level}] docker compose")
    if compose_required and not compose_available:
        ok = False

    compose_file_exists = (ROOT / "docker-compose.yml").exists()
    if not compose_file_exists:
        level = "MISSING" if compose_required else "OPTIONAL-MISSING"
        print(f"[{level}] docker-compose.yml")
        if compose_required:
            ok = False

    env_example = ROOT / ".env.example"
    if not env_example.exists():
        print("[MISSING] .env.example")
        ok = False
    else:
        content = env_example.read_text(encoding="utf-8")
        required_envs = ["VITE_JAVA_API_BASE", "JAVA_API_PORT", "WEB_PORT"]
        for key in required_envs:
            has_key = key in content
            if has_key:
                print(f"[OK] {key} present in .env.example")
            else:
                level = "MISSING" if args.strict_env else "OPTIONAL-MISSING"
                print(f"[{level}] {key} missing in .env.example")
                if args.strict_env:
                    ok = False

    if not ok:
        print("[preflight] prerequisite check failed")
        return 1

    print("[preflight] prerequisite check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
