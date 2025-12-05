// Alert Service - Gestión de alertas persistentes en base de datos
import pool from '../utils/dbPool.js';
import { getRegistroIdField } from '../utils/columnResolver.js';

class AlertService {
  /**
   * Crear una nueva alerta en la base de datos
   * Tipos válidos: 'acceso_fuera_horario', 'intento_fraudulento', 'qr_expirado', 
   *                'documento_no_registrado', 'comportamiento_sospechoso', 'sistema', 'seguridad'
   */
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
        return null;
      }

      // Mapear tipos a los válidos del ENUM
      const tipoMapeado = this.mapAlertType(tipo);

      console.log(`📝 Creando alerta en BD: ${tipoMapeado} - ${titulo}`);

      const [result] = await pool.execute(
        `INSERT INTO Alertas 
         (tipo, severidad, titulo, mensaje, id_persona, id_acceso, id_usuario, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipoMapeado,
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
      console.log(`✅ Alerta creada en BD con ID: ${alertId}`);
      return alertId;
    } catch (error) {
      console.error('❌ Error al crear alerta:', error.message);
      
      // Si es error de tabla no existe, no fallar silenciosamente
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.error('⚠️  La tabla Alertas no existe. Ejecuta el script de inicialización.');
      }
      
      return null;
    }
  }

  /**
   * Mapear tipos de alerta a los válidos del ENUM
   */
  static mapAlertType(tipo) {
    const mapping = {
      'qr_invalido': 'intento_fraudulento',
      'acceso_denegado': 'documento_no_registrado',
      'acceso_frecuente': 'comportamiento_sospechoso',
      'acceso_fuera_horario': 'acceso_fuera_horario',
      'qr_expirado': 'qr_expirado',
      'intento_fraudulento': 'intento_fraudulento',
      'documento_no_registrado': 'documento_no_registrado',
      'comportamiento_sospechoso': 'comportamiento_sospechoso',
      'sistema': 'sistema',
      'seguridad': 'seguridad'
    };
    return mapping[tipo] || 'sistema';
  }

  /**
   * Obtener alertas de la base de datos con filtros
   */
  static async getAlerts(filters = {}) {
    try {
      const {
        tipo = null,
        severidad = null,
        leida = null,
        limit = 50,
        offset = 0
      } = filters;

      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);

      let query = `
        SELECT 
          a.id_alerta,
          a.tipo,
          a.severidad,
          a.titulo,
          a.mensaje,
          a.id_persona,
          a.id_acceso,
          a.id_usuario,
          a.leida,
          a.fecha_creacion,
          a.fecha_lectura,
          a.id_usuario_lectura,
          a.metadata,
          COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombres, 'N/A') as persona_nombre,
          p.documento
        FROM Alertas a
        LEFT JOIN Personas p ON a.id_persona = p.id_persona
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

      query += ` ORDER BY a.fecha_creacion DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      console.log('📋 [AlertService.getAlerts] Query:', query);
      console.log('📋 [AlertService.getAlerts] Params:', params);

      const [rows] = await pool.execute(query, params);

      console.log(`📋 [AlertService.getAlerts] Filas obtenidas: ${rows.length}`);

      return rows.map(row => {
        let metadata = null;
        if (row.metadata) {
          try {
            metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          } catch (e) {
            metadata = null;
          }
        }
        
        return {
          id: row.id_alerta,
          id_alerta: row.id_alerta,
          type: row.tipo,
          tipo: row.tipo,
          severity: row.severidad,
          severidad: row.severidad,
          title: row.titulo,
          titulo: row.titulo,
          message: row.mensaje,
          mensaje: row.mensaje,
          id_persona: row.id_persona,
          persona_nombre: row.persona_nombre,
          documento: row.documento,
          leida: row.leida,
          createdAt: row.fecha_creacion,
          fecha_creacion: row.fecha_creacion,
          fecha_lectura: row.fecha_lectura,
          metadata
        };
      });
    } catch (error) {
      console.error('❌ Error en AlertService.getAlerts:', error.message);
      console.error('❌ Código de error:', error.code);
      console.error('❌ SQL State:', error.sqlState);
      console.error('❌ Stack:', error.stack);
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.warn('⚠️  Tabla Alertas no existe, retornando array vacío');
        return [];
      }

      // Intentar consulta simple sin JOINs para diagnosticar
      try {
        console.log('🔄 Intentando consulta simple sin JOINs...');
        const [simpleRows] = await pool.execute(
          'SELECT * FROM Alertas ORDER BY fecha_creacion DESC LIMIT 50'
        );
        console.log(`✅ Consulta simple exitosa: ${simpleRows.length} alertas`);
        return simpleRows.map(row => ({
          id: row.id_alerta,
          id_alerta: row.id_alerta,
          type: row.tipo,
          tipo: row.tipo,
          severity: row.severidad,
          severidad: row.severidad,
          title: row.titulo,
          titulo: row.titulo,
          message: row.mensaje,
          mensaje: row.mensaje,
          leida: row.leida,
          createdAt: row.fecha_creacion,
          fecha_creacion: row.fecha_creacion,
          metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null
        }));
      } catch (simpleError) {
        console.error('❌ Error en consulta simple:', simpleError.message);
        return [];
      }
    }
  }

  /**
   * Marcar alerta como leída
   */
  static async markAsRead(alertId, userId) {
    try {
      const [result] = await pool.execute(
        `UPDATE Alertas 
         SET leida = TRUE, fecha_lectura = NOW(), id_usuario_lectura = ?
         WHERE id_alerta = ?`,
        [userId, alertId]
      );

      if (result.affectedRows === 0) {
        console.warn(`⚠️ Alerta ${alertId} no encontrada para marcar como leída`);
        return false;
      }

      console.log(`✅ Alerta ${alertId} marcada como leída`);
      return true;
    } catch (error) {
      console.error('Error en AlertService.markAsRead:', error.message);
      return false;
    }
  }

  /**
   * Eliminar alerta
   */
  static async deleteAlert(alertId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM Alertas WHERE id_alerta = ?',
        [alertId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en AlertService.deleteAlert:', error.message);
      return false;
    }
  }

  /**
   * Eliminar alertas leídas antiguas
   */
  static async deleteOldReadAlerts(daysOld = 7) {
    try {
      const [result] = await pool.execute(
        `DELETE FROM Alertas 
         WHERE leida = TRUE 
         AND fecha_lectura < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
      );
      console.log(`🗑️ ${result.affectedRows} alertas antiguas eliminadas`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error eliminando alertas antiguas:', error.message);
      return 0;
    }
  }

  /**
   * Obtener estadísticas de alertas
   */
  static async getAlertStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN leida = FALSE THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN leida = FALSE AND severidad = 'critica' THEN 1 ELSE 0 END) as criticas_pendientes,
          SUM(CASE WHEN leida = FALSE AND severidad = 'alta' THEN 1 ELSE 0 END) as altas_pendientes,
          SUM(CASE WHEN DATE(fecha_creacion) = CURDATE() THEN 1 ELSE 0 END) as hoy
        FROM Alertas
      `);

      const [byType] = await pool.execute(`
        SELECT tipo, COUNT(*) as cantidad
        FROM Alertas
        WHERE leida = FALSE
        GROUP BY tipo
      `);

      const [bySeverity] = await pool.execute(`
        SELECT severidad, COUNT(*) as cantidad
        FROM Alertas
        WHERE leida = FALSE
        GROUP BY severidad
      `);

      return {
        total: stats[0]?.total || 0,
        pendientes: stats[0]?.pendientes || 0,
        criticas_pendientes: stats[0]?.criticas_pendientes || 0,
        altas_pendientes: stats[0]?.altas_pendientes || 0,
        hoy: stats[0]?.hoy || 0,
        porTipo: byType,
        porSeveridad: bySeverity
      };
    } catch (error) {
      console.error('Error en getAlertStats:', error.message);
      return {
        total: 0,
        pendientes: 0,
        criticas_pendientes: 0,
        altas_pendientes: 0,
        hoy: 0,
        porTipo: [],
        porSeveridad: []
      };
    }
  }

  // ============ DETECCIÓN Y CREACIÓN AUTOMÁTICA DE ALERTAS ============

  /**
   * Detectar y crear alertas de accesos fuera de horario
   */
  static async detectAndCreateOffScheduleAlerts() {
    try {
      const idColumn = await getRegistroIdField();
      
      // Buscar accesos fuera de horario que no tengan alerta ya creada
      // Usar subquery más específica para evitar duplicados
      const [rows] = await pool.execute(`
        SELECT 
          r.${idColumn} as id_acceso,
          r.fecha_hora,
          p.id_persona,
          p.documento,
          COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombres, 'Sin nombre') as persona_nombre,
          TIME(r.fecha_hora) as hora_acceso
        FROM registros_entrada_salida r
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        WHERE DATE(r.fecha_hora) = CURDATE()
          AND (HOUR(r.fecha_hora) < 6 OR HOUR(r.fecha_hora) > 22)
          AND r.tipo = 'ENTRADA'
          AND r.${idColumn} NOT IN (
            SELECT DISTINCT CAST(JSON_EXTRACT(a.metadata, '$.id_acceso') AS UNSIGNED)
            FROM Alertas a 
            WHERE a.tipo = 'acceso_fuera_horario'
              AND a.metadata IS NOT NULL
              AND JSON_EXTRACT(a.metadata, '$.id_acceso') IS NOT NULL
              AND DATE(a.fecha_creacion) = CURDATE()
          )
        LIMIT 20
      `);

      let alertasCreadas = 0;
      for (const row of rows) {
        const alertId = await this.createAlert({
          tipo: 'acceso_fuera_horario',
          severidad: 'media',
          titulo: 'Acceso fuera de horario',
          mensaje: `${row.persona_nombre} (${row.documento}) ingresó fuera del horario permitido a las ${row.hora_acceso}`,
          id_persona: row.id_persona,
          metadata: {
            id_acceso: row.id_acceso,
            documento: row.documento,
            hora_acceso: row.hora_acceso,
            subtipo: 'acceso_fuera_horario'
          }
        });
        if (alertId) alertasCreadas++;
      }

      return alertasCreadas;
    } catch (error) {
      console.error('Error detectando accesos fuera de horario:', error.message);
      return 0;
    }
  }

  /**
   * Detectar y crear alertas de QR inválido / acceso denegado desde logs
   */
  static async detectAndCreateFailedAccessAlerts() {
    try {
      // Buscar logs de acceso denegado/QR inválido que no tengan alerta
      // Usar búsqueda más específica para evitar duplicados
      const [rows] = await pool.execute(`
        SELECT 
          ls.id_log,
          ls.accion,
          ls.detalles,
          ls.ip_address,
          ls.fecha
        FROM logs_seguridad ls
        WHERE ls.tipo = 'acceso_sistema'
          AND DATE(ls.fecha) = CURDATE()
          AND (ls.accion LIKE '%[QR_INVALIDO]%' OR ls.accion LIKE '%[ACCESO_DENEGADO]%')
          AND ls.id_log NOT IN (
            SELECT DISTINCT CAST(JSON_EXTRACT(a.metadata, '$.id_log') AS UNSIGNED)
            FROM Alertas a 
            WHERE a.metadata IS NOT NULL 
              AND JSON_EXTRACT(a.metadata, '$.id_log') IS NOT NULL
              AND DATE(a.fecha_creacion) = CURDATE()
          )
        ORDER BY ls.fecha DESC
        LIMIT 30
      `);

      let alertasCreadas = 0;
      for (const row of rows) {
        let detalles = {};
        try {
          detalles = typeof row.detalles === 'string' ? JSON.parse(row.detalles) : (row.detalles || {});
        } catch (e) {
          detalles = {};
        }

        const esQrInvalido = row.accion.includes('[QR_INVALIDO]');
        const tipo = esQrInvalido ? 'intento_fraudulento' : 'documento_no_registrado';
        const severidad = esQrInvalido ? 'media' : 'alta';
        const titulo = esQrInvalido ? 'QR Inválido Detectado' : 'Acceso Denegado';

        const alertId = await this.createAlert({
          tipo,
          severidad,
          titulo,
          mensaje: row.accion.replace('[QR_INVALIDO] ', '').replace('[ACCESO_DENEGADO] ', ''),
          metadata: {
            id_log: row.id_log,
            documento: detalles.documento || 'desconocido',
            motivo: detalles.motivo,
            ip_address: row.ip_address,
            subtipo: esQrInvalido ? 'qr_invalido' : 'acceso_denegado'
          }
        });
        if (alertId) alertasCreadas++;
      }

      return alertasCreadas;
    } catch (error) {
      console.error('Error detectando accesos fallidos:', error.message);
      return 0;
    }
  }

  /**
   * Detectar y crear alertas de accesos frecuentes (comportamiento sospechoso)
   */
  static async detectAndCreateFrequentAccessAlerts() {
    try {
      // Detectar personas con más de 4 accesos en las últimas 2 horas
      // que no tengan ya una alerta de comportamiento sospechoso reciente
      const [rows] = await pool.execute(`
        SELECT 
          p.id_persona,
          p.documento,
          COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombres, 'Sin nombre') as persona_nombre,
          COUNT(*) as total_accesos,
          MIN(r.fecha_hora) as primer_acceso,
          MAX(r.fecha_hora) as ultimo_acceso
        FROM registros_entrada_salida r
        INNER JOIN Personas p ON r.id_persona = p.id_persona
        WHERE r.tipo = 'ENTRADA'
          AND r.fecha_hora >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
          AND p.id_persona NOT IN (
            SELECT DISTINCT a.id_persona 
            FROM Alertas a 
            WHERE a.tipo = 'comportamiento_sospechoso'
              AND a.id_persona IS NOT NULL
              AND a.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
          )
        GROUP BY p.id_persona, p.documento, persona_nombre
        HAVING COUNT(*) > 4
        ORDER BY total_accesos DESC
        LIMIT 10
      `);

      let alertasCreadas = 0;
      for (const row of rows) {
        const alertId = await this.createAlert({
          tipo: 'comportamiento_sospechoso',
          severidad: row.total_accesos > 6 ? 'alta' : 'media',
          titulo: 'Accesos Frecuentes Detectados',
          mensaje: `${row.persona_nombre} (${row.documento}) ha registrado ${row.total_accesos} entradas en las últimas 2 horas`,
          id_persona: row.id_persona,
          metadata: {
            documento: row.documento,
            total_accesos: row.total_accesos,
            primer_acceso: row.primer_acceso,
            ultimo_acceso: row.ultimo_acceso,
            subtipo: 'acceso_frecuente'
          }
        });
        if (alertId) alertasCreadas++;
      }

      return alertasCreadas;
    } catch (error) {
      console.error('Error detectando accesos frecuentes:', error.message);
      return 0;
    }
  }

  /**
   * Detectar y crear alertas de visitantes próximos a expirar
   */
  static async detectAndCreateExpiringVisitorAlerts() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          v.id_visitante,
          v.fecha_inicio,
          p.id_persona,
          COALESCE(CONCAT(p.nombres, ' ', p.apellidos), p.nombres, 'Sin nombre') as persona_nombre,
          p.documento,
          TIMESTAMPDIFF(HOUR, v.fecha_inicio, NOW()) as horas_transcurridas
        FROM visitantes v
        INNER JOIN Personas p ON v.id_persona = p.id_persona
        WHERE v.estado IN ('activo', 'ACTIVO')
          AND (v.fecha_fin IS NULL OR v.fecha_fin > NOW())
          AND TIMESTAMPDIFF(HOUR, v.fecha_inicio, NOW()) BETWEEN 22 AND 24
          AND NOT EXISTS (
            SELECT 1 FROM Alertas a 
            WHERE a.tipo = 'qr_expirado'
            AND a.id_persona = p.id_persona
            AND a.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 3 HOUR)
          )
        LIMIT 20
      `);

      let alertasCreadas = 0;
      for (const row of rows) {
        const alertId = await this.createAlert({
          tipo: 'qr_expirado',
          severidad: 'baja',
          titulo: 'Visitante Próximo a Expirar',
          mensaje: `El QR de ${row.persona_nombre} (${row.documento}) expirará en menos de 2 horas`,
          id_persona: row.id_persona,
          metadata: {
            id_visitante: row.id_visitante,
            documento: row.documento,
            horas_transcurridas: row.horas_transcurridas,
            subtipo: 'qr_expirado'
          }
        });
        if (alertId) alertasCreadas++;
      }

      return alertasCreadas;
    } catch (error) {
      console.error('Error detectando visitantes próximos a expirar:', error.message);
      return 0;
    }
  }

  /**
   * Ejecutar todas las detecciones y crear alertas
   * Se debe llamar periódicamente (ej: cada 5 minutos)
   */
  static async runAllDetections() {
    console.log('🔍 Ejecutando detección de alertas...');
    
    const results = await Promise.all([
      this.detectAndCreateOffScheduleAlerts(),
      this.detectAndCreateFailedAccessAlerts(),
      this.detectAndCreateFrequentAccessAlerts(),
      this.detectAndCreateExpiringVisitorAlerts()
    ]);

    const totalCreadas = results.reduce((sum, count) => sum + count, 0);
    console.log(`✅ Detección completada: ${totalCreadas} alertas creadas`);
    console.log(`   - Fuera de horario: ${results[0]}`);
    console.log(`   - Accesos fallidos: ${results[1]}`);
    console.log(`   - Accesos frecuentes: ${results[2]}`);
    console.log(`   - Visitantes expirando: ${results[3]}`);

    return {
      total: totalCreadas,
      fuera_horario: results[0],
      accesos_fallidos: results[1],
      accesos_frecuentes: results[2],
      visitantes_expirando: results[3]
    };
  }
}

export default AlertService;
