// LogService - Servicio de logging para seguridad y auditoría
import pool from '../utils/dbPool.js';

class LogService {
  /**
   * Registrar evento de seguridad
   * @param {string} tipo - Tipo de evento: login_exitoso, login_fallido, cambio_password, modificacion_usuario, acceso_sistema
   * @param {number|null} idUsuario - ID del usuario (puede ser null para login fallido)
   * @param {string} accion - Descripción de la acción
   * @param {object} detalles - Detalles adicionales en formato JSON
   * @param {object} req - Request de Express para obtener IP y user-agent
   */
  static async logSeguridad(tipo, idUsuario, accion, detalles = {}, req = null) {
    try {
      const ipAddress = req ? (req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown') : 'system';
      const userAgent = req ? (req.headers['user-agent'] || 'unknown') : 'system';

      await pool.execute(
        `INSERT INTO logs_seguridad (tipo, id_usuario, ip_address, user_agent, accion, detalles, fecha)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          tipo,
          idUsuario,
          ipAddress,
          userAgent,
          accion,
          JSON.stringify(detalles)
        ]
      );

      console.log(`📝 [LogSeguridad] ${tipo}: ${accion}`);
    } catch (error) {
      // No fallar si hay error en el logging, solo registrar en consola
      console.error('❌ Error al registrar log de seguridad:', error.message);
    }
  }

  /**
   * Registrar login exitoso
   */
  static async loginExitoso(userId, email, req) {
    await this.logSeguridad(
      'login_exitoso',
      userId,
      `Usuario ${email} inició sesión exitosamente`,
      { email },
      req
    );
  }

  /**
   * Registrar login fallido
   */
  static async loginFallido(email, motivo, req) {
    await this.logSeguridad(
      'login_fallido',
      null,
      `Intento de login fallido para ${email}: ${motivo}`,
      { email, motivo },
      req
    );
  }

  /**
   * Registrar cambio de contraseña
   */
  static async cambioPassword(userId, email, cambiadoPor, req) {
    await this.logSeguridad(
      'cambio_password',
      userId,
      `Contraseña cambiada para ${email}`,
      { email, cambiadoPor },
      req
    );
  }

  /**
   * Registrar modificación de usuario
   */
  static async modificacionUsuario(userId, accion, detalles, req) {
    await this.logSeguridad(
      'modificacion_usuario',
      userId,
      accion,
      detalles,
      req
    );
  }

  /**
   * Registrar acceso al sistema
   */
  static async accesoSistema(userId, recurso, req) {
    await this.logSeguridad(
      'acceso_sistema',
      userId,
      `Acceso a ${recurso}`,
      { recurso },
      req
    );
  }

  /**
   * Registrar intento de acceso con QR inválido
   * Usa tipo 'acceso_sistema' ya que 'qr_invalido' no está en el ENUM de la tabla
   */
  static async qrInvalido(documento, motivo, detalles = {}, req = null) {
    await this.logSeguridad(
      'acceso_sistema',
      null,
      `[QR_INVALIDO] Documento ${documento}: ${motivo}`,
      { subtipo: 'qr_invalido', documento, motivo, ...detalles },
      req
    );
  }

  /**
   * Registrar acceso denegado (persona no registrada, inactiva, etc.)
   * Usa tipo 'acceso_sistema' ya que 'acceso_denegado' no está en el ENUM de la tabla
   */
  static async accesoDenegado(documento, motivo, detalles = {}, req = null) {
    await this.logSeguridad(
      'acceso_sistema',
      null,
      `[ACCESO_DENEGADO] Documento ${documento}: ${motivo}`,
      { subtipo: 'acceso_denegado', documento, motivo, ...detalles },
      req
    );
  }

  /**
   * Registrar acceso exitoso (entrada/salida)
   * Usa tipo 'acceso_sistema' ya que 'acceso_exitoso' no está en el ENUM de la tabla
   */
  static async accesoExitoso(userId, personaId, documento, nombre, accion, req = null) {
    await this.logSeguridad(
      'acceso_sistema',
      userId,
      `[ACCESO_EXITOSO] ${accion === 'entrada' ? 'Entrada' : 'Salida'} de ${nombre} (${documento})`,
      { subtipo: 'acceso_exitoso', personaId, documento, nombre, accion },
      req
    );
  }

  /**
   * Registrar evento de auditoría (cambios en la base de datos)
   * @param {string} tablaAfectada - Nombre de la tabla
   * @param {number} idRegistro - ID del registro afectado
   * @param {string} accion - INSERT, UPDATE, DELETE
   * @param {object} datosAnteriores - Datos antes del cambio (null para INSERT)
   * @param {object} datosNuevos - Datos después del cambio (null para DELETE)
   * @param {number|null} idUsuario - ID del usuario que hizo el cambio
   * @param {object} req - Request de Express
   */
  static async auditoria(tablaAfectada, idRegistro, accion, datosAnteriores, datosNuevos, idUsuario, req = null) {
    try {
      const ipAddress = req ? (req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown') : 'system';

      await pool.execute(
        `INSERT INTO auditoria (tabla_afectada, id_registro, accion, datos_anteriores, datos_nuevos, id_usuario, ip_address, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          tablaAfectada,
          idRegistro,
          accion,
          datosAnteriores ? JSON.stringify(datosAnteriores) : null,
          datosNuevos ? JSON.stringify(datosNuevos) : null,
          idUsuario,
          ipAddress
        ]
      );

      console.log(`📝 [Auditoria] ${accion} en ${tablaAfectada} (ID: ${idRegistro})`);
    } catch (error) {
      // No fallar si hay error en el logging, solo registrar en consola
      console.error('❌ Error al registrar auditoría:', error.message);
    }
  }

  /**
   * Obtener logs de seguridad con filtros
   */
  static async getLogsSeguridad(filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page, 10) || 1;
      const limit = parseInt(pagination.limit, 10) || 50;
      const offset = (page - 1) * limit;

      let baseQuery = `
        FROM logs_seguridad ls
        LEFT JOIN usuarios u ON ls.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params = [];

      if (filters.tipo) {
        baseQuery += ` AND ls.tipo = ?`;
        params.push(filters.tipo);
      }

      if (filters.id_usuario) {
        baseQuery += ` AND ls.id_usuario = ?`;
        params.push(parseInt(filters.id_usuario, 10));
      }

      if (filters.fecha_desde) {
        baseQuery += ` AND DATE(ls.fecha) >= ?`;
        params.push(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        baseQuery += ` AND DATE(ls.fecha) <= ?`;
        params.push(filters.fecha_hasta);
      }

      // Contar total
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Consulta principal con paginación (usando valores directos, no parámetros)
      const selectQuery = `
        SELECT 
          ls.id_log,
          ls.tipo,
          ls.id_usuario,
          u.nombre as nombre_usuario,
          u.email as email_usuario,
          ls.ip_address,
          ls.user_agent,
          ls.accion,
          ls.detalles,
          ls.fecha
        ${baseQuery}
        ORDER BY ls.fecha DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [rows] = await pool.execute(selectQuery, params);

      return {
        success: true,
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error obteniendo logs de seguridad:', error);
      throw error;
    }
  }

