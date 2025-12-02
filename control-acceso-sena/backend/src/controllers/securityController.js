// Security Controller - Controlador principal de seguridad
import AlertService from '../services/AlertService.js';
import FraudDetectionService from '../services/FraudDetectionService.js';
import SystemHealthService from '../services/SystemHealthService.js';
import pool from '../utils/dbPool.js';

// Obtener todas las alertas
export const getAlerts = async (req, res) => {
  try {
    const { tipo, severidad, leida, limit = 50, offset = 0 } = req.query;
    
    const alerts = await AlertService.getAlerts({
      tipo: tipo || null,
      severidad: severidad || null,
      leida: leida !== undefined ? leida === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error en getAlerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Marcar alerta como leída
export const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // El token JWT contiene 'id' (no 'id_usuario')
    const userId = req.user?.id || null;

    if (!userId) {
      console.error('❌ Usuario no autenticado. req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar que el ID de la alerta sea un número válido
    const alertId = parseInt(id);
    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de alerta inválido'
      });
    }

    await AlertService.markAsRead(alertId, userId);

    res.json({
      success: true,
      message: 'Alerta marcada como leída'
    });
  } catch (error) {
    console.error('❌ Error en markAlertAsRead:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ User object:', req.user);
    console.error('❌ Alert ID:', req.params.id);
    
    // Si la tabla no existe, retornar error específico
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('no existe')) {
      return res.status(404).json({
        success: false,
        message: 'La tabla de alertas no existe'
      });
    }
    
    // Si la alerta no existe
    if (error.message?.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta como leída',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas de alertas
export const getAlertStats = async (req, res) => {
  try {
    const stats = await AlertService.getAlertStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error en getAlertStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar alerta
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_usuario;

    // Verificar que la alerta existe y está leída (opcional: solo permitir eliminar alertas leídas)
    const [alerts] = await pool.execute(
      'SELECT id_alerta, leida FROM Alertas WHERE id_alerta = ?',
      [id]
    );

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    // Opcional: Solo permitir eliminar alertas leídas
    // if (!alerts[0].leida) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Solo se pueden eliminar alertas que han sido leídas'
    //   });
    // }

    const deleted = await AlertService.deleteAlert(id);

    if (deleted) {
      console.log(`✅ Alerta ${id} eliminada por usuario ${userId}`);
      res.json({
        success: true,
        message: 'Alerta eliminada exitosamente'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
  } catch (error) {
    console.error('Error en deleteAlert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar alerta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar alertas leídas antiguas
export const deleteOldReadAlerts = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Por defecto eliminar alertas leídas de hace más de 30 días
    const userId = req.user.id_usuario;

    const deletedCount = await AlertService.deleteReadAlerts(parseInt(days));

    console.log(`✅ ${deletedCount} alertas leídas antiguas eliminadas por usuario ${userId}`);

    res.json({
      success: true,
      message: `${deletedCount} alertas eliminadas`,
      deletedCount
    });
  } catch (error) {
    console.error('Error en deleteOldReadAlerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar alertas antiguas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ejecutar verificación inmediata de alertas
export const checkAlertsNow = async (req, res) => {
  try {
    const offScheduleAlerts = await AlertService.checkOffScheduleAccess();
    const expiringVisitors = await AlertService.checkExpiringVisitors();
    const fraudAttempts = await FraudDetectionService.detectFailedLoginAttempts();
    const suspiciousBehavior = await FraudDetectionService.detectSuspiciousBehavior();

    res.json({
      success: true,
      message: 'Verificación completada',
      data: {
        offScheduleAlerts: offScheduleAlerts.length,
        expiringVisitors: expiringVisitors.length,
        fraudAttempts: fraudAttempts.length,
        suspiciousBehavior: suspiciousBehavior.length,
        total: offScheduleAlerts.length + expiringVisitors.length + fraudAttempts.length + suspiciousBehavior.length
      }
    });
  } catch (error) {
    console.error('Error en checkAlertsNow:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar verificación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener salud del sistema
export const getSystemHealth = async (req, res) => {
  try {
    const health = await SystemHealthService.getSystemHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error en getSystemHealth:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener salud del sistema',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Detectar fraudes
export const detectFraud = async (req, res) => {
  try {
    const failedLogins = await FraudDetectionService.detectFailedLoginAttempts();
    const suspiciousBehavior = await FraudDetectionService.detectSuspiciousBehavior();

    res.json({
      success: true,
      data: {
        failedLoginAttempts: failedLogins.length,
        suspiciousBehavior: suspiciousBehavior.length,
        total: failedLogins.length + suspiciousBehavior.length
      }
    });
  } catch (error) {
    console.error('Error en detectFraud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al detectar fraudes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener intentos sospechosos
export const getSuspiciousAttempts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const attempts = await FraudDetectionService.getSuspiciousAttempts(parseInt(limit));

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Error en getSuspiciousAttempts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener intentos sospechosos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener métricas de seguridad
export const getSecurityMetrics = async (req, res) => {
  try {
    const alertStats = await AlertService.getAlertStats();
    const health = await SystemHealthService.getSystemHealth();
    const performance = await SystemHealthService.getPerformanceStats();

    res.json({
      success: true,
      data: {
        alerts: alertStats,
        systemHealth: health,
        performance
      }
    });
  } catch (error) {
    console.error('Error en getSecurityMetrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de seguridad',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};










