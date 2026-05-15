#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/java_server/out"
SRC_DIR="$ROOT_DIR/java_server/src"
PORT="${1:-8085}"

mkdir -p "$OUT_DIR"
find "$OUT_DIR" -type f -name '*.class' -delete

javac -d "$OUT_DIR" $(find "$SRC_DIR" -type f -name '*.java')
java -cp "$OUT_DIR" com.almasfufa.server.Main "$PORT"
