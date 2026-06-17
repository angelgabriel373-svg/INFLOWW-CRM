# Configuracion inicial en Windows (PowerShell)
# Uso:  ./setup.ps1
Write-Host "==> Instalando dependencias (raiz, server, client)..." -ForegroundColor Cyan
npm install
npm --prefix server install
npm --prefix client install

Write-Host "==> Preparando la base de datos (genera, push, seed)..." -ForegroundColor Cyan
if (-not (Test-Path "server/.env")) {
  Copy-Item "server/.env.example" "server/.env"
  Write-Host "    Creado server/.env desde el ejemplo." -ForegroundColor Yellow
}
npm --prefix server run db:setup

Write-Host ""
Write-Host "Listo. Arranca el proyecto con:  npm run dev" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173   |   API: http://localhost:4000" -ForegroundColor Green
