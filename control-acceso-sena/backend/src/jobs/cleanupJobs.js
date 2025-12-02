// Cleanup Jobs - Tareas de limpieza automática
import pool from '../utils/dbPool.js';

// Limpiar logs antiguos
export const cleanOldLogs = async (daysToKeep = 90) => {
  try {
    console.log(`🧹 Limpiando logs más antiguos de ${daysToKeep} días...`);

    // Limpiar logs de seguridad antiguos
    const [securityLogsResult] = await pool.execute(`
      DELETE FROM Logs_Seguridad
      WHERE fecha < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysToKeep]);
    console.log(`✅ Eliminados ${securityLogsResult.affectedRows} logs de seguridad antiguos`);

    // Limpiar logs de auditoría antiguos
    const [auditLogsResult] = await pool.execute(`
      DELETE FROM Auditoria
      WHERE fecha < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysToKeep]);
    console.log(`✅ Eliminados ${auditLogsResult.affectedRows} logs de auditoría antiguos`);

    // Limpiar alertas leídas antiguas (más de 30 días)
    const [alertsResult] = await pool.execute(`
      DELETE FROM Alertas
      WHERE leida = TRUE
      AND fecha_lectura < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    console.log(`✅ Eliminadas ${alertsResult.affectedRows} alertas leídas antiguas`);

    return {
      securityLogs: securityLogsResult.affectedRows,
      auditLogs: auditLogsResult.affectedRows,
      alerts: alertsResult.affectedRows
    };
  } catch (error) {
    console.error('❌ Error limpiando logs antiguos:', error);
    throw error;
  }
};

// Archivar registros de acceso antiguos
export const archiveOldAccessRecords = async (daysToKeep = 365) => {
  try {
    console.log(`📦 Archivando registros de acceso más antiguos de ${daysToKeep} días...`);

    // Por ahora solo marcamos como finalizados los muy antiguos
    // En producción se podría mover a una tabla de archivo
    const [result] = await pool.execute(`
      UPDATE Accesos
      SET estado = 'finalizado'
      WHERE estado = 'activo'
      AND fecha_entrada < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND fecha_salida IS NOT NULL
    `, [daysToKeep]);
    console.log(`✅ Archivados ${result.affectedRows} registros de acceso antiguos`);

    return result.affectedRows;
  } catch (error) {
    console.error('❌ Error archivando registros de acceso:', error);
    throw error;
  }
};

// Limpiar evidencias temporales expiradas
export const cleanExpiredEvidence = async (daysToKeep = 180) => {
  try {
    console.log(`🗑️  Limpiando evidencias más antiguas de ${daysToKeep} días...`);

    const [result] = await pool.execute(`
      DELETE FROM Evidencia_Fotografica
      WHERE fecha_captura < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND tipo_incidente = 'evidencia_general'
    `, [daysToKeep]);
    console.log(`✅ Eliminadas ${result.affectedRows} evidencias temporales expiradas`);

    return result.affectedRows;
  } catch (error) {
    console.error('❌ Error limpiando evidencias:', error);
    throw error;
  }
};

// Ejecutar todas las tareas de limpieza
export const runCleanupTasks = async () => {
  try {
    console.log('🧹 Iniciando tareas de limpieza diaria...');

    const logsCleaned = await cleanOldLogs(90);
    const accessArchived = await archiveOldAccessRecords(365);
    const evidenceCleaned = await cleanExpiredEvidence(180);

    console.log('✅ Tareas de limpieza completadas:', {
      logsCleaned,
      accessArchived,
      evidenceCleaned
    });

    return {
      logsCleaned,
      accessArchived,
      evidenceCleaned
    };
  } catch (error) {
    console.error('❌ Error en tareas de limpieza:', error);
    throw error;
  }
};

// Ejecutar diariamente a las 2 AM
export const startCleanupJobs = () => {
  console.log('🚀 Iniciando jobs de limpieza (diario a las 2 AM)');

  const scheduleDailyCleanup = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM

    const msUntil2AM = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      runCleanupTasks();
      // Programar para el siguiente día
      setInterval(() => {
        runCleanupTasks();
      }, 24 * 60 * 60 * 1000); // 24 horas
    }, msUntil2AM);
  };

  scheduleDailyCleanup();
};

















