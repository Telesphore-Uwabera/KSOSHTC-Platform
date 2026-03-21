# Trigger a Render backend deploy using the Render CLI.
# Prerequisites:
#   1) pnpm install:render-cli   (first time only)
#   2) render login              (once per machine; opens browser — or set RENDER_API_KEY)
#   3) $env:RENDER_SERVICE_ID = "srv-..." from Dashboard → Web Service → Settings → Service ID
#
# Usage:  pnpm deploy:render
#         $env:RENDER_SERVICE_ID="srv-xxx"; pnpm deploy:render
param(
  [string] $ServiceId = $env:RENDER_SERVICE_ID
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$render = Join-Path $repoRoot "tools\render\render.exe"

if (-not (Test-Path $render)) {
  Write-Host "Render CLI not found. Running install-render-cli.ps1..."
  & (Join-Path $PSScriptRoot "install-render-cli.ps1")
}

if (-not (Test-Path $render)) {
  throw "Render CLI missing at $render"
}

if (-not $ServiceId) {
  throw @"
RENDER_SERVICE_ID is not set.

Render Dashboard: Web Service (e.g. ksohtc-platform) - Settings - copy Service ID (srv-...).

PowerShell:
  `$env:RENDER_SERVICE_ID = 'srv-xxxxxxxxxxxx'
  pnpm deploy:render
"@
}

Write-Host "Triggering deploy for service $ServiceId ..."
& $render deploys create $ServiceId --confirm --wait -o text
