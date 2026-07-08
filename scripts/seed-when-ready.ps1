# Waits for Neon DATABASE_URL in backend/.env, then seeds production database.
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
$backendDir = Join-Path $PSScriptRoot "..\backend"

Write-Host "Waiting for Neon DATABASE_URL in backend/.env ..."
Write-Host "1. Render -> erp-api-gk6o -> Environment -> copy DATABASE_URL"
Write-Host "2. Paste into backend/.env (replace localhost line) and SAVE"
Write-Host ""

for ($i = 1; $i -le 120; $i++) {
  if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'neon\.tech') {
      Write-Host "Neon URL detected. Running seed..."
      Push-Location $backendDir
      npm run db:seed
      $code = $LASTEXITCODE
      Pop-Location
      exit $code
    }
  }
  Start-Sleep -Seconds 2
}

Write-Host "Timed out. Update backend/.env with Neon DATABASE_URL and run: npm run db:seed"
exit 1
