// Fraud Detection Service - Detección de intentos fraudulentos
import pool from '../utils/dbPool.js';
import AlertService from './AlertService.js';

class FraudDetectionService {
  // Detectar múltiples intentos fallidos de login
  static async detectFailedLoginAttempts() {
    const [rows] = await pool.execute(`
      SELECT 
        ip_address,
        COUNT(*) as intentos_fallidos,
        MIN(fecha) as primer_intento,
        MAX(fecha) as ultimo_intento,
        TIMESTAMPDIFF(MINUTE, MIN(fecha), MAX(fecha)) as minutos_transcurridos
      FROM Logs_Seguridad 
      WHERE tipo = 'login_fallido'
      AND fecha >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
      GROUP BY ip_address
      HAVING COUNT(*) >= 3
    `);

    const fraudsDetected = [];
    for (const row of rows) {
      // Verificar si ya existe una alerta reciente para esta IP
      const [existingAlerts] = await pool.execute(`
        SELECT id_alerta FROM Alertas
        WHERE tipo = 'intento_fraudulento'
        AND metadata->>'$.ip_address' = ?
        AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `, [row.ip_address]);

      if (existingAlerts.length === 0) {
        try {
          const alertId = await AlertService.createAlert({
            tipo: 'intento_fraudulento',
            severidad: row.intentos_fallidos >= 5 ? 'critica' : 'alta',
            titulo: 'Múltiples intentos fallidos de login',
            mensaje: `Se detectaron ${row.intentos_fallidos} intentos fallidos de login desde la IP ${row.ip_address} en ${row.minutos_transcurridos} minutos`,
            metadata: {
              ip_address: row.ip_address,
              intentos_fallidos: row.intentos_fallidos,
              primer_intento: row.primer_intento,
              ultimo_intento: row.ultimo_intento
            }
          });
          // Solo agregar si la alerta se creó exitosamente (no es null)
          if (alertId !== null) {
            fraudsDetected.push(alertId);
          }
        } catch (error) {
          console.error(`Error al crear alerta de intento fraudulento para IP ${row.ip_address}:`, error.message);
          // Continuar con el siguiente registro aunque falle uno
        }
      }
    }

    return fraudsDetected;
  }

  // Detectar comportamiento sospechoso (múltiples entradas/salidas rápidas)
  static async detectSuspiciousBehavior() {
    const [rows] = await pool.execute(`
      SELECT 
        a1.id_persona,
        p.nombre,
        p.documento,
        COUNT(*) as accesos_rapidos,
        MIN(a1.fecha_entrada) as primera_entrada,
        MAX(a1.fecha_entrada) as ultima_entrada,
        TIMESTAMPDIFF(MINUTE, MIN(a1.fecha_entrada), MAX(a1.fecha_entrada)) as minutos_transcurridos
      FROM Accesos a1
      INNER JOIN Personas p ON a1.id_persona = p.id_persona
      WHERE DATE(a1.fecha_entrada) = CURDATE()
      AND a1.tipo_acceso = 'entrada'
      GROUP BY a1.id_persona
      HAVING COUNT(*) >= 5 
      AND TIMESTAMPDIFF(MINUTE, MIN(a1.fecha_entrada), MAX(a1.fecha_entrada)) <= 30
    `);

    const fraudsDetected = [];
    for (const row of rows) {
      const [existingAlerts] = await pool.execute(`
        SELECT id_alerta FROM Alertas
        WHERE tipo = 'comportamiento_sospechoso'
        AND id_persona = ?
        AND DATE(fecha_creacion) = CURDATE()
      `, [row.id_persona]);

      if (existingAlerts.length === 0) {
        try {
          const alertId = await AlertService.createAlert({
            tipo: 'comportamiento_sospechoso',
            severidad: 'alta',
            titulo: 'Comportamiento sospechoso detectado',
            mensaje: `${row.nombre} (${row.documento}) ha realizado ${row.accesos_rapidos} accesos en ${row.minutos_transcurridos} minutos`,
            id_persona: row.id_persona,
            metadata: {
              accesos_rapidos: row.accesos_rapidos,
              minutos_transcurridos: row.minutos_transcurridos
            }
          });
          // Solo agregar si la alerta se creó exitosamente (no es null)
          if (alertId !== null) {
            fraudsDetected.push(alertId);
          }
        } catch (error) {
          console.error(`Error al crear alerta de comportamiento sospechoso para ${row.documento}:`, error.message);
          // Continuar con el siguiente registro aunque falle uno
        }
      }
    }

    return fraudsDetected;
  }

  // Detectar uso de QR duplicado simultáneo
  static async detectDuplicateQRUsage() {
    // Esta verificación se haría cuando se escanea un QR
    // Por ahora retornamos un array vacío
    return [];
  }

  // Obtener intentos sospechosos recientes
  static async getSuspiciousAttempts(limit = 20) {
    const [rows] = await pool.execute(`
      SELECT 
        ls.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM Logs_Seguridad ls
      LEFT JOIN Usuarios u ON ls.id_usuario = u.id_usuario
      WHERE ls.tipo = 'login_fallido'
      AND ls.fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY ls.fecha DESC
      LIMIT ?
    `, [limit]);

    return rows.map(row => ({
      ...row,
      detalles: row.detalles ? JSON.parse(row.detalles) : null
    }));
  }

  // Bloquear IP temporalmente (guardar en metadata de alerta)
  static async blockIP(ipAddress, minutes = 30) {
    try {
      const alertId = await AlertService.createAlert({
        tipo: 'intento_fraudulento',
        severidad: 'critica',
        titulo: 'IP bloqueada temporalmente',
        mensaje: `La IP ${ipAddress} ha sido bloqueada por ${minutes} minutos debido a múltiples intentos fallidos`,
        metadata: {
          ip_address: ipAddress,
          bloqueada: true,
          bloqueo_hasta: new Date(Date.now() + minutes * 60 * 1000).toISOString()
        }
      });

      return alertId;
    } catch (error) {
      console.error(`Error al crear alerta de bloqueo de IP ${ipAddress}:`, error.message);
      throw error;
    }
  }
}

export default FraudDetectionService;










