-- =====================================================
-- CREAR TABLAS DE CATÁLOGO - CIRCUITO ABIERTO
-- Programas_Formacion y Fichas
-- =====================================================

-- =====================================================
-- ELIMINAR FOREIGN KEYS RESTRICTIVAS SI EXISTEN
-- =====================================================

-- Eliminar foreign key de Personas a Programas_Formacion si existe
SET @fk_name = (SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'Personas' 
                  AND COLUMN_NAME = 'id_programa' 
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);
SET @sql = IF(@fk_name IS NOT NULL, 
              CONCAT('ALTER TABLE Personas DROP FOREIGN KEY ', @fk_name), 
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar foreign key de Personas a Fichas si existe
SET @fk_name = (SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'Personas' 
                  AND COLUMN_NAME = 'id_ficha' 
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);
SET @sql = IF(@fk_name IS NOT NULL, 
              CONCAT('ALTER TABLE Personas DROP FOREIGN KEY ', @fk_name), 
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar foreign key de Fichas a Programas_Formacion si existe
SET @fk_name = (SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'Fichas' 
                  AND COLUMN_NAME = 'id_programa' 
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);
SET @sql = IF(@fk_name IS NOT NULL, 
              CONCAT('ALTER TABLE Fichas DROP FOREIGN KEY ', @fk_name), 
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- CREAR TABLA: Programas_Formacion
-- CIRCUITO ABIERTO: SIN FOREIGN KEYS RESTRICTIVAS
-- =====================================================

DROP TABLE IF EXISTS Programas_Formacion;

CREATE TABLE Programas_Formacion (
  id_programa INT AUTO_INCREMENT PRIMARY KEY,
  codigo_programa VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código único del programa (ej: TEC-PS-001)',
  nombre_programa VARCHAR(200) NOT NULL COMMENT 'Nombre completo del programa de formación',
  nivel ENUM('Técnico', 'Tecnológico', 'Especialización', 'Formación Complementaria') DEFAULT 'Técnico' COMMENT 'Nivel de formación',
  duracion_meses INT DEFAULT 12 COMMENT 'Duración del programa en meses',
  area_conocimiento VARCHAR(100) NULL COMMENT 'Área de conocimiento o especialidad',
  descripcion TEXT NULL COMMENT 'Descripción detallada del programa',
  estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo' COMMENT 'Estado del programa',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  
  -- Índices para optimización (SIN FOREIGN KEYS para circuito abierto)
  INDEX idx_codigo_programa (codigo_programa),
  INDEX idx_nivel (nivel),
  INDEX idx_area_conocimiento (area_conocimiento),
  INDEX idx_estado (estado),
  INDEX idx_nombre_programa (nombre_programa(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de programas de formación del SENA - Circuito Abierto';

-- =====================================================
-- CREAR TABLA: Fichas
-- CIRCUITO ABIERTO: SIN FOREIGN KEYS RESTRICTIVAS
-- =====================================================

-- Eliminar tabla duplicada si existe
DROP TABLE IF EXISTS fichas;

DROP TABLE IF EXISTS Fichas;

CREATE TABLE Fichas (
  id_ficha INT AUTO_INCREMENT PRIMARY KEY,
  codigo_ficha VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código único de la ficha (ej: 3066232)',
  programa_formacion VARCHAR(200) NOT NULL COMMENT 'Nombre del programa de formación',
  id_programa INT NULL COMMENT 'Referencia al programa de formación (opcional, para relación flexible)',
  id_ambiente_principal INT NULL COMMENT 'Ambiente principal asignado a la ficha (opcional)',
  jornada ENUM('diurna', 'nocturna', 'mixta') DEFAULT 'diurna' COMMENT 'Jornada de formación',
  fecha_inicio DATE NULL COMMENT 'Fecha de inicio de la ficha',
  fecha_fin DATE NULL COMMENT 'Fecha de finalización de la ficha',
  estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa' COMMENT 'Estado actual de la ficha',
  numero_aprendices INT DEFAULT 0 COMMENT 'Número de aprendices asignados',
  capacidad_maxima INT NULL COMMENT 'Capacidad máxima de aprendices',
  observaciones TEXT NULL COMMENT 'Observaciones adicionales',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  
  -- Índices para optimización (SIN FOREIGN KEYS para circuito abierto)
  INDEX idx_ficha_codigo (codigo_ficha),
  INDEX idx_ficha_programa (id_programa),
  INDEX idx_ficha_estado (estado),
  INDEX idx_ficha_jornada (jornada),
  INDEX idx_ficha_fechas (fecha_inicio, fecha_fin),
  INDEX idx_ficha_ambiente (id_ambiente_principal),
  INDEX idx_programa_formacion (programa_formacion(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para gestionar las fichas de formación del SENA - Circuito Abierto';

-- =====================================================
-- AGREGAR FOREIGN KEYS (CIRCUITO ABIERTO - ON DELETE SET NULL)
-- Todas las tablas quedan enlazadas pero con flexibilidad
-- =====================================================

-- Agregar foreign key: Personas.id_programa → Programas_Formacion.id_programa
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'Personas' 
                    AND COLUMN_NAME = 'id_programa' 
                    AND REFERENCED_TABLE_NAME = 'Programas_Formacion'
                  LIMIT 1);
SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE Personas ADD CONSTRAINT fk_personas_programa FOREIGN KEY (id_programa) REFERENCES Programas_Formacion(id_programa) ON DELETE SET NULL',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key: Personas.id_ficha → Fichas.id_ficha
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'Personas' 
                    AND COLUMN_NAME = 'id_ficha' 
                    AND REFERENCED_TABLE_NAME = 'Fichas'
                  LIMIT 1);
SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE Personas ADD CONSTRAINT fk_personas_ficha FOREIGN KEY (id_ficha) REFERENCES Fichas(id_ficha) ON DELETE SET NULL',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key: Fichas.id_programa → Programas_Formacion.id_programa
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'Fichas' 
                    AND COLUMN_NAME = 'id_programa' 
                    AND REFERENCED_TABLE_NAME = 'Programas_Formacion'
                  LIMIT 1);
SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE Fichas ADD CONSTRAINT fk_fichas_programa FOREIGN KEY (id_programa) REFERENCES Programas_Formacion(id_programa) ON DELETE SET NULL',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key: Fichas.id_ambiente_principal → Ambientes.id_ambiente (si existe la tabla Ambientes)
SET @ambientes_exists = (SELECT COUNT(*) 
                         FROM INFORMATION_SCHEMA.TABLES 
                         WHERE TABLE_SCHEMA = DATABASE() 
                           AND TABLE_NAME = 'Ambientes');
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'Fichas' 
                    AND COLUMN_NAME = 'id_ambiente_principal' 
                    AND REFERENCED_TABLE_NAME = 'Ambientes'
                  LIMIT 1);
SET @sql = IF(@ambientes_exists > 0 AND @fk_exists = 0,
              'ALTER TABLE Fichas ADD CONSTRAINT fk_fichas_ambiente FOREIGN KEY (id_ambiente_principal) REFERENCES Ambientes(id_ambiente) ON DELETE SET NULL',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VERIFICAR CREACIÓN DE TABLAS Y RELACIONES
-- =====================================================

SELECT 
  TABLE_NAME as 'Tabla',
  TABLE_COMMENT as 'Descripción'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('Programas_Formacion', 'Fichas')
ORDER BY TABLE_NAME;

-- Mostrar foreign keys creadas
SELECT 
  TABLE_NAME as 'Tabla',
  CONSTRAINT_NAME as 'Foreign Key',
  COLUMN_NAME as 'Columna',
  REFERENCED_TABLE_NAME as 'Tabla Referenciada',
  REFERENCED_COLUMN_NAME as 'Columna Referenciada',
  DELETE_RULE as 'Regla de Eliminación'
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r 
  ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME 
  AND k.TABLE_SCHEMA = r.CONSTRAINT_SCHEMA
WHERE k.TABLE_SCHEMA = DATABASE()
  AND k.REFERENCED_TABLE_NAME IS NOT NULL
  AND (
    k.TABLE_NAME = 'Fichas' 
    OR (k.TABLE_NAME = 'Personas' AND k.COLUMN_NAME IN ('id_programa', 'id_ficha'))
  )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- =====================================================
-- NOTAS IMPORTANTES - CIRCUITO ABIERTO ENLAZADO
-- =====================================================
-- ✅ Todas las tablas están ENLAZADAS con FOREIGN KEYS
-- ✅ Usa ON DELETE SET NULL para mantener flexibilidad (circuito abierto)
-- ✅ Si eliminas un programa, las fichas y personas mantienen su registro (id_programa se pone NULL)
-- ✅ Si eliminas una ficha, las personas mantienen su registro (id_ficha se pone NULL)
-- ✅ Las relaciones están definidas a nivel de base de datos para integridad
-- ✅ Puedes crear registros sin requerir que exista la referencia (id_programa/id_ficha pueden ser NULL)
-- =====================================================

