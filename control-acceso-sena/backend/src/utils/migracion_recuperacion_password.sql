-- =====================================================
-- MIGRACIÓN: Agregar columnas para recuperación de contraseña
-- Ejecutar este script en MySQL para habilitar la funcionalidad
-- =====================================================

USE control_acceso_sena;

-- Agregar columna para el token de recuperación
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64) NULL;

-- Agregar columna para la expiración del token
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL;

-- Agregar índice para búsqueda rápida por token
-- (Ignorar error si ya existe)
CREATE INDEX idx_reset_token ON usuarios(reset_token);

-- Verificar que las columnas se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'control_acceso_sena' 
AND TABLE_NAME = 'usuarios' 
AND COLUMN_NAME IN ('reset_token', 'reset_token_expires');

-- Mensaje de confirmación
SELECT '✅ Migración completada: Columnas de recuperación de contraseña agregadas' AS resultado;

