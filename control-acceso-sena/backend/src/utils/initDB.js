// Database Initialization Script
// Este script crea todas las tablas necesarias si no existen
import pool from './dbPool.js';
import bcrypt from 'bcryptjs';

const initializeDatabase = async () => {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Verificar conexión
    await pool.execute('SELECT 1');
    console.log('✅ Conexión a la base de datos exitosa');

    // Crear tabla Roles si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Roles (
        id_rol INT AUTO_INCREMENT PRIMARY KEY,
        nombre_rol VARCHAR(50) NOT NULL UNIQUE,
        descripcion VARCHAR(255),
        estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nombre_rol (nombre_rol),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Roles verificada/creada');

    // Insertar roles por defecto
    await pool.execute(`
      INSERT INTO Roles (nombre_rol, descripcion) VALUES
      ('aprendiz', 'Aprendiz del SENA'),
      ('instructor', 'Instructor del SENA'),
      ('administrativo', 'Personal administrativo'),
      ('visitante', 'Visitante temporal'),
      ('guarda', 'Guarda de seguridad'),
      ('admin', 'Administrador del sistema')
      ON DUPLICATE KEY UPDATE nombre_rol=nombre_rol
    `);

    // Crear tabla Usuarios si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Usuarios (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'guarda') NOT NULL DEFAULT 'guarda',
        estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_rol (rol),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Usuarios verificada/creada');

    // Crear tabla Personas si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Personas (
        id_persona INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        documento VARCHAR(50) NOT NULL,
        tipo_documento ENUM('CC', 'CE', 'TI', 'PA', 'NIT') NOT NULL DEFAULT 'CC',
        email VARCHAR(255),
        telefono VARCHAR(20),
        foto VARCHAR(500),
        id_rol INT,
        rol VARCHAR(50) DEFAULT 'aprendiz',
        estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE SET NULL,
        INDEX idx_documento (documento),
        INDEX idx_tipo_documento (tipo_documento),
        INDEX idx_rol (rol),
        INDEX idx_estado (estado),
        INDEX idx_id_rol (id_rol),
        UNIQUE KEY uk_documento_tipo (documento, tipo_documento)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Personas verificada/creada');

    // Crear tabla Accesos si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Accesos (
        id_acceso INT AUTO_INCREMENT PRIMARY KEY,
        id_persona INT NOT NULL,
        id_usuario_registro INT,
        tipo_acceso ENUM('entrada', 'salida') NOT NULL DEFAULT 'entrada',
        fecha_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_salida TIMESTAMP NULL,
        estado ENUM('activo', 'finalizado', 'cancelado') NOT NULL DEFAULT 'activo',
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_persona) REFERENCES Personas(id_persona) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario_registro) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        INDEX idx_id_persona (id_persona),
        INDEX idx_fecha_entrada (fecha_entrada),
        INDEX idx_fecha_salida (fecha_salida),
        INDEX idx_estado (estado),
        INDEX idx_tipo_acceso (tipo_acceso),
        INDEX idx_usuario_registro (id_usuario_registro)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Accesos verificada/creada');

    // Crear tabla Visitantes si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Visitantes (
        id_visitante INT AUTO_INCREMENT PRIMARY KEY,
        id_persona INT NOT NULL,
        motivo_visita TEXT NOT NULL,
        contacto VARCHAR(255),
        persona_visita VARCHAR(255),
        fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_fin TIMESTAMP NULL,
        estado ENUM('activo', 'finalizado', 'expirado') NOT NULL DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_persona) REFERENCES Personas(id_persona) ON DELETE CASCADE,
        INDEX idx_id_persona (id_persona),
        INDEX idx_estado (estado),
        INDEX idx_fecha_inicio (fecha_inicio),
        INDEX idx_fecha_fin (fecha_fin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Visitantes verificada/creada');

    // Crear tabla Configuracion si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Configuracion (
        id_config INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(100) NOT NULL UNIQUE,
        valor TEXT,
        tipo ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
        descripcion VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clave (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Configuracion verificada/creada');

    // Insertar configuraciones por defecto
    await pool.execute(`
      INSERT INTO Configuracion (clave, valor, tipo, descripcion) VALUES
      ('qr_visitor_expiry_hours', '24', 'number', 'Horas de validez del QR de visitante'),
      ('system_name', 'Control de Acceso SENA', 'string', 'Nombre del sistema'),
      ('max_visitors_per_day', '100', 'number', 'Máximo de visitantes por día')
      ON DUPLICATE KEY UPDATE clave=clave
    `);

    // Crear tabla Alertas si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Alertas (
        id_alerta INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('acceso_fuera_horario', 'intento_fraudulento', 'qr_expirado', 'documento_no_registrado', 'comportamiento_sospechoso', 'sistema', 'seguridad') NOT NULL,
        severidad ENUM('critica', 'alta', 'media', 'baja') NOT NULL DEFAULT 'media',
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        id_persona INT,
        id_acceso INT,
        id_usuario INT,
        leida BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura TIMESTAMP NULL,
        id_usuario_lectura INT,
        metadata JSON,
        FOREIGN KEY (id_persona) REFERENCES Personas(id_persona) ON DELETE SET NULL,
        FOREIGN KEY (id_acceso) REFERENCES Accesos(id_acceso) ON DELETE SET NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        FOREIGN KEY (id_usuario_lectura) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        INDEX idx_tipo (tipo),
        INDEX idx_severidad (severidad),
        INDEX idx_leida (leida),
        INDEX idx_fecha_creacion (fecha_creacion),
        INDEX idx_id_persona (id_persona)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Alertas verificada/creada');

    // Crear tabla Logs_Seguridad si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Logs_Seguridad (
        id_log INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('login_exitoso', 'login_fallido', 'cambio_password', 'modificacion_usuario', 'modificacion_config', 'generacion_reporte', 'acceso_sistema', 'operacion_admin') NOT NULL,
        id_usuario INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        accion TEXT NOT NULL,
        detalles JSON,
        exito BOOLEAN DEFAULT TRUE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        INDEX idx_tipo (tipo),
        INDEX idx_id_usuario (id_usuario),
        INDEX idx_ip_address (ip_address),
        INDEX idx_fecha (fecha),
        INDEX idx_exito (exito)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Logs_Seguridad verificada/creada');

    // Crear tabla Evidencia_Fotografica si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Evidencia_Fotografica (
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
        FOREIGN KEY (id_usuario_captura) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        INDEX idx_tipo_incidente (tipo_incidente),
        INDEX idx_fecha_captura (fecha_captura),
        INDEX idx_id_usuario_captura (id_usuario_captura)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Evidencia_Fotografica verificada/creada');

    // Crear tabla Auditoria si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Auditoria (
        id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
        tabla_afectada VARCHAR(100) NOT NULL,
        id_registro INT,
        accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        datos_anteriores JSON,
        datos_nuevos JSON,
        id_usuario INT,
        ip_address VARCHAR(45),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
        INDEX idx_tabla_afectada (tabla_afectada),
        INDEX idx_id_registro (id_registro),
        INDEX idx_accion (accion),
        INDEX idx_id_usuario (id_usuario),
        INDEX idx_fecha (fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla Auditoria verificada/creada');

    // Verificar si existen usuarios
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM Usuarios');
    
    if (users[0].count === 0) {
      console.log('📝 Creando usuarios por defecto...');
      
      // Crear usuario admin
      const adminPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Administrador', 'admin@sena.edu.co', adminPassword, 'admin', 'activo']
      );
      console.log('✅ Usuario admin creado: admin@sena.edu.co / admin123');

      // Crear usuario guarda
      const guardaPassword = await bcrypt.hash('guarda123', 10);
      await pool.execute(
        `INSERT INTO Usuarios (nombre, email, password_hash, rol, estado) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Guarda de Seguridad', 'guarda@sena.edu.co', guardaPassword, 'guarda', 'activo']
      );
      console.log('✅ Usuario guarda creado: guarda@sena.edu.co / guarda123');
    } else {
      console.log('ℹ️  Ya existen usuarios en la base de datos');
    }

    // Crear trigger de sincronización de Accesos si no existe
    try {
      const { verifyTrigger, createTrigger } = await import('./syncAccesos.js');
      const triggerExists = await verifyTrigger();
      if (!triggerExists) {
        console.log('🔄 Creando trigger de sincronización de Accesos...');
        await createTrigger();
      }
    } catch (triggerError) {
      console.warn('⚠️  No se pudo crear el trigger de Accesos:', triggerError.message);
      // No fallar la inicialización si el trigger no se puede crear
    }

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export default initializeDatabase;

