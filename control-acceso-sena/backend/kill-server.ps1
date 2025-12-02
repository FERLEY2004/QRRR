# Script para detener todos los procesos Node que usan el puerto 4000
Write-Host "Buscando procesos usando el puerto 4000..." -ForegroundColor Yellow

$processes = netstat -ano | findstr :4000

if ($processes) {
    Write-Host "Procesos encontrados:" -ForegroundColor Cyan
    $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            Write-Host "  PID: $pid" -ForegroundColor Gray
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✓ Proceso $pid detenido" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ No se pudo detener proceso $pid" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "No se encontraron procesos usando el puerto 4000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deteniendo todos los procesos Node..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Proceso Node (PID: $($_.Id)) detenido" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ No se pudo detener proceso Node (PID: $($_.Id))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Esperando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Verificando puerto 4000..." -ForegroundColor Cyan
$check = netstat -ano | findstr :4000
if ($check) {
    Write-Host "⚠️  El puerto 4000 todavía está en uso" -ForegroundColor Yellow
    Write-Host $check
} else {
    Write-Host "✅ El puerto 4000 está libre" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ahora puedes iniciar el servidor con: npm run dev" -ForegroundColor Cyan



