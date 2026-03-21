# Downloads Render CLI (Windows amd64) into tools/render/render.exe (gitignored).
# Docs: https://render.com/docs/cli
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $repoRoot "tools\render"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$version = "v2.14.0"
$zipName = "cli_2.14.0_windows_amd64.zip"
$url = "https://github.com/render-oss/cli/releases/download/$version/$zipName"
$zip = Join-Path $env:TEMP "render-cli-$version.zip"

Write-Host "Downloading Render CLI $version..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath $dir -Force
Remove-Item $zip -Force -ErrorAction SilentlyContinue

$exe = Get-ChildItem $dir -Filter "cli_v*.exe" | Select-Object -First 1
if (-not $exe) {
  throw "Expected cli_v*.exe in $dir after extract"
}
$target = Join-Path $dir "render.exe"
Copy-Item $exe.FullName $target -Force
Write-Host "Installed: $target"
Write-Host "Next: render login (once), then set RENDER_SERVICE_ID and run pnpm deploy:render"
