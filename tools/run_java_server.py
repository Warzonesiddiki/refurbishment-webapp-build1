#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "java_server" / "out"
SRC_DIR = ROOT / "java_server" / "src"


def main() -> int:
    port = sys.argv[1] if len(sys.argv) > 1 else "8085"

    javac = shutil.which("javac")
    java = shutil.which("java")
    if not javac or not java:
        print("Java tooling missing: both 'javac' and 'java' are required.", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for class_file in OUT_DIR.rglob("*.class"):
        class_file.unlink()

    sources = [str(p) for p in SRC_DIR.rglob("*.java")]
    if not sources:
        print("No Java source files found.", file=sys.stderr)
        return 1

    compile_proc = subprocess.run([javac, "-d", str(OUT_DIR), *sources], cwd=ROOT)
    if compile_proc.returncode != 0:
        return compile_proc.returncode

    run_proc = subprocess.run([java, "-cp", str(OUT_DIR), "com.tahir.server.Main", port], cwd=ROOT)
    return run_proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