  /**
   * Obtener registros de auditoría con filtros
   */
  static async getAuditoria(filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page, 10) || 1;
      const limit = parseInt(pagination.limit, 10) || 50;
      const offset = (page - 1) * limit;

      let baseQuery = `
        FROM auditoria a
        LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params = [];

      if (filters.tabla) {
        baseQuery += ` AND a.tabla_afectada = ?`;
        params.push(filters.tabla);
      }

      if (filters.accion) {
        baseQuery += ` AND a.accion = ?`;
        params.push(filters.accion);
      }

      if (filters.id_usuario) {
        baseQuery += ` AND a.id_usuario = ?`;
        params.push(parseInt(filters.id_usuario, 10));
      }

      if (filters.fecha_desde) {
        baseQuery += ` AND DATE(a.fecha) >= ?`;
        params.push(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        baseQuery += ` AND DATE(a.fecha) <= ?`;
        params.push(filters.fecha_hasta);
      }

      // Contar total
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Consulta principal con paginación
      const selectQuery = `
        SELECT 
          a.id_auditoria,
          a.tabla_afectada,
          a.id_registro,
          a.accion,
          a.datos_anteriores,
          a.datos_nuevos,
          a.id_usuario,
          u.nombre as nombre_usuario,
          u.email as email_usuario,
          a.ip_address,
          a.fecha
        ${baseQuery}
        ORDER BY a.fecha DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [rows] = await pool.execute(selectQuery, params);

      return {
        success: true,
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      throw error;
    }
  }
}

export default LogService;

