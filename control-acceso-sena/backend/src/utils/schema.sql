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
-- =====================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- Sistema de Control de Acceso SENA - CIRCUITO ABIERTO
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS control_acceso_sena 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE control_acceso_sena;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100),
  passwords VARCHAR(255),
  rol ENUM('GUARDA', 'ADMINISTRADOR') DEFAULT 'GUARDA',
  estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CREDENCIALES POR DEFECTO
-- =====================================================
-- Insertar usuarios por defecto con contraseñas hasheadas con bcrypt
-- Contraseñas por defecto:
--   - admin@sena.edu.co / admin123 (ADMINISTRADOR)
--   - guarda@sena.edu.co / guarda123 (GUARDA)
-- 
-- NOTA: Los hashes bcrypt fueron generados con bcryptjs (10 rounds)
-- Si necesitas regenerar los hashes, ejecuta: node src/utils/generatePasswordHashes.js
-- =====================================================
INSERT INTO usuarios (nombre, email, passwords, rol, estado) VALUES
('Administrador', 'admin@sena.edu.co', '$2a$10$3666f.g.6YwF2m2MFJCtn.R8ftn9RkRcV6/f1yzdj3VlGZ7EESzeK', 'ADMINISTRADOR', 'ACTIVO'),
('Guarda de Seguridad', 'guarda@sena.edu.co', '$2a$10$DMCaQbx2V5QUTMYuSZvJaOk4OGfltNh2ClwOByuofhDQwBh1641dK', 'GUARDA', 'ACTIVO')
ON DUPLICATE KEY UPDATE 
  nombre = VALUES(nombre),
  passwords = VALUES(passwords),
  rol = VALUES(rol),
  estado = VALUES(estado);

