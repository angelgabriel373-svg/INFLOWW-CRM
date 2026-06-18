# Copia el bloqueo (user.css + user.js) a TODOS los servicios de Ferdium.
# Ejecutar DESPUES de crear los servicios de Marta y Mara en Ferdium.
$ErrorActionPreference = "Stop"
$src = $PSScriptRoot
$svcDir = Join-Path $env:APPDATA "Ferdium\services"

if (-not (Test-Path $svcDir)) {
  Write-Host "No hay servicios en Ferdium todavia. Crea Marta y Mara primero." -ForegroundColor Yellow
  exit 1
}

$servicios = Get-ChildItem $svcDir -Directory
if ($servicios.Count -eq 0) { Write-Host "No hay servicios. Crea Marta y Mara primero." -ForegroundColor Yellow; exit 1 }

foreach ($s in $servicios) {
  Copy-Item (Join-Path $src "user.css") (Join-Path $s.FullName "user.css") -Force
  Copy-Item (Join-Path $src "user.js")  (Join-Path $s.FullName "user.js")  -Force
  Write-Host "Bloqueo aplicado a: $($s.Name)" -ForegroundColor Green
}
Write-Host "`nListo. Reinicia Ferdium (o recarga el servicio con Ctrl+R) para que surta efecto." -ForegroundColor Cyan
