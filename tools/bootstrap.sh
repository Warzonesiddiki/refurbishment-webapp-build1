#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN="false"
SKIP_SYSTEM="false"
WITH_DOCKER="false"

log() { printf "\033[1;34m[bootstrap]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[bootstrap:warn]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[bootstrap:error]\033[0m %s\n" "$*"; }

run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf "[dry-run] %s\n" "$*"
  else
    eval "$@"
  fi
}

usage() {
  cat <<USAGE
One-click setup for Tahir ERP.

Usage:
  bash tools/bootstrap.sh [options]

Options:
  --dry-run       Print actions without changing the system.
  --skip-system   Skip system package/software installation and only install project deps.
  --with-docker   Attempt Docker installation where supported.
  -h, --help      Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN="true" ;;
    --skip-system) SKIP_SYSTEM="true" ;;
    --with-docker) WITH_DOCKER="true" ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

command_exists() { command -v "$1" >/dev/null 2>&1; }

require_sudo_if_needed() {
  if [[ "$DRY_RUN" == "true" ]]; then
    return
  fi
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    if command_exists sudo; then
      SUDO="sudo"
    else
      warn "sudo is not available; some system installs may fail."
      SUDO=""
    fi
  else
    SUDO=""
  fi
}

install_node_with_nvm() {
  log "Installing Node.js via nvm (LTS)..."
  if [[ ! -d "$HOME/.nvm" ]]; then
    run_cmd "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  fi
  # shellcheck disable=SC1090
  run_cmd "source \"$HOME/.nvm/nvm.sh\" && nvm install --lts && nvm alias default lts/*"
}

install_system_deps_linux() {
  require_sudo_if_needed
  if ! command_exists apt-get; then
    warn "Unsupported Linux package manager for automatic setup. Install Node.js 20+, npm, git, curl, Java 17+ manually."
    return
  fi

  log "Installing base packages via apt..."
  run_cmd "$SUDO apt-get update"
  run_cmd "$SUDO apt-get install -y git curl ca-certificates build-essential python3 python3-pip openjdk-17-jre"

  if [[ "$WITH_DOCKER" == "true" ]]; then
    log "Installing Docker engine via apt..."
    run_cmd "$SUDO apt-get install -y docker.io docker-compose-v2 || $SUDO apt-get install -y docker.io docker-compose-plugin"
    run_cmd "$SUDO usermod -aG docker \"$USER\" || true"
  fi
}

install_system_deps_macos() {
  if ! command_exists brew; then
    warn "Homebrew not found. Install it first from https://brew.sh, then rerun bootstrap."
    return
  fi

  log "Installing base packages via Homebrew..."
  run_cmd "brew update"
  run_cmd "brew install git curl python openjdk@17"

  if [[ "$WITH_DOCKER" == "true" ]]; then
    warn "Docker Desktop is recommended on macOS: https://www.docker.com/products/docker-desktop/"
  fi
}

install_system_deps() {
  local os
  os="$(uname -s)"
  case "$os" in
    Linux) install_system_deps_linux ;;
    Darwin) install_system_deps_macos ;;
    *) warn "Unsupported OS ($os) for automated system package setup." ;;
  esac
}

install_project_dependencies() {
  log "Installing JavaScript dependencies..."
  cd "$ROOT_DIR"

  if [[ -f package-lock.json ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      run_cmd "npm ci"
    else
      set +e
      npm ci
      ci_status=$?
      set -e
      if [[ $ci_status -ne 0 ]]; then
        warn "npm ci failed (lock mismatch or registry policy). Falling back to npm install..."
        run_cmd "npm install"
      fi
    fi
  else
    run_cmd "npm install"
  fi

  if [[ -f playwright.config.ts ]]; then
    log "Installing Playwright browsers (and deps on Linux where supported)..."
    if [[ "$(uname -s)" == "Linux" ]]; then
      run_cmd "npx playwright install --with-deps chromium firefox webkit || npx playwright install chromium firefox webkit"
    else
      run_cmd "npx playwright install chromium firefox webkit"
    fi
  fi
}

validate_installation() {
  log "Validating setup..."
  run_cmd "node -v"
  run_cmd "npm -v"
  run_cmd "npm run typecheck"
}

main() {
  log "Starting one-click bootstrap for Tahir ERP"

  if [[ "$SKIP_SYSTEM" != "true" ]]; then
    install_system_deps
  fi

  if ! command_exists node || ! command_exists npm; then
    install_node_with_nvm
    # shellcheck disable=SC1090
    source "$HOME/.nvm/nvm.sh" || true
  fi

  install_project_dependencies
  validate_installation

  log "Bootstrap complete."
  if [[ "$WITH_DOCKER" == "true" ]]; then
    warn "If Docker group membership was changed, log out/in before running docker without sudo."
  fi
}

main
