# Script PowerShell para iniciar el servidor backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Servidor Backend SENA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "src\app.js")) {
    Write-Host "Error: No se encuentra src\app.js" -ForegroundColor Red
    Write-Host "Asegurate de ejecutar este script desde el directorio backend" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si existe .env
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "ADVERTENCIA: No se encontro archivo .env" -ForegroundColor Yellow
    Write-Host "Creando archivo .env de ejemplo..." -ForegroundColor Yellow
    Write-Host ""
    
    @"
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=control_acceso_sena
DB_PORT=3306
JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "Archivo .env creado. Por favor editalo con tus credenciales de base de datos." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para continuar"
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Leer el puerto del .env
$port = 4000
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "PORT=(\d+)") {
        $port = [int]$matches[1]
    }
}

# Verificar y cerrar procesos usando el puerto
Write-Host ""
Write-Host "Verificando puerto $port..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Encontrados procesos usando el puerto $port. Cerrandolos..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Proceso $pid cerrado" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ No se pudo cerrar proceso $pid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
}

# Cerrar todos los procesos Node por si acaso
Write-Host "Cerrando procesos Node existentes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Iniciando servidor en modo desarrollo..." -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev



