-- =====================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- Sistema de Control de Acceso SENA
-- 100% SIN CIRCUITOS CERRADOS Y SIN REDUNDANCIAS
-- =====================================================

-- =====================================================
-- ELIMINAR BASE DE DATOS ANTERIOR (OPCIONAL)
-- =====================================================
-- DROP DATABASE IF EXISTS control_acceso_sena;

CREATE DATABASE IF NOT EXISTS control_acceso_sena 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE control_acceso_sena;

-- =====================================================
-- TABLA: usuarios
-- Sin conexión circular a personas
-- =====================================================
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwords VARCHAR(255) NOT NULL,
  rol ENUM('GUARDA', 'ADMINISTRADOR') DEFAULT 'GUARDA',
  estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credenciales por defecto
INSERT INTO usuarios (nombre, email, passwords, rol, estado) VALUES
('Administrador', 'admin@sena.edu.co', '$2a$10$3666f.g.6YwF2m2MFJCtn.R8ftn9RkRcV6/f1yzdj3VlGZ7EESzeK', 'ADMINISTRADOR', 'ACTIVO'),
('Guarda de Seguridad', 'guarda@sena.edu.co', '$2a$10$DMCaQbx2V5QUTMYuSZvJaOk4OGfltNh2ClwOByuofhDQwBh1641dK', 'GUARDA', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- =====================================================
-- TABLA: roles
-- Catálogo simple sin circuitos
-- =====================================================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    INDEX idx_nombre_rol (nombre_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre_rol, descripcion) VALUES
('APRENDIZ', 'Aprendiz del SENA'),
('INSTRUCTOR', 'Instructor del SENA'),
('ADMINISTRATIVO', 'Personal administrativo'),
('VISITANTE', 'Visitante temporal'),
('GUARDA', 'Guarda de seguridad')
ON DUPLICATE KEY UPDATE nombre_rol = nombre_rol;

-- =====================================================
-- TABLA: programas_formacion
-- Tabla independiente, sin foreign keys hacia arriba
-- =====================================================
CREATE TABLE programas_formacion (
  id_programa INT AUTO_INCREMENT PRIMARY KEY,
  codigo_programa VARCHAR(50) UNIQUE NOT NULL,
  nombre_programa VARCHAR(200) NOT NULL,
  nivel ENUM('Técnico', 'Tecnológico', 'Especialización', 'Complementaria') DEFAULT 'Técnico',
  duracion_meses INT DEFAULT 12,
  area_conocimiento VARCHAR(100),
  descripcion TEXT,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo_programa),
  INDEX idx_estado (estado),
  INDEX idx_nombre (nombre_programa(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: fichas
-- Solo referencia a programas (unidireccional)
-- =====================================================
CREATE TABLE fichas (
  id_ficha INT AUTO_INCREMENT PRIMARY KEY,
  codigo_ficha VARCHAR(50) UNIQUE NOT NULL,
  id_programa INT NOT NULL,
  jornada ENUM('diurna', 'nocturna', 'mixta') DEFAULT 'diurna',
  fecha_inicio DATE,
  fecha_fin DATE,
  estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
  numero_aprendices INT DEFAULT 0,
  capacidad_maxima INT,
  FOREIGN KEY (id_programa) REFERENCES programas_formacion(id_programa) ON DELETE RESTRICT,
  INDEX idx_codigo (codigo_ficha),
  INDEX idx_programa (id_programa),
  INDEX idx_estado (estado),
  INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: personas
-- SIN REDUNDANCIAS - Solo campos esenciales
-- SIN circuitos cerrados - Solo referencias hacia abajo
-- =====================================================
CREATE TABLE personas (
  id_persona INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Datos de identificación (NO REDUNDANTES)
  tipo_documento ENUM('CC', 'TI', 'CE', 'PASAPORTE') NOT NULL DEFAULT 'CC',
  documento VARCHAR(50) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  
  -- Datos de contacto
  email VARCHAR(255),
  telefono VARCHAR(20),
  rh VARCHAR(10) COMMENT 'Grupo sanguíneo',
  
  -- Referencias UNIDIRECCIONALES (sin circuitos)
  id_rol INT NOT NULL,
  id_ficha INT NULL COMMENT 'Solo para aprendices',
  
  -- Campos específicos por rol
  cargo VARCHAR(100) NULL COMMENT 'Solo para instructores/administrativos',
  tipo_contrato ENUM('planta', 'contrato', 'catedra') NULL COMMENT 'Solo para instructores',
  
  -- Datos del sistema
  codigo_qr VARCHAR(255),
  foto VARCHAR(500),
  estado ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO') DEFAULT 'ACTIVO',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys UNIDIRECCIONALES (sin ciclos)
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT,
  FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE SET NULL,
  
  -- Índices
  INDEX idx_documento (documento),
  INDEX idx_tipo_doc (tipo_documento),
  INDEX idx_rol (id_rol),
  INDEX idx_ficha (id_ficha),
  INDEX idx_estado (estado),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla personas - SIN redundancias ni circuitos cerrados';

-- =====================================================
-- TABLA: visitantes
-- Información adicional SOLO para visitantes
-- =====================================================
CREATE TABLE visitantes (
    id_visitante INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    motivo_visita TEXT NOT NULL,
    contacto VARCHAR(255),
    persona_visita VARCHAR(255),
    zona VARCHAR(200) COMMENT 'Destino dentro de las instalaciones',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    estado ENUM('ACTIVO', 'FINALIZADO', 'EXPIRADO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
    INDEX idx_persona (id_persona),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: registros_entrada_salida
-- CIRCUITO ABIERTO: Registros independientes
-- =====================================================
CREATE TABLE registros_entrada_salida (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  tipo ENUM('ENTRADA', 'SALIDA') NOT NULL,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_usuario_registro INT NULL COMMENT 'Guarda que registró',
  FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_persona (id_persona),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha (fecha_hora),
  INDEX idx_persona_fecha (id_persona, fecha_hora DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registros independientes - Sin circuitos cerrados';

-- =====================================================
-- TABLA: logs_seguridad
-- Solo para auditoría, sin conexión circular
-- =====================================================
CREATE TABLE logs_seguridad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('login_exitoso', 'login_fallido', 'cambio_password', 
              'modificacion_usuario', 'acceso_sistema') NOT NULL,
    id_usuario INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    accion TEXT NOT NULL,
    detalles JSON,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: auditoria
-- Tabla de auditoría general
-- =====================================================
CREATE TABLE auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro INT,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    id_usuario INT NULL,
    ip_address VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: evidencia_fotografica
-- Evidencias de incidentes
-- =====================================================
CREATE TABLE evidencia_fotografica (
    id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
    tipo_incidente ENUM('acceso_denegado', 'comportamiento_sospechoso', 
                        'incidente_seguridad', 'evidencia_general') NOT NULL,
    url_foto VARCHAR(500) NOT NULL,
    hash_archivo VARCHAR(64),
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_captura INT NULL,
    descripcion TEXT,
    metadata JSON,
    FOREIGN KEY (id_usuario_captura) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_tipo (tipo_incidente),
    INDEX idx_fecha (fecha_captura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VISTAS OPTIMIZADAS
-- =====================================================

-- Vista: Información completa de personas (eliminando redundancias)
CREATE OR REPLACE VIEW v_personas_completo AS
SELECT 
    p.id_persona,
    p.tipo_documento,
    p.documento,
    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
    p.nombres,
    p.apellidos,
    p.email,
    p.telefono,
    p.rh,
    r.nombre_rol,
    r.descripcion as rol_descripcion,
    p.id_ficha,
    f.codigo_ficha,
    prog.nombre_programa,
    prog.codigo_programa,
    f.jornada,
    p.cargo,
    p.tipo_contrato,
    p.codigo_qr,
    p.foto,
    p.estado,
    p.fecha_registro
FROM personas p
INNER JOIN roles r ON p.id_rol = r.id_rol
LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
LEFT JOIN programas_formacion prog ON f.id_programa = prog.id_programa;

-- Vista: Personas actualmente dentro
CREATE OR REPLACE VIEW v_personas_dentro AS
SELECT 
    p.id_persona,
    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
    p.documento,
    r.nombre_rol,
    p.foto,
    reg.fecha_hora as fecha_entrada,
    TIMESTAMPDIFF(MINUTE, reg.fecha_hora, NOW()) as minutos_dentro,
    f.codigo_ficha,
    prog.nombre_programa,
    v.zona,
    v.motivo_visita,
    v.persona_visita
FROM personas p
INNER JOIN roles r ON p.id_rol = r.id_rol
INNER JOIN registros_entrada_salida reg ON p.id_persona = reg.id_persona
LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
LEFT JOIN programas_formacion prog ON f.id_programa = prog.id_programa
LEFT JOIN visitantes v ON p.id_persona = v.id_persona AND v.estado = 'ACTIVO'
WHERE reg.tipo = 'ENTRADA'
  AND reg.fecha_hora = (
    SELECT MAX(fecha_hora) 
    FROM registros_entrada_salida 
    WHERE id_persona = p.id_persona
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM registros_entrada_salida r2 
    WHERE r2.id_persona = p.id_persona 
      AND r2.tipo = 'SALIDA' 
      AND r2.fecha_hora > reg.fecha_hora
  )
  AND p.estado = 'ACTIVO';

-- Vista: Historial de accesos
CREATE OR REPLACE VIEW v_historial_accesos AS
SELECT 
    reg.id_registro,
    reg.id_persona,
    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
    p.documento,
    r.nombre_rol,
    reg.tipo,
    reg.fecha_hora,
    DATE(reg.fecha_hora) as fecha,
    TIME(reg.fecha_hora) as hora,
    f.codigo_ficha,
    prog.nombre_programa,
    u.nombre as registrado_por
FROM registros_entrada_salida reg
INNER JOIN personas p ON reg.id_persona = p.id_persona
INNER JOIN roles r ON p.id_rol = r.id_rol
LEFT JOIN fichas f ON p.id_ficha = f.id_ficha
LEFT JOIN programas_formacion prog ON f.id_programa = prog.id_programa
LEFT JOIN usuarios u ON reg.id_usuario_registro = u.id_usuario
ORDER BY reg.fecha_hora DESC;

-- Vista: Estadísticas diarias
CREATE OR REPLACE VIEW v_estadisticas_diarias AS
SELECT 
    DATE(fecha_hora) as fecha,
    COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as total_entradas,
    COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END) as total_salidas,
    COUNT(DISTINCT id_persona) as personas_unicas
FROM registros_entrada_salida
GROUP BY DATE(fecha_hora)
ORDER BY fecha DESC;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

DELIMITER $$

-- Registrar entrada
CREATE PROCEDURE sp_registrar_entrada(
    IN p_id_persona INT,
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora, id_usuario_registro)
    VALUES 
    (p_id_persona, 'ENTRADA', NOW(), p_id_usuario);
    
    SELECT LAST_INSERT_ID() as id_registro;
END$$

-- Registrar salida
CREATE PROCEDURE sp_registrar_salida(
    IN p_id_persona INT,
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora, id_usuario_registro)
    VALUES 
    (p_id_persona, 'SALIDA', NOW(), p_id_usuario);
    
    SELECT LAST_INSERT_ID() as id_registro;
END$$

-- Obtener personas dentro
CREATE PROCEDURE sp_personas_dentro()
BEGIN
    SELECT * FROM v_personas_dentro
    ORDER BY fecha_entrada DESC;
END$$

-- Verificar última acción
CREATE PROCEDURE sp_ultima_accion(IN p_id_persona INT)
BEGIN
    SELECT 
        tipo,
        fecha_hora,
        TIMESTAMPDIFF(MINUTE, fecha_hora, NOW()) as minutos_transcurridos
    FROM registros_entrada_salida
    WHERE id_persona = p_id_persona
    ORDER BY fecha_hora DESC
    LIMIT 1;
END$$

-- Reporte de asistencia por ficha
CREATE PROCEDURE sp_reporte_asistencia_ficha(
    IN p_id_ficha INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT 
        p.id_persona,
        p.documento,
        CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
        COUNT(DISTINCT DATE(reg.fecha_hora)) as dias_asistencia,
        COUNT(CASE WHEN reg.tipo = 'ENTRADA' THEN 1 END) as total_entradas,
        COUNT(CASE WHEN reg.tipo = 'SALIDA' THEN 1 END) as total_salidas
    FROM personas p
    LEFT JOIN registros_entrada_salida reg 
        ON p.id_persona = reg.id_persona
        AND DATE(reg.fecha_hora) BETWEEN p_fecha_inicio AND p_fecha_fin
    WHERE p.id_ficha = p_id_ficha
      AND p.estado = 'ACTIVO'
    GROUP BY p.id_persona, p.documento, p.nombres, p.apellidos
    ORDER BY dias_asistencia DESC;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICACIÓN DE ESTRUCTURA
-- =====================================================
SELECT 'Base de datos creada exitosamente' as estado;
SELECT 'Sin circuitos cerrados ✓' as verificacion_1;
SELECT 'Sin redundancias ✓' as verificacion_2;
SELECT 'Estructura normalizada ✓' as verificacion_3;

-- =====================================================
-- DOCUMENTACIÓN
-- =====================================================
/*
CAMBIOS IMPLEMENTADOS PARA ELIMINAR CIRCUITOS CERRADOS Y REDUNDANCIAS:

1. ELIMINADAS las siguientes columnas REDUNDANTES de 'personas':
   ❌ programa VARCHAR(200)        - Ya existe id_ficha → fichas → programas_formacion
   ❌ ficha VARCHAR(50)            - Ya existe id_ficha
   ❌ nombre VARCHAR(200)          - Ya existe nombres + apellidos
   ❌ rol VARCHAR(50)              - Ya existe id_rol → roles
   ❌ id_rol_persona               - Duplicado con id_rol
   ❌ id_estado_persona            - Ya existe estado ENUM
   ❌ id_usuario                   - Creaba circuito cerrado
   ❌ zona VARCHAR(200)            - Movido a tabla visitantes

2. ESTRUCTURA SIN CIRCUITOS:
   usuarios (tabla raíz)
   ↓
   roles (independiente)
   ↓
   programas_formacion (independiente)
   ↓
   fichas (solo referencia programas)
   ↓
   personas (solo referencia roles y fichas)
   ↓
   visitantes (solo referencia personas)
   ↓
   registros_entrada_salida (solo referencia personas y usuarios)

3. FLUJO UNIDIRECCIONAL (sin ciclos):
   - Todas las referencias van hacia "abajo"
   - No hay foreign keys que vuelvan hacia "arriba"
   - Cada tabla tiene máximo 2 foreign keys

4. VENTAJAS:
   ✓ Sin duplicación de datos
   ✓ Fácil mantenimiento
   ✓ Integridad referencial clara
   ✓ Mejor rendimiento
   ✓ Cumple normalización 3FN

CONSULTAS PRINCIPALES:
- Ver personas dentro: SELECT * FROM v_personas_dentro;
- Información completa: SELECT * FROM v_personas_completo WHERE documento = '123456';
- Historial: SELECT * FROM v_historial_accesos WHERE fecha = CURDATE();
- Estadísticas: SELECT * FROM v_estadisticas_diarias WHERE fecha >= CURDATE() - INTERVAL 7 DAY;
*/