param(
  [switch]$DryRun,
  [switch]$SkipSystem,
  [switch]$WithDocker,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

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
    return
  }

  $shell = if ($env:ComSpec) { $env:ComSpec } else { 'cmd.exe' }
  & $shell /d /s /c $command
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw ("Command failed with exit code {0}: {1}" -f $exitCode, $command)
  }
}

function Command-Exists($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Require-Command($name, $installHint) {
  if (-not (Command-Exists $name)) {
    Write-ErrMsg "Required command '$name' is missing. $installHint"
    exit 1
  }
}

function Install-WithWinget($pkgId, $commandToDetect) {
  if ($commandToDetect -and (Command-Exists $commandToDetect)) {
    Write-Info "Skipping $pkgId because '$commandToDetect' is already available."
    return
  }

  try {
    Invoke-Step "winget install --id $pkgId --source winget --accept-source-agreements --accept-package-agreements"
  }
  catch {
    Write-WarnMsg "winget install for $pkgId failed. $_"
  }
}

function Install-SystemDependencies {
  Write-Info "Installing system dependencies using winget..."
  Require-Command "winget" "Install App Installer from Microsoft Store, then re-run bootstrap."

  Install-WithWinget "Git.Git" "git"
  Install-WithWinget "OpenJS.NodeJS.LTS" "node"
  Install-WithWinget "Python.Python.3.12" "python"
  Install-WithWinget "Microsoft.OpenJDK.17" "java"

  if ($WithDocker) {
    Install-WithWinget "Docker.DockerDesktop" "docker"
  }
}

function Install-NpmDependencies {
  if (Test-Path "package-lock.json") {
    try {
      Invoke-Step "npm ci --legacy-peer-deps --no-audit --no-fund"
      return
    }
    catch {
      Write-WarnMsg "npm ci failed. Falling back to npm install..."
    }
  }

  try {
    Invoke-Step "npm install --legacy-peer-deps --no-audit --no-fund"
  }
  catch {
    Write-WarnMsg "npm install failed. Attempting node_modules cleanup + reinstall..."
    if (-not $DryRun -and (Test-Path "node_modules")) {
      Remove-Item "node_modules" -Recurse -Force
    }

    if (Test-Path "package-lock.json") {
      Invoke-Step "npm ci --legacy-peer-deps --no-audit --no-fund"
    }
    else {
      Invoke-Step "npm install --legacy-peer-deps --no-audit --no-fund"
    }
  }
}

function Install-ProjectDependencies {
  Write-Info "Installing JavaScript dependencies..."
  Push-Location (Resolve-Path "$PSScriptRoot\..")
  try {
    if (-not (Command-Exists 'npm')) {
      Write-ErrMsg "npm not found in current shell PATH. If Node was just installed, open a new PowerShell and re-run bootstrap."
      if (-not $DryRun) { exit 1 }
    }

    Install-NpmDependencies

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
