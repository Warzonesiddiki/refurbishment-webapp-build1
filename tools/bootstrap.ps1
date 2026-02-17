param(
  [switch]$DryRun,
  [switch]$SkipSystem,
  [switch]$WithDocker,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[bootstrap] $msg" -ForegroundColor Cyan }
function Write-WarnMsg($msg) { Write-Host "[bootstrap:warn] $msg" -ForegroundColor Yellow }
function Write-ErrMsg($msg) { Write-Host "[bootstrap:error] $msg" -ForegroundColor Red }

function Show-Usage {
@"
One-click setup for Tahir ERP (Windows 11).

Usage:
  powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 [options]

Options:
  -DryRun       Print actions without changing the system.
  -SkipSystem   Skip system package/software installation and only install project deps.
  -WithDocker   Install Docker Desktop via winget.
  -Help         Show this help.
"@
}

if ($Help) {
  Show-Usage
  exit 0
}

function Invoke-Step($command) {
  if ($DryRun) {
    Write-Host "[dry-run] $command"
  }
  else {
    Invoke-Expression $command
  }
}

function Require-Command($name, $installHint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-ErrMsg "Required command '$name' is missing. $installHint"
    exit 1
  }
}

function Install-WithWinget($pkgId) {
  Invoke-Step "winget install --id $pkgId --source winget --accept-source-agreements --accept-package-agreements"
}

function Install-SystemDependencies {
  Write-Info "Installing system dependencies using winget..."
  Require-Command "winget" "Install App Installer from Microsoft Store, then re-run bootstrap."

  Install-WithWinget "Git.Git"
  Install-WithWinget "OpenJS.NodeJS.LTS"
  Install-WithWinget "Python.Python.3.12"
  Install-WithWinget "Microsoft.OpenJDK.17"

  if ($WithDocker) {
    Install-WithWinget "Docker.DockerDesktop"
  }
}

function Install-ProjectDependencies {
  Write-Info "Installing JavaScript dependencies..."
  Push-Location (Resolve-Path "$PSScriptRoot\..")
  try {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
      Write-WarnMsg "npm not found in current shell PATH. If Node was just installed, open a new PowerShell and re-run bootstrap."
      if (-not $DryRun) { exit 1 }
    }

    if (Test-Path "package-lock.json") {
      if ($DryRun) {
        Invoke-Step "npm ci"
      }
      else {
        try {
          Invoke-Step "npm ci"
        }
        catch {
          Write-WarnMsg "npm ci failed (lock mismatch or registry policy). Falling back to npm install..."
          Invoke-Step "npm install"
        }
      }
    }
    else {
      Invoke-Step "npm install"
    }

    if (Test-Path "playwright.config.ts") {
      Write-Info "Installing Playwright browsers..."
      Invoke-Step "npx playwright install chromium firefox webkit"
    }
  }
  finally {
    Pop-Location
  }
}

function Validate-Setup {
  Write-Info "Validating setup..."
  Invoke-Step "node -v"
  Invoke-Step "npm -v"
  Invoke-Step "npm run typecheck"
}

Write-Info "Starting Windows bootstrap for Tahir ERP"

if (-not $SkipSystem) {
  Install-SystemDependencies
}

Install-ProjectDependencies
Validate-Setup

Write-Info "Bootstrap complete."
if ($WithDocker) {
  Write-WarnMsg "Docker Desktop may require a sign-in and restart before first use."
}
