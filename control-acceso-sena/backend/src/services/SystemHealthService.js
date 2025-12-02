// System Health Service - Monitoreo de salud del sistema
import pool from '../utils/dbPool.js';
import AlertService from './AlertService.js';

class SystemHealthService {
  // Obtener métricas de salud del sistema
  static async getSystemHealth() {
    try {
      // Verificar conexión a la base de datos
      await pool.execute('SELECT 1');

      // Obtener métricas básicas
      const [usersCount] = await pool.execute('SELECT COUNT(*) as total FROM Usuarios');
      const [accessesToday] = await pool.execute(`
        SELECT COUNT(*) as total FROM Accesos 
        WHERE DATE(fecha_entrada) = CURDATE()
      `);
      const [pendingAlerts] = await pool.execute(`
        SELECT COUNT(*) as total FROM Alertas 
        WHERE leida = FALSE
      `);
      const [activeVisitors] = await pool.execute(`
        SELECT COUNT(*) as total FROM Visitantes 
        WHERE estado = 'activo' AND fecha_fin IS NULL
      `);

      // Verificar espacio en base de datos (aproximado)
      const [dbSize] = await pool.execute(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);

      return {
        status: 'healthy',
        database: {
          connected: true,
          size_mb: dbSize[0]?.size_mb || 0
        },
        metrics: {
          total_users: usersCount[0].total,
          accesses_today: accessesToday[0].total,
          pending_alerts: pendingAlerts[0].total,
          active_visitors: activeVisitors[0].total
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Verificar salud del sistema y generar alertas si es necesario
  static async checkSystemHealth() {
    const health = await this.getSystemHealth();
    const alertsCreated = [];

    // Verificar si hay demasiadas alertas pendientes
    if (health.metrics?.pending_alerts > 50) {
      try {
        const alertId = await AlertService.createAlert({
          tipo: 'sistema',
          severidad: 'alta',
          titulo: 'Muchas alertas pendientes',
          mensaje: `Hay ${health.metrics.pending_alerts} alertas pendientes de revisar`,
          metadata: {
            metric: 'pending_alerts',
            value: health.metrics.pending_alerts,
            threshold: 50
          }
        });
        if (alertId !== null) {
          alertsCreated.push(alertId);
        }
      } catch (error) {
        console.error('Error al crear alerta de muchas alertas pendientes:', error.message);
      }
    }

    // Verificar tamaño de la base de datos
    if (health.database?.size_mb > 1000) {
      try {
        const alertId = await AlertService.createAlert({
          tipo: 'sistema',
          severidad: 'media',
          titulo: 'Base de datos grande',
          mensaje: `La base de datos tiene ${health.database.size_mb} MB. Considere realizar limpieza.`,
          metadata: {
            metric: 'database_size',
            value: health.database.size_mb,
            threshold: 1000
          }
        });
        if (alertId !== null) {
          alertsCreated.push(alertId);
        }
      } catch (error) {
        console.error('Error al crear alerta de base de datos grande:', error.message);
      }
    }

    // Verificar si la base de datos no está conectada
    if (health.status === 'unhealthy') {
      try {
        const alertId = await AlertService.createAlert({
          tipo: 'sistema',
          severidad: 'critica',
          titulo: 'Problema de conexión a base de datos',
          mensaje: `Error al conectar con la base de datos: ${health.error}`,
          metadata: {
            error: health.error
          }
        });
        if (alertId !== null) {
          alertsCreated.push(alertId);
        }
      } catch (error) {
        console.error('Error al crear alerta de problema de conexión:', error.message);
      }
    }

    return {
      health,
      alertsCreated
    };
  }

  // Obtener estadísticas de rendimiento
  static async getPerformanceStats() {
    const [slowQueries] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        AVG(TIMESTAMPDIFF(MICROSECOND, fecha_creacion, fecha_actualizacion)) as avg_time
      FROM Accesos
      WHERE DATE(fecha_creacion) = CURDATE()
    `);

    const [recentErrors] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM Logs_Seguridad
      WHERE exito = FALSE
      AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    return {
      slow_queries: slowQueries[0] || { total: 0, avg_time: 0 },
      recent_errors: recentErrors[0]?.total || 0,
      timestamp: new Date().toISOString()
    };
  }
}

export default SystemHealthService;










