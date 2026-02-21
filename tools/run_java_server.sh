#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/java_server/out"
SRC_DIR="$ROOT_DIR/java_server/src"
POM_FILE="$ROOT_DIR/java_server/pom.xml"
PORT="${1:-8085}"
BUILD_TOOL="${TAHIR_JAVA_BUILD_TOOL:-auto}"

export TAHIR_ENABLE_SEEDED_USERS="${TAHIR_ENABLE_SEEDED_USERS:-true}"

case "$BUILD_TOOL" in
  auto|javac|maven) ;;
  *)
    echo "Unsupported TAHIR_JAVA_BUILD_TOOL: $BUILD_TOOL (allowed: auto|javac|maven)" >&2
    exit 1
    ;;
esac

if [[ "$BUILD_TOOL" == "maven" ]] && (! command -v mvn >/dev/null 2>&1 || [[ ! -f "$POM_FILE" ]]); then
  echo "Maven build requested but mvn or java_server/pom.xml is unavailable." >&2
  exit 1
fi

if [[ "$BUILD_TOOL" != "javac" ]] && command -v mvn >/dev/null 2>&1 && [[ -f "$POM_FILE" ]]; then
  mvn -q -f "$POM_FILE" -DskipTests compile exec:java -Dexec.args="$PORT"
  exit 0
fi

mkdir -p "$OUT_DIR"
find "$OUT_DIR" -type f -name '*.class' -delete

javac -d "$OUT_DIR" $(find "$SRC_DIR" -type f -name '*.java')
java -cp "$OUT_DIR" com.tahir.server.Main "$PORT"