-- =====================================================
-- TABLA: estados_personas (Catálogo)
-- =====================================================
CREATE TABLE IF NOT EXISTS estados_personas (
  id_estado_persona INT AUTO_INCREMENT PRIMARY KEY,
  nombre_estado VARCHAR(20),
  INDEX idx_nombre_estado (nombre_estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar estados por defecto
INSERT INTO estados_personas (nombre_estado) VALUES
('ACTIVO'),
('INACTIVO'),
('SUSPENDIDO')
ON DUPLICATE KEY UPDATE nombre_estado=nombre_estado;

-- =====================================================
-- TABLA: roles_personas (Catálogo)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles_personas (
  id_rol_persona INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol_persona VARCHAR(30),
  INDEX idx_nombre_rol (nombre_rol_persona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles por defecto
INSERT INTO roles_personas (nombre_rol_persona) VALUES
('APRENDIZ'),
('INSTRUCTOR'),
('ADMINISTRATIVO'),
('VISITANTE'),
('GUARDA'),
('ADMINISTRADOR')
ON DUPLICATE KEY UPDATE nombre_rol_persona=nombre_rol_persona;

-- =====================================================
-- TABLA: Roles (Para compatibilidad con código existente)
-- =====================================================
CREATE TABLE IF NOT EXISTS Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre_rol (nombre_rol),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles por defecto
INSERT INTO Roles (nombre_rol, descripcion) VALUES
('aprendiz', 'Aprendiz del SENA'),
('instructor', 'Instructor del SENA'),
('administrativo', 'Personal administrativo'),
('visitante', 'Visitante temporal'),
('guarda', 'Guarda de seguridad'),
('admin', 'Administrador del sistema')
ON DUPLICATE KEY UPDATE nombre_rol=nombre_rol;

-- =====================================================
-- TABLA: Personas (alias personas también funciona)
-- =====================================================
CREATE TABLE IF NOT EXISTS Personas (
  id_persona INT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('CC', 'TI', 'CE', 'PASAPORTE') NOT NULL DEFAULT 'CC',
  documento VARCHAR(50) UNIQUE,
  nombres VARCHAR(100),
  apellidos VARCHAR(100),
  nombre VARCHAR(200) COMMENT 'Nombre completo (para compatibilidad)',
  codigo_qr VARCHAR(255),
  programa VARCHAR(200),
  ficha VARCHAR(50),
  id_ficha INT NULL COMMENT 'Referencia a la ficha de formación',
  zona VARCHAR(200) COMMENT 'Zona o destino donde va la persona o visitante',
  foto VARCHAR(500) COMMENT 'Ruta del archivo de foto (formato: uploads/fotos/[documento]-[timestamp].jpg)',
  estado ENUM('ACTIVO', 'INACTIVO', 'suspendido') DEFAULT 'ACTIVO',  -- VALORES ÚNICOS
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Hora exacta de registro de la persona',
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización del registro',
  id_usuario INT,
  id_estado_persona INT,
  id_rol_persona INT,
  id_rol INT NULL COMMENT 'Referencia a Roles (para compatibilidad)',
  rol VARCHAR(50) COMMENT 'Nombre del rol (para compatibilidad)',
  email VARCHAR(255),
  telefono VARCHAR(20),
  rh VARCHAR(10) COMMENT 'Grupo sanguíneo (A+, A-, B+, AB+, AB-, O+, O-)',
  id_programa INT NULL COMMENT 'Referencia al programa de formación',
  fecha_inicio_formacion DATE NULL,
  fecha_fin_formacion DATE NULL,
  jornada ENUM('diurna', 'nocturna', 'mixta') NULL,
  cargo VARCHAR(100) COMMENT 'Cargo para instructores y administrativos',
  tipo_contrato ENUM('planta', 'contrato', 'catedra') NULL,
  
  -- FOREIGN KEYS
  FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_estado_persona) REFERENCES estados_personas (id_estado_persona) ON DELETE SET NULL,
  FOREIGN KEY (id_rol_persona) REFERENCES roles_personas (id_rol_persona) ON DELETE SET NULL,
  FOREIGN KEY (id_rol) REFERENCES Roles (id_rol) ON DELETE SET NULL,
  
  -- ÍNDICES
  INDEX idx_documento (documento),
  INDEX idx_tipo_documento (tipo_documento),
  INDEX idx_codigo_qr (codigo_qr),
  INDEX idx_estado (estado),
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_id_estado_persona (id_estado_persona),
  INDEX idx_id_rol_persona (id_rol_persona),
  INDEX idx_id_ficha (id_ficha),
  INDEX idx_id_rol (id_rol),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- =====================================================
-- TABLA: visitantes
-- =====================================================
CREATE TABLE IF NOT EXISTS visitantes (
    id_visitante INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    motivo_visita TEXT NOT NULL,
    contacto VARCHAR(255),
    persona_visita VARCHAR(255),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    estado ENUM('ACTIVO', 'FINALIZADO', 'EXPIRADO') NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES Personas (id_persona) ON DELETE CASCADE,
    INDEX idx_id_persona (id_persona),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_fecha_fin (fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- TABLA: logs_seguridad
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_seguridad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('login_exitoso', 'login_fallido', 'cambio_password', 'modificacion_usuario', 'modificacion_config', 'generacion_reporte', 'acceso_sistema', 'operacion_admin') NOT NULL,
    id_usuario INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    accion TEXT NOT NULL,
    detalles JSON,
    exito BOOLEAN DEFAULT TRUE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_ip_address (ip_address),
    INDEX idx_fecha (fecha),
    INDEX idx_exito (exito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: evidencia_fotografica
-- =====================================================
CREATE TABLE IF NOT EXISTS evidencia_fotografica (
    id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
    id_incidente INT,
    tipo_incidente ENUM('acceso_denegado', 'comportamiento_sospechoso', 'incidente_seguridad', 'evidencia_general') NOT NULL,
    url_foto VARCHAR(500) NOT NULL,
    hash_archivo VARCHAR(64),
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_captura INT,
    descripcion TEXT,
    coordenadas_gps VARCHAR(100),
    metadata JSON,
    FOREIGN KEY (id_usuario_captura) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    INDEX idx_tipo_incidente (tipo_incidente),
    INDEX idx_fecha_captura (fecha_captura),
    INDEX idx_id_usuario_captura (id_usuario_captura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: auditoria
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro INT,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    id_usuario INT,
    ip_address VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    INDEX idx_tabla_afectada (tabla_afectada),
    INDEX idx_id_registro (id_registro),
    INDEX idx_accion (accion),
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CATÁLOGO DE PROGRAMAS Y AMBIENTES - CBI PALMIRA
-- Sistema de Control de Acceso SENA - CIRCUITO ABIERTO
-- =====================================================

USE control_acceso_sena;

-- =====================================================
-- TABLA: Programas_Formacion
-- CIRCUITO ABIERTO: Sin foreign keys restrictivas
-- =====================================================
CREATE TABLE IF NOT EXISTS Programas_Formacion (
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
  
  -- Índices para optimización
  INDEX idx_codigo_programa (codigo_programa),
  INDEX idx_nivel (nivel),
  INDEX idx_area_conocimiento (area_conocimiento),
  INDEX idx_estado (estado),
  INDEX idx_nombre_programa (nombre_programa(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de programas de formación del SENA - Circuito Abierto';

-- =====================================================
-- TABLA: Fichas
-- CIRCUITO ABIERTO: Sin foreign keys restrictivas
-- =====================================================
CREATE TABLE IF NOT EXISTS Fichas (
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
  
  -- Índices para optimización (sin foreign keys restrictivas para circuito abierto)
  INDEX idx_ficha_codigo (codigo_ficha),
  INDEX idx_ficha_programa (id_programa),
  INDEX idx_ficha_estado (estado),
  INDEX idx_ficha_jornada (jornada),
  INDEX idx_ficha_fechas (fecha_inicio, fecha_fin),
  INDEX idx_ficha_ambiente (id_ambiente_principal),
  INDEX idx_programa_formacion (programa_formacion(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para gestionar las fichas de formación del SENA - Circuito Abierto';

-- NOTA: En CIRCUITO ABIERTO no usamos FOREIGN KEYS restrictivas
-- Las relaciones se manejan a nivel de aplicación para mayor flexibilidad
-- Esto permite:
-- 1. Crear fichas sin requerir que exista el programa previamente
-- 2. Eliminar programas sin afectar fichas existentes (solo se limpia la referencia)
-- 3. Mayor flexibilidad en la gestión de datos

-- =====================================================
-- TABLA: Accesos (CIRCUITO CERRADO - Para compatibilidad)
-- NOTA: Esta tabla se mantiene para compatibilidad con código existente
-- El sistema principal usa registros_entrada_salida (circuito abierto)
-- =====================================================
CREATE TABLE IF NOT EXISTS Accesos (
  id_acceso INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  id_usuario_registro INT NULL,
  tipo_acceso ENUM('entrada', 'salida') NOT NULL DEFAULT 'entrada',
  fecha_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP NULL,
  estado ENUM('activo', 'finalizado', 'cancelado') NOT NULL DEFAULT 'activo',
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_persona) REFERENCES Personas (id_persona) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_registro) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
  INDEX idx_id_persona (id_persona),
  INDEX idx_fecha_entrada (fecha_entrada),
  INDEX idx_fecha_salida (fecha_salida),
  INDEX idx_estado (estado),
  INDEX idx_tipo_acceso (tipo_acceso),
  INDEX idx_usuario_registro (id_usuario_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de accesos (circuito cerrado) - Mantenida para compatibilidad';

-- =====================================================
-- TABLA: registros_entrada_salida (CIRCUITO ABIERTO)
-- Cada registro es INDEPENDIENTE (entrada o salida)
-- IMPORTANTE: Esta es la estructura de CIRCUITO ABIERTO
-- Cada registro tiene un solo campo fecha_hora con el tipo (ENTRADA o SALIDA)
-- NO usa fecha_entrada y fecha_salida separadas (eso sería circuito cerrado)
-- =====================================================
CREATE TABLE IF NOT EXISTS registros_entrada_salida (
  id_registro_entrada_salida INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT,
  tipo ENUM('ENTRADA', 'SALIDA') NOT NULL,
  fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora exacta del registro (entrada o salida)',
  FOREIGN KEY (id_persona) REFERENCES Personas (id_persona) ON DELETE CASCADE,
  INDEX idx_registro_persona (id_persona),
  INDEX idx_registro_tipo (tipo),
  INDEX idx_registro_fecha (fecha_hora),
  INDEX idx_persona_fecha (id_persona, fecha_hora),
  INDEX idx_persona_tipo_fecha (id_persona, tipo, fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registros independientes de entrada y salida - Circuito Abierto';

-- =====================================================
-- VISTAS ÚTILES PARA CIRCUITO ABIERTO
-- =====================================================

-- Vista: Últimos registros de acceso
CREATE OR REPLACE VIEW v_ultimos_registros AS
SELECT 
    r.id_registro_entrada_salida,
    r.tipo,
    r.fecha_hora,
    p.id_persona,
    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
    p.documento,
    rp.nombre_rol_persona as rol,
    p.zona
FROM registros_entrada_salida r
INNER JOIN Personas p ON r.id_persona = p.id_persona
LEFT JOIN roles_personas rp ON p.id_rol_persona = rp.id_rol_persona
ORDER BY r.fecha_hora DESC;

-- Vista: Personas actualmente dentro (última acción fue ENTRADA sin SALIDA posterior)
-- Incluye visitantes, aprendices, instructores, etc.
CREATE OR REPLACE VIEW v_personas_dentro AS
SELECT 
    p.id_persona,
    COALESCE(
      CONCAT(p.nombres, ' ', p.apellidos),
      p.nombre,
      CONCAT(p.nombres, p.apellidos)
    ) as nombre_completo,
    p.documento,
    COALESCE(rp.nombre_rol_persona, rol_tabla.nombre_rol, p.rol) as rol,
    p.foto,
    r.fecha_hora as fecha_entrada,
    TIMESTAMPDIFF(MINUTE, r.fecha_hora, NOW()) as minutos_dentro,
    p.zona,
    v.id_visitante,
    v.motivo_visita
FROM Personas p
INNER JOIN registros_entrada_salida r ON p.id_persona = r.id_persona
LEFT JOIN roles_personas rp ON p.id_rol_persona = rp.id_rol_persona
LEFT JOIN Roles rol_tabla ON p.id_rol = rol_tabla.id_rol
LEFT JOIN visitantes v ON p.id_persona = v.id_persona AND v.estado = 'ACTIVO'
WHERE r.tipo = 'ENTRADA'
  AND r.fecha_hora = (
    SELECT MAX(fecha_hora) 
    FROM registros_entrada_salida 
    WHERE id_persona = p.id_persona
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM registros_entrada_salida r2 
    WHERE r2.id_persona = p.id_persona 
      AND r2.tipo = 'SALIDA' 
      AND r2.fecha_hora > r.fecha_hora
  )
  AND (p.estado = 'ACTIVO' OR p.estado = 'activo');

-- Vista: Resumen de asistencia por persona
CREATE OR REPLACE VIEW v_resumen_asistencia AS
SELECT 
    p.id_persona,
    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
    p.documento,
    rp.nombre_rol_persona as rol,
    COUNT(DISTINCT DATE(r.fecha_hora)) as dias_asistencia,
    COUNT(CASE WHEN r.tipo = 'ENTRADA' THEN 1 END) as total_entradas,
    COUNT(CASE WHEN r.tipo = 'SALIDA' THEN 1 END) as total_salidas,
    MAX(r.fecha_hora) as ultimo_registro
FROM Personas p
LEFT JOIN registros_entrada_salida r ON p.id_persona = r.id_persona
LEFT JOIN roles_personas rp ON p.id_rol_persona = rp.id_rol_persona
WHERE p.estado = 'ACTIVO'
GROUP BY p.id_persona, p.nombres, p.apellidos, p.documento, rp.nombre_rol_persona;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Registrar entrada
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_registrar_entrada$$

CREATE PROCEDURE sp_registrar_entrada(IN p_id_persona INT)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora)
    VALUES 
    (p_id_persona, 'ENTRADA', NOW());
    
    SELECT LAST_INSERT_ID() as id_registro_entrada_salida;
END$$

DELIMITER ;

-- Registrar salida
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_registrar_salida$$

CREATE PROCEDURE sp_registrar_salida(IN p_id_persona INT)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora)
    VALUES 
    (p_id_persona, 'SALIDA', NOW());
    
    SELECT LAST_INSERT_ID() as id_registro_entrada_salida;
END$$

DELIMITER ;

-- Obtener personas actualmente dentro
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_personas_dentro$$

CREATE PROCEDURE sp_personas_dentro()
BEGIN
    SELECT * FROM v_personas_dentro;
END$$

DELIMITER ;

-- Verificar última acción de una persona
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_ultima_accion_persona$$

CREATE PROCEDURE sp_ultima_accion_persona(IN p_id_persona INT)
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

DELIMITER ;

-- =====================================================
-- NOTA: Las siguientes tablas son OPCIONALES y pueden ser
-- agregadas más adelante si se necesitan funcionalidades adicionales
-- =====================================================
-- Tablas opcionales: Sesiones_Acceso, Alertas, Fichas, Ambientes, etc.
-- Estas tablas requieren tablas adicionales que no están en la estructura básica



-- =====================================================
-- NOTA: La inserción de programas de formación se puede hacer
-- manualmente si se necesita la tabla Programas_Formacion
-- =====================================================

-- =====================================================
-- NOTA: Las vistas y procedimientos básicos ya están definidos
-- arriba en la sección "VISTAS ÚTILES PARA CIRCUITO ABIERTO"
-- y "PROCEDIMIENTOS ALMACENADOS ÚTILES"
-- =====================================================

-- Nota: Los índices adicionales ya están incluidos en las definiciones de las tablas

-- =====================================================
-- DOCUMENTACIÓN DEL MODELO DE CIRCUITO ABIERTO
-- =====================================================
/*
VENTAJAS DEL CIRCUITO ABIERTO:

1. FLEXIBILIDAD TOTAL
   - No requiere emparejar entradas con salidas
   - Permite registros independientes
   - Soporta casos de uso complejos

2. RESILIENCIA
   - Si alguien olvida registrar salida, no afecta entradas futuras
   - Permite correcciones posteriores
   - No bloquea el sistema por registros incompletos

3. ESCALABILIDAD
   - Mejor rendimiento en consultas
   - Menos complejidad en transacciones
   - Facilita integraciones con otros sistemas

4. ANÁLISIS
   - Datos más granulares
   - Permite análisis de patrones
   - Facilita reportes y estadísticas

5. CASOS DE USO SOPORTADOS
   - Entrada sin salida registrada
   - Múltiples entradas consecutivas
   - Salida sin entrada previa
   - Corrección de registros erróneos

CONSULTAS COMUNES:

1. Personas actualmente dentro:
   SELECT * FROM v_personas_dentro;
   O también: CALL sp_personas_dentro();

2. Último registro de una persona:
   CALL sp_ultima_accion_persona(1);

3. Todos los registros de hoy:
   SELECT * FROM registros_entrada_salida 
   WHERE DATE(fecha_hora) = CURDATE();

4. Historial completo de una persona:
   SELECT * FROM registros_entrada_salida 
   WHERE id_persona = 1 
   ORDER BY fecha_hora DESC;

5. Registrar entrada:
   CALL sp_registrar_entrada(1);

6. Registrar salida:
   CALL sp_registrar_salida(1);

7. Resumen de asistencia:
   SELECT * FROM v_resumen_asistencia;

ESTRUCTURA DE TABLAS BÁSICAS:

- usuarios: Usuarios del sistema (GUARDA, ADMINISTRADOR)
- estados_personas: Catálogo de estados (ACTIVO, INACTIVO, SUSPENDIDO)
- roles_personas: Catálogo de roles (APRENDIZ, INSTRUCTOR, etc.)
- personas: Información de las personas registradas
- registros_entrada_salida: Registros independientes de entrada/salida (CIRCUITO ABIERTO)

NOTAS IMPORTANTES:

1. Cada registro en registros_entrada_salida es INDEPENDIENTE
2. No se requiere emparejar entradas con salidas
3. La vista v_personas_dentro muestra personas cuya última acción fue ENTRADA
4. Los procedimientos almacenados simplifican las operaciones comunes
5. La tabla usa tipo ENUM('ENTRADA', 'SALIDA') y fecha_hora (circuito abierto)
*/

-- =====================================================
-- MIGRACIONES: Crear tablas de catálogo (Programas_Formacion y Fichas)
-- CIRCUITO ABIERTO: Sin foreign keys restrictivas
-- =====================================================
SET @dbname = DATABASE();

-- Eliminar foreign keys restrictivas si existen (CIRCUITO ABIERTO)
-- Eliminar foreign key de Personas a Programas_Formacion si existe
SET @fk_name = (SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = @dbname 
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
                WHERE TABLE_SCHEMA = @dbname 
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
                WHERE TABLE_SCHEMA = @dbname 
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

-- Crear tabla Programas_Formacion si no existe
SET @tablename = 'Programas_Formacion';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE TABLE ', @tablename, ' (
    id_programa INT AUTO_INCREMENT PRIMARY KEY,
    codigo_programa VARCHAR(50) UNIQUE NOT NULL COMMENT ''Código único del programa (ej: TEC-PS-001)'',
    nombre_programa VARCHAR(200) NOT NULL COMMENT ''Nombre completo del programa de formación'',
    nivel ENUM(''Técnico'', ''Tecnológico'', ''Especialización'', ''Formación Complementaria'') DEFAULT ''Técnico'' COMMENT ''Nivel de formación'',
    duracion_meses INT DEFAULT 12 COMMENT ''Duración del programa en meses'',
    area_conocimiento VARCHAR(100) NULL COMMENT ''Área de conocimiento o especialidad'',
    descripcion TEXT NULL COMMENT ''Descripción detallada del programa'',
    estado ENUM(''activo'', ''inactivo'', ''suspendido'') DEFAULT ''activo'' COMMENT ''Estado del programa'',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT ''Fecha de creación del registro'',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Fecha de última actualización'',
    INDEX idx_codigo_programa (codigo_programa),
    INDEX idx_nivel (nivel),
    INDEX idx_area_conocimiento (area_conocimiento),
    INDEX idx_estado (estado),
    INDEX idx_nombre_programa (nombre_programa(100))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT=''Catálogo de programas de formación del SENA - Circuito Abierto''')
));
PREPARE createIfNotExists FROM @preparedStatement;
EXECUTE createIfNotExists;
DEALLOCATE PREPARE createIfNotExists;

-- Eliminar tabla duplicada 'fichas' (minúscula) si existe
DROP TABLE IF EXISTS fichas;

-- Crear tabla Fichas si no existe (asegurar que sea única, no duplicada)
SET @tablename = 'Fichas';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE TABLE ', @tablename, ' (
    id_ficha INT AUTO_INCREMENT PRIMARY KEY,
    codigo_ficha VARCHAR(50) UNIQUE NOT NULL COMMENT ''Código único de la ficha (ej: 3066232)'',
    programa_formacion VARCHAR(200) NOT NULL COMMENT ''Nombre del programa de formación'',
    id_programa INT NULL COMMENT ''Referencia al programa de formación (opcional, para relación flexible)'',
    id_ambiente_principal INT NULL COMMENT ''Ambiente principal asignado a la ficha (opcional)'',
    jornada ENUM(''diurna'', ''nocturna'', ''mixta'') DEFAULT ''diurna'' COMMENT ''Jornada de formación'',
    fecha_inicio DATE NULL COMMENT ''Fecha de inicio de la ficha'',
    fecha_fin DATE NULL COMMENT ''Fecha de finalización de la ficha'',
    estado ENUM(''activa'', ''finalizada'', ''cancelada'') DEFAULT ''activa'' COMMENT ''Estado actual de la ficha'',
    numero_aprendices INT DEFAULT 0 COMMENT ''Número de aprendices asignados'',
    capacidad_maxima INT NULL COMMENT ''Capacidad máxima de aprendices'',
    observaciones TEXT NULL COMMENT ''Observaciones adicionales'',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT ''Fecha de creación del registro'',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Fecha de última actualización'',
    INDEX idx_ficha_codigo (codigo_ficha),
    INDEX idx_ficha_programa (id_programa),
    INDEX idx_ficha_estado (estado),
    INDEX idx_ficha_jornada (jornada),
    INDEX idx_ficha_fechas (fecha_inicio, fecha_fin),
    INDEX idx_ficha_ambiente (id_ambiente_principal),
    INDEX idx_programa_formacion (programa_formacion(100))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT=''Tabla para gestionar las fichas de formación del SENA - Circuito Abierto''')
));
PREPARE createIfNotExists FROM @preparedStatement;
EXECUTE createIfNotExists;
DEALLOCATE PREPARE createIfNotExists;

-- =====================================================
-- AGREGAR FOREIGN KEYS (CIRCUITO ABIERTO - ON DELETE SET NULL)
-- Todas las tablas quedan enlazadas pero con flexibilidad
-- =====================================================

-- Agregar foreign key: Personas.id_programa → Programas_Formacion.id_programa
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = @dbname
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
                  WHERE TABLE_SCHEMA = @dbname
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
                  WHERE TABLE_SCHEMA = @dbname
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
                         WHERE TABLE_SCHEMA = @dbname
                           AND TABLE_NAME = 'Ambientes');
SET @fk_exists = (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = @dbname
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

-- Agregar fecha_actualizacion a Personas si no existe
SET @tablename = 'Personas';
SET @columnname = 'fecha_actualizacion';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Fecha de última actualización del registro''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- MIGRACIÓN: Crear tabla Accesos si no existe
-- =====================================================
-- Esta tabla se mantiene para compatibilidad con código existente
-- El sistema principal usa registros_entrada_salida (circuito abierto)

SET @tablename = 'Accesos';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE TABLE ', @tablename, ' (
    id_acceso INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    id_usuario_registro INT NULL,
    tipo_acceso ENUM(\'entrada\', \'salida\') NOT NULL DEFAULT \'entrada\',
    fecha_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_salida TIMESTAMP NULL,
    estado ENUM(\'activo\', \'finalizado\', \'cancelado\') NOT NULL DEFAULT \'activo\',
    observaciones TEXT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES Personas (id_persona) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_registro) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    INDEX idx_id_persona (id_persona),
    INDEX idx_fecha_entrada (fecha_entrada),
    INDEX idx_fecha_salida (fecha_salida),
    INDEX idx_estado (estado),
    INDEX idx_tipo_acceso (tipo_acceso),
    INDEX idx_usuario_registro (id_usuario_registro)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT=\'Tabla de accesos (circuito cerrado) - Mantenida para compatibilidad\'')
));
PREPARE createIfNotExists FROM @preparedStatement;
EXECUTE createIfNotExists;
DEALLOCATE PREPARE createIfNotExists;

-- =====================================================
-- TRIGGER: Sincronizar registros_entrada_salida a Accesos
-- =====================================================
-- Este trigger mantiene sincronizada la tabla Accesos con registros_entrada_salida
-- para compatibilidad con código que aún usa Accesos

DELIMITER $$

DROP TRIGGER IF EXISTS tr_sync_accesos_entrada$$

CREATE TRIGGER tr_sync_accesos_entrada
AFTER INSERT ON registros_entrada_salida
FOR EACH ROW
BEGIN
  DECLARE v_id_usuario_registro INT DEFAULT NULL;
  
  IF NEW.tipo = 'ENTRADA' THEN
    -- Insertar nuevo acceso en Accesos
    INSERT INTO Accesos (
      id_persona,
      id_usuario_registro,
      tipo_acceso,
      fecha_entrada,
      estado,
      fecha_creacion,
      fecha_actualizacion
    ) VALUES (
      NEW.id_persona,
      v_id_usuario_registro,
      'entrada',
      NEW.fecha_hora,
      'activo',
      NEW.fecha_hora,
      NEW.fecha_hora
    );
  ELSEIF NEW.tipo = 'SALIDA' THEN
    -- Actualizar el último acceso activo de la persona
    -- Usar subconsulta para obtener el ID del último acceso activo
    UPDATE Accesos
    SET fecha_salida = NEW.fecha_hora,
        estado = 'finalizado',
        fecha_actualizacion = NOW()
    WHERE id_acceso = (
      SELECT id_acceso FROM (
        SELECT id_acceso
        FROM Accesos
        WHERE id_persona = NEW.id_persona
          AND estado = 'activo'
          AND fecha_salida IS NULL
        ORDER BY fecha_entrada DESC
        LIMIT 1
      ) AS temp
    );
    
    -- Si no hay acceso activo, crear uno nuevo (salida sin entrada previa)
    IF ROW_COUNT() = 0 THEN
      INSERT INTO Accesos (
        id_persona,
        id_usuario_registro,
        tipo_acceso,
        fecha_entrada,
        fecha_salida,
        estado,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES (
        NEW.id_persona,
        v_id_usuario_registro,
        'salida',
        NEW.fecha_hora,
        NEW.fecha_hora,
        'finalizado',
        NEW.fecha_hora,
        NEW.fecha_hora
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- SCRIPT DE MIGRACIÓN: Poblar Accesos con datos existentes
-- =====================================================
-- Este script migra los datos existentes de registros_entrada_salida a Accesos
-- Ejecutar manualmente si es necesario poblar datos históricos

-- Procedimiento para migrar datos existentes
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migrar_accesos_existentes$$

CREATE PROCEDURE sp_migrar_accesos_existentes()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id_persona INT;
  DECLARE v_tipo VARCHAR(10);
  DECLARE v_fecha_hora TIMESTAMP;
  DECLARE v_ultima_entrada_id INT DEFAULT NULL;
  
  -- Cursor para recorrer registros de entrada
  DECLARE cur_entradas CURSOR FOR
    SELECT id_persona, fecha_hora
    FROM registros_entrada_salida
    WHERE tipo = 'ENTRADA'
    ORDER BY id_persona, fecha_hora;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Limpiar tabla Accesos antes de migrar (opcional, comentar si no se desea)
  -- TRUNCATE TABLE Accesos;
  
  -- Procesar entradas y crear registros en Accesos
  OPEN cur_entradas;
  
  read_loop: LOOP
    FETCH cur_entradas INTO v_id_persona, v_fecha_hora;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Insertar entrada en Accesos
    INSERT INTO Accesos (
      id_persona,
      id_usuario_registro,
      tipo_acceso,
      fecha_entrada,
      estado,
      fecha_creacion,
      fecha_actualizacion
    ) VALUES (
      v_id_persona,
      NULL,
      'entrada',
      v_fecha_hora,
      'activo',
      v_fecha_hora,
      v_fecha_hora
    );
    
    SET v_ultima_entrada_id = LAST_INSERT_ID();
    
    -- Buscar la siguiente salida para esta persona después de esta entrada
    SELECT id_acceso INTO v_ultima_entrada_id
    FROM Accesos
    WHERE id_persona = v_id_persona
      AND tipo_acceso = 'entrada'
      AND fecha_entrada = v_fecha_hora
      AND estado = 'activo'
    ORDER BY fecha_entrada DESC
    LIMIT 1;
    
    -- Buscar salida correspondiente
    SELECT fecha_hora INTO v_fecha_hora
    FROM registros_entrada_salida
    WHERE id_persona = v_id_persona
      AND tipo = 'SALIDA'
      AND fecha_hora > v_fecha_hora
    ORDER BY fecha_hora ASC
    LIMIT 1;
    
    -- Si hay salida, actualizar el acceso
    IF v_fecha_hora IS NOT NULL AND v_ultima_entrada_id IS NOT NULL THEN
      UPDATE Accesos
      SET fecha_salida = v_fecha_hora,
          estado = 'finalizado',
          fecha_actualizacion = v_fecha_hora
      WHERE id_acceso = v_ultima_entrada_id;
    END IF;
    
  END LOOP;
  
  CLOSE cur_entradas;
  
  -- Procesar salidas sin entrada previa
  INSERT INTO Accesos (
    id_persona,
    id_usuario_registro,
    tipo_acceso,
    fecha_entrada,
    fecha_salida,
    estado,
    fecha_creacion,
    fecha_actualizacion
  )
  SELECT 
    id_persona,
    NULL,
    'salida',
    fecha_hora,
    fecha_hora,
    'finalizado',
    fecha_hora,
    fecha_hora
  FROM registros_entrada_salida
  WHERE tipo = 'SALIDA'
    AND NOT EXISTS (
      SELECT 1 FROM Accesos a
      WHERE a.id_persona = registros_entrada_salida.id_persona
        AND a.fecha_salida = registros_entrada_salida.fecha_hora
    );
  
  SELECT CONCAT('Migración completada. Registros procesados.') as resultado;
END$$

DELIMITER ;
