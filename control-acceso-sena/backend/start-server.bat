@echo off
echo ========================================
echo Iniciando Servidor Backend SENA
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "src\app.js" (
    echo Error: No se encuentra src\app.js
    echo Asegurate de ejecutar este script desde el directorio backend
    pause
    exit /b 1
)

REM Verificar si existe .env
if not exist ".env" (
    echo.
    echo ADVERTENCIA: No se encontro archivo .env
    echo Creando archivo .env de ejemplo...
    echo.
    echo PORT=5000 > .env
    echo DB_HOST=localhost >> .env
    echo DB_USER=root >> .env
    echo DB_PASSWORD= >> .env
    echo DB_NAME=control_acceso_sena >> .env
    echo DB_PORT=3306 >> .env
    echo JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion >> .env
    echo.
    echo Archivo .env creado. Por favor editalo con tus credenciales de base de datos.
    echo.
    pause
)

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo.
    echo Instalando dependencias...
    call npm install
    echo.
)

echo.
echo Iniciando servidor en modo desarrollo...
echo Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

call npm run dev










