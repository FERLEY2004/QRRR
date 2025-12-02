@echo off
echo ========================================
echo Deteniendo procesos Node en puerto 4000
echo ========================================
echo.

echo Buscando procesos usando el puerto 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Deteniendo proceso PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo   No se pudo detener proceso %%a
    ) else (
        echo   Proceso %%a detenido exitosamente
    )
)

echo.
echo Deteniendo todos los procesos Node...
taskkill /IM node.exe /F >nul 2>&1
if errorlevel 1 (
    echo   No se encontraron procesos Node corriendo
) else (
    echo   Todos los procesos Node fueron detenidos
)

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Verificando puerto 4000...
netstat -ano | findstr :4000
if errorlevel 1 (
    echo   Puerto 4000 esta libre
) else (
    echo   ADVERTENCIA: El puerto 4000 todavia esta en uso
)

echo.
echo ========================================
echo Ahora puedes iniciar el servidor con: npm run dev
echo ========================================
pause



