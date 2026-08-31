# build.ps1 - rebuild the balance plugin in the DSH checkout and sync this dir.
#
# Usage: run  .\build.ps1  from this directory.
#   1) Rebuilds ONLY this plugin package in the DSH checkout (tsc -b + tsdown, seconds).
#   2) Syncs the build artifacts (lib/) and metadata back into this directory.
#   3) Restart the GUI to load the new artifacts (browser-half changes hot-reload
#      while a dev:web HMR watcher is running).
#
# Edit point: source lives in the DSH checkout at
# packages/extensions/deepseek-balance/src. This directory stays the published
# plugin that the web profile imports via dsh.profile.bundles (see
# $HOME/.dsh/profiles/web/package.json). Rebuilding DSH itself is never needed.

param(
  [string]$Repo = "D:\DSH\Raw\deepseek-harness",
  [switch]$SkipSync
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pkgDir = Join-Path $Repo "packages\extensions\deepseek-balance"

if (-not (Test-Path (Join-Path $pkgDir "package.json"))) {
  throw "plugin package not found at $pkgDir - check the DSH checkout path (-Repo)"
}

Write-Host "==> Building plugin package ($pkgDir)"
Push-Location $Repo
try {
  pnpm --filter @deepseek-ai/dsh-deepseek-balance exec tsc -b tsconfig.json
  if ($LASTEXITCODE -ne 0) { throw "tsc failed (exit $LASTEXITCODE)" }
  pnpm --filter @deepseek-ai/dsh-deepseek-balance exec tsdown
  if ($LASTEXITCODE -ne 0) { throw "tsdown failed (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}

if (-not $SkipSync) {
  Write-Host "==> Syncing artifacts into $here"
  robocopy $pkgDir $here /E /XD node_modules /XF *.tsbuildinfo /NFL /NDL /NJH /NJS | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit $LASTEXITCODE)" }
}

Write-Host ""
Write-Host "Done. Plugin artifacts updated:"
Write-Host "  $here\lib\index.js   (host half)"
Write-Host "  $here\lib\client.js  (browser half)"
Write-Host "Restart the GUI (or refresh under a dev:web HMR watcher) to load them."
