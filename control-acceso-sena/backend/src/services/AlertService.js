// Alert Service - Gestión de alertas automáticas
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

class AlertService {
  // Crear una nueva alerta
  static async createAlert(alertData) {
    try {
      const {
        tipo,
        severidad = 'media',
        titulo,
        mensaje,
        id_persona = null,
        id_acceso = null,
        id_usuario = null,
        metadata = null
      } = alertData;

      // Validar campos requeridos
      if (!tipo || !titulo || !mensaje) {
        console.error('❌ Error al crear alerta: Faltan campos requeridos', { tipo, titulo, mensaje });
        throw new Error('Faltan campos requeridos para crear la alerta');
      }

      console.log(`📝 Creando alerta: ${tipo} - ${titulo}`);

      const [result] = await pool.execute(
        `INSERT INTO Alertas 
         (tipo, severidad, titulo, mensaje, id_persona, id_acceso, id_usuario, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipo,
          severidad,
          titulo,
          mensaje,
          id_persona,
          id_acceso,
          id_usuario,
          metadata ? JSON.stringify(metadata) : null
        ]
      );

      const alertId = result.insertId;
      console.log(`✅ Alerta creada exitosamente con ID: ${alertId}`);
      return alertId;
    } catch (error) {
      console.error('❌ Error al crear alerta:', error.message);
      console.error('Stack:', error.stack);
      console.error('Datos de la alerta:', alertData);
      
      // Si es un error de tabla no existe, lanzar error específico
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.error('⚠️  La tabla Alertas no existe. Ejecuta el script de inicialización de la base de datos.');
        throw new Error('La tabla Alertas no existe. Ejecuta el script de inicialización.');
      }
      
      // Si es un error de foreign key, registrar pero no fallar completamente
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
        console.error('⚠️  Error de foreign key al crear alerta. Continuando sin guardar la alerta.');
        // Retornar null en lugar de lanzar error para no romper el flujo
        return null;
      }
      
      // Re-lanzar el error para que el llamador pueda manejarlo
      throw error;
    }
  }

  // Obtener alertas con filtros
  static async getAlerts(filters = {}) {
    try {
      const {
        tipo = null,
        severidad = null,
        leida = null,
        limit = 50,
        offset = 0
      } = filters;

      // Validar y convertir limit y offset a enteros
      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);

      // Primero verificar que la tabla existe
      try {
        await pool.execute('SELECT 1 FROM Alertas LIMIT 1');
      } catch (tableError) {
        if (tableError.code === 'ER_NO_SUCH_TABLE') {
          console.warn('⚠️  Tabla Alertas no existe, retornando array vacío');
          return [];
        }
        // Si es otro error, re-lanzarlo
        throw tableError;
      }

      let query = `
        SELECT 
          a.*,
          p.nombre as persona_nombre,
          p.documento,
          u.nombre as usuario_nombre,
          u2.nombre as usuario_lectura_nombre
        FROM Alertas a
        LEFT JOIN Personas p ON a.id_persona = p.id_persona
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        LEFT JOIN Usuarios u2 ON a.id_usuario_lectura = u2.id_usuario
        WHERE 1=1
      `;
      const params = [];

      if (tipo) {
        query += ' AND a.tipo = ?';
        params.push(tipo);
      }

      if (severidad) {
        query += ' AND a.severidad = ?';
        params.push(severidad);
      }

      if (leida !== null) {
        query += ' AND a.leida = ?';
        params.push(leida ? 1 : 0);
      }

      // Usar interpolación segura para LIMIT y OFFSET ya que están validados
      query += ` ORDER BY a.fecha_creacion DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await pool.execute(query, params);

      return rows.map(row => {
        let metadata = null;
        if (row.metadata) {
          try {
            // Si metadata es string, parsearlo
            if (typeof row.metadata === 'string') {
              metadata = JSON.parse(row.metadata);
            } else {
              // Si ya es objeto, usarlo directamente
              metadata = row.metadata;
            }
          } catch (error) {
            console.warn('⚠️  Error al parsear metadata de alerta:', error.message);
            metadata = null;
          }
        }
        
        return {
          ...row,
          metadata
        };
      });
    } catch (error) {
      console.error('❌ Error en AlertService.getAlerts:', error.message);
      console.error('❌ Código de error:', error.code);
      console.error('❌ SQL State:', error.sqlState);
      console.error('❌ Stack:', error.stack);
      
      // Si la tabla no existe, retornar array vacío
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist') || error.message?.includes('no existe')) {
        console.warn('⚠️  Tabla Alertas no existe, retornando array vacío');
        return [];
      }

      // Si hay problemas con tablas relacionadas, intentar consulta sin JOINs
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('Personas') || error.message?.includes('Usuarios')) {
        console.warn('⚠️  Problema con tablas relacionadas, intentando consulta simple');
        try {
          const [rows] = await pool.execute(
            `SELECT * FROM Alertas ORDER BY fecha_creacion DESC LIMIT ${Math.max(1, Math.min(parseInt(limit) || 50, 1000))} OFFSET ${Math.max(0, parseInt(offset) || 0)}`
          );
          return rows.map(row => ({
            ...row,
            metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null
          }));
        } catch (simpleError) {
          console.error('❌ Error en consulta simple:', simpleError.message);
          return [];
        }
      }
      
      // Re-lanzar el error para que el llamador pueda manejarlo
      throw error;
    }
  }

  // Marcar alerta como leída
  static async markAsRead(alertId, userId) {
    try {
      // Validar que la tabla existe
      try {
        await pool.execute('SELECT 1 FROM Alertas LIMIT 1');
      } catch (tableError) {
        if (tableError.code === 'ER_NO_SUCH_TABLE') {
          console.warn('⚠️  Tabla Alertas no existe');
          throw new Error('La tabla Alertas no existe');
        }
        throw tableError;
      }

      // Verificar que la alerta existe
      const [existing] = await pool.execute(
        'SELECT id_alerta FROM Alertas WHERE id_alerta = ?',
        [alertId]
      );

      if (existing.length === 0) {
        throw new Error(`Alerta con ID ${alertId} no encontrada`);
      }

      // Actualizar la alerta
      const [result] = await pool.execute(
        `UPDATE Alertas 
         SET leida = TRUE, fecha_lectura = NOW(), id_usuario_lectura = ?
         WHERE id_alerta = ?`,
        [userId, alertId]
      );

      if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar la alerta');
      }

      return result;
    } catch (error) {
      console.error('Error en AlertService.markAsRead:', error);
      throw error;
    }
  }

  // Eliminar alerta
  static async deleteAlert(alertId) {
    const [result] = await pool.execute(
      'DELETE FROM Alertas WHERE id_alerta = ?',
      [alertId]
    );
    return result.affectedRows > 0;
  }

  // Eliminar múltiples alertas leídas
  static async deleteReadAlerts(daysOld = null) {
    let query = 'DELETE FROM Alertas WHERE leida = TRUE';
    const params = [];

    if (daysOld) {
      query += ' AND fecha_lectura < DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(daysOld);
    }

    const [result] = await pool.execute(query, params);
    return result.affectedRows;
  }

  // Obtener estadísticas de alertas
  static async getAlertStats() {
    const alerts = await this.generateAlerts();
    const today = new Date().toISOString().split('T')[0];

    const byTypeMap = alerts.reduce((acc, alert) => {
      const tipo = alert.type || 'general';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const bySeverityMap = alerts.reduce((acc, alert) => {
      const severity = (alert.severity || alert.severidad || 'media').toLowerCase();
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const todayCount = alerts.filter(alert => {
      const created = alert.createdAt || alert.fecha_creacion;
      if (!created) return false;
      const createdDay = new Date(created).toISOString().split('T')[0];
      return createdDay === today;
    }).length;

    return {
      total: alerts.length,
      pendientes: alerts.length,
      criticas_pendientes: bySeverityMap['critica'] || 0,
      altas_pendientes: bySeverityMap['alta'] || 0,
      hoy: todayCount,
      porTipo: Object.entries(byTypeMap).map(([tipo, cantidad]) => ({ tipo, cantidad })),
      porSeveridad: Object.entries(bySeverityMap).map(([severidad, cantidad]) => ({ severidad, cantidad }))
    };
  }

  static resolvedAlertIds = new Set();

  // Detectar accesos fuera de horario
  static async detectOffScheduleAccess() {
    const idColumn = await getRegistroIdField();
    const fullNameExpr = "CONCAT(p.nombres, ' ', p.apellidos)";
    const [rows] = await pool.execute(`
      SELECT 
        r.${idColumn} as id_acceso,
        r.fecha_hora,
        p.id_persona,
        p.documento,
        COALESCE(role.nombre_rol, 'sin rol') as rol,
        COALESCE(
          ${fullNameExpr},
          p.nombres,
          p.apellidos,
          'Sin nombre'
        ) as persona_nombre,
        TIME(r.fecha_hora) as hora_acceso
      FROM registros_entrada_salida r
      INNER JOIN Personas p ON r.id_persona = p.id_persona
      LEFT JOIN Roles role ON p.id_rol = role.id_rol
      WHERE DATE(r.fecha_hora) = CURDATE()
      AND (HOUR(r.fecha_hora) < 6 OR HOUR(r.fecha_hora) > 22)
      AND r.tipo = 'ENTRADA'
      AND r.tipo = 'ENTRADA'
    `);

    return rows.map(row => ({
      id: `out_${row.id_acceso}`,
      type: 'acceso_fuera_horario',
      severity: 'media',
      title: 'Acceso fuera de horario',
      message: `${row.persona_nombre} (${row.documento}) ingresó fuera del horario permitido a las ${row.hora_acceso}`,
      createdAt: row.fecha_hora,
        metadata: {
        id_persona: row.id_persona,
        documento: row.documento,
        hora_acceso: row.hora_acceso,
        rol: row.rol || 'sin rol'
      }
    }));
  }

  // Detectar visitantes próximos a expirar
  static async detectExpiringVisitors() {
    const fullNameExpr = "CONCAT(p.nombres, ' ', p.apellidos)";
    const tableCandidates = ['Visitantes', 'visitantes'];

    for (const tableName of tableCandidates) {
      try {
        const [rows] = await pool.execute(`
          SELECT 
            v.id_visitante,
            v.fecha_inicio,
            p.id_persona,
            COALESCE(
              ${fullNameExpr},
              p.nombres,
              p.apellidos,
              'Sin nombre'
            ) as persona_nombre,
            p.documento,
            TIMESTAMPDIFF(HOUR, v.fecha_inicio, NOW()) as horas_transcurridas
          FROM ${tableName} v
          INNER JOIN Personas p ON v.id_persona = p.id_persona
          WHERE v.estado IN ('activo', 'ACTIVO')
            AND (v.fecha_fin IS NULL OR v.fecha_fin > NOW())
            AND TIMESTAMPDIFF(HOUR, v.fecha_inicio, NOW()) BETWEEN 23 AND 24
        `);

        if (rows.length === 0) {
          continue;
        }

        return rows.map(row => ({
          id: `visitor_${row.id_visitante}`,
          type: 'qr_expirado',
          severity: 'baja',
          title: 'Visitante próximo a expirar',
          message: `El QR de ${row.persona_nombre} expirará en menos de 1 hora`,
          createdAt: row.fecha_inicio,
          metadata: {
            id_visitante: row.id_visitante,
            id_persona: row.id_persona,
            documento: row.documento,
            horas_transcurridas: row.horas_transcurridas
          }
        }));
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          continue;
        }
        console.error(`Error detectando visitantes en ${tableName}:`, error.message);
        return [];
      }
    }

    return [];
  }

  static async generateAlerts() {
    const [offSchedule, visitors] = await Promise.all([
      this.detectOffScheduleAccess(),
      this.detectExpiringVisitors()
    ]);

    const allAlerts = [...offSchedule, ...visitors];
    const filtered = allAlerts.filter(alert => !this.isResolved(alert.id));
    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  static markResolved(alertId) {
    if (!alertId) return;
    this.resolvedAlertIds.add(alertId.toString());
  }

  static isResolved(alertId) {
    return this.resolvedAlertIds.has(alertId?.toString());
  }
}

export default AlertService;










